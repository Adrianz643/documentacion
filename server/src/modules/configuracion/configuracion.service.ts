import { HttpError } from '../../utils/httpError';
import * as actividadService from '../actividad/actividad.service';
import * as configuracionRepository from './configuracion.repository';
import type { ConfiguracionAlertaFielDTO } from './configuracion.types';

const DIAS_ANTICIPACION_MINIMO = 1;
const DIAS_ANTICIPACION_MAXIMO = 90;

export async function obtenerAlertaFiel(): Promise<ConfiguracionAlertaFielDTO> {
  const diasAnticipacion = await configuracionRepository.findAlertaFielDiasAnticipacion();
  return { diasAnticipacion };
}

export async function actualizarAlertaFiel(diasAnticipacion: number, actorId: number): Promise<ConfiguracionAlertaFielDTO> {
  if (!Number.isInteger(diasAnticipacion) || diasAnticipacion < DIAS_ANTICIPACION_MINIMO || diasAnticipacion > DIAS_ANTICIPACION_MAXIMO) {
    throw new HttpError(400, `Los días de anticipación deben ser un entero entre ${DIAS_ANTICIPACION_MINIMO} y ${DIAS_ANTICIPACION_MAXIMO}`);
  }

  await configuracionRepository.actualizarAlertaFielDiasAnticipacion(diasAnticipacion, actorId);

  void actividadService.registrar({
    usuarioId: actorId,
    modulo: 'CONFIGURACION',
    accion: 'editar',
    descripcion: `Actualizó la anticipación de alertas de vencimiento de FIEL a ${diasAnticipacion} día(s)`,
    referenciaTabla: 'configuracion_alertas_fiel',
    referenciaId: 1,
  });

  return { diasAnticipacion };
}
