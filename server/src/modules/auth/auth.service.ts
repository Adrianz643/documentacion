import bcrypt from 'bcryptjs';
import { pool } from '../../config/database';
import { HttpError } from '../../utils/httpError';
import { decodeTokenExpiration, signAuthToken } from '../../utils/jwt';
import { hashToken } from '../../utils/crypto';
import type { UsuarioAuthRow } from '../../types/db.types';
import * as aparienciaRepository from '../apariencia/apariencia.repository';
import * as authRepository from './auth.repository';
import type { LoginInput, LoginResult, UsuarioAutenticadoDTO } from './auth.types';

const MAX_INTENTOS_FALLIDOS = 5;
const MINUTOS_BLOQUEO = 15;
const ESTADO_ACTIVO = 'ACTIVO';
const MOTIVO_CIERRE_LOGOUT = 'LOGOUT';

function mapUsuarioADTO(
  row: UsuarioAuthRow,
  permisos: string[],
  subroles: string[],
  modoOscuro: boolean,
): UsuarioAutenticadoDTO {
  return {
    id: row.usuario_id,
    username: row.username,
    persona: {
      id: row.persona_id,
      nombre: row.persona_nombre,
      apellidoPaterno: row.persona_apellido_paterno,
      apellidoMaterno: row.persona_apellido_materno,
      email: row.persona_email,
    },
    rol: { id: row.rol_id, nombre: row.rol_nombre },
    permisos,
    subroles,
    modoOscuro,
  };
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();

    const usuario = await authRepository.findUsuarioByUsername(connection, input.username);

    if (!usuario) {
      await authRepository.registrarIntentoLogin(connection, {
        usuarioId: null,
        exitoso: false,
        ip: input.ip,
        userAgent: input.userAgent,
        descripcion: 'Usuario inexistente',
      });
      await connection.commit();
      committed = true;
      throw new HttpError(401, 'Credenciales invalidas');
    }

    const ahora = Date.now();
    if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta).getTime() > ahora) {
      await authRepository.registrarIntentoLogin(connection, {
        usuarioId: usuario.usuario_id,
        exitoso: false,
        ip: input.ip,
        userAgent: input.userAgent,
        descripcion: 'Usuario bloqueado temporalmente',
      });
      await connection.commit();
      committed = true;
      throw new HttpError(403, 'Usuario bloqueado temporalmente. Intente nuevamente mas tarde.');
    }

    if (usuario.estado_clave !== ESTADO_ACTIVO) {
      await authRepository.registrarIntentoLogin(connection, {
        usuarioId: usuario.usuario_id,
        exitoso: false,
        ip: input.ip,
        userAgent: input.userAgent,
        descripcion: `Usuario en estado ${usuario.estado_clave}`,
      });
      await connection.commit();
      committed = true;
      throw new HttpError(403, 'El usuario no se encuentra activo');
    }

    const passwordValida = await bcrypt.compare(input.password, usuario.password_hash);

    if (!passwordValida) {
      const intentosFallidos = usuario.intentos_fallidos + 1;
      const bloqueadoHasta =
        intentosFallidos >= MAX_INTENTOS_FALLIDOS ? new Date(ahora + MINUTOS_BLOQUEO * 60_000) : null;

      await authRepository.actualizarIntentosFallidos(connection, usuario.usuario_id, intentosFallidos, bloqueadoHasta);
      await authRepository.registrarIntentoLogin(connection, {
        usuarioId: usuario.usuario_id,
        exitoso: false,
        ip: input.ip,
        userAgent: input.userAgent,
        descripcion: 'Contrasena incorrecta',
      });
      await connection.commit();
      committed = true;
      throw new HttpError(401, 'Credenciales invalidas');
    }

    await authRepository.reiniciarIntentosYRegistrarLogin(connection, usuario.usuario_id);
    const permisos = await authRepository.findPermisosByRol(connection, usuario.rol_id);
    const subroles = await authRepository.findSubrolesByUsuarioId(connection, usuario.usuario_id);

    const token = signAuthToken({
      sub: usuario.usuario_id,
      username: usuario.username,
      rol: usuario.rol_nombre,
      permisos,
      subroles,
    });

    await authRepository.crearSesion(connection, {
      usuarioId: usuario.usuario_id,
      tokenHash: hashToken(token),
      ip: input.ip,
      userAgent: input.userAgent,
      expiraEn: decodeTokenExpiration(token),
    });
    await authRepository.registrarIntentoLogin(connection, {
      usuarioId: usuario.usuario_id,
      exitoso: true,
      ip: input.ip,
      userAgent: input.userAgent,
      descripcion: 'Login exitoso',
    });

    await connection.commit();
    committed = true;

    const modoOscuro = await aparienciaRepository.findModoOscuroByUsuarioId(usuario.usuario_id);

    return { token, usuario: mapUsuarioADTO(usuario, permisos, subroles, modoOscuro) };
  } catch (error) {
    if (!committed) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function logout(token: string): Promise<void> {
  await authRepository.cerrarSesionPorTokenHash(hashToken(token), MOTIVO_CIERRE_LOGOUT);
}
