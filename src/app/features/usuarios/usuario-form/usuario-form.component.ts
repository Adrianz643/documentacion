import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CatalogosUsuarios } from '../../../core/models';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/services/auth.service';

const ROLES_SOLO_SUPERADMIN = new Set(['admin', 'superadmin']);
const ROLES_CON_SUBROL = new Set(['editor', 'visor']);
const SUBROLES_VISOR = new Set(['ARDUM', 'EMPRESAS_CHINAS']);

const PASSWORD_MIN_LENGTH = 8;

@Component({
  selector: 'app-usuario-form', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './usuario-form.component.html', styleUrl: './usuario-form.component.scss',
})
export class UsuarioFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usuarioService = inject(UsuarioService);
  private auth = inject(AuthService);

  esSuperadmin = computed(() => this.auth.usuario()?.rol?.nombre?.toLowerCase() === 'superadmin');
  private rolOriginalId = signal<number | null>(null);
  rolesDisponibles = computed(() => {
    const roles = this.catalogos()?.roles ?? [];
    if (this.esSuperadmin()) return roles;
    const original = this.rolOriginalId();
    return roles.filter(r => !ROLES_SOLO_SUPERADMIN.has(r.nombre.toLowerCase()) || r.id === original);
  });

  esEdicion = signal(false);
  loading = signal(false);
  cargandoDatos = signal(false);
  errorMessage = signal<string | null>(null);
  catalogos = signal<CatalogosUsuarios | null>(null);
  mostrarPassword = signal(false);
  mostrarConfirmarPassword = signal(false);
  passwordsNoCoinciden = signal(false);

  rolIdSeleccionado = signal<number | null>(null);
  subrolesSeleccionados = signal<Set<string>>(new Set());
  subrolesTouched = signal(false);

  rolRequiereSubrol = computed(() => {
    const rol = this.catalogos()?.roles.find(r => r.id === this.rolIdSeleccionado());
    return !!rol && ROLES_CON_SUBROL.has(rol.nombre.toLowerCase());
  });

  rolEsVisor = computed(() => {
    const rol = this.catalogos()?.roles.find(r => r.id === this.rolIdSeleccionado());
    return !!rol && rol.nombre.toLowerCase() === 'visor';
  });

  subrolesVisorDisponibles = computed(() =>
    (this.catalogos()?.subroles ?? []).filter(s => SUBROLES_VISOR.has(s.clave)));

  subrolVisorSeleccionado = computed(() => {
    const [primero] = this.subrolesSeleccionados();
    return primero ?? '';
  });

  subrolesInvalido = computed(() =>
    this.rolRequiereSubrol() && this.subrolesTouched() && this.subrolesSeleccionados().size === 0);

  toggleSubrol(clave: string): void {
    this.subrolesTouched.set(true);
    this.subrolesSeleccionados.update(actuales => {
      const nuevo = new Set(actuales);
      if (nuevo.has(clave)) nuevo.delete(clave); else nuevo.add(clave);
      return nuevo;
    });
  }

  seleccionarSubrolVisor(clave: string): void {
    this.subrolesTouched.set(true);
    this.subrolesSeleccionados.set(clave ? new Set([clave]) : new Set());
  }

  private usuarioId: number | null = null;

  form = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    password: [''],
    confirmarPassword: [''],
    rolId: [null as number | null, Validators.required],
    estadoId: [null as number | null, Validators.required],
    persona: this.fb.group({
      tipoDocumentoId: [null as number | null, Validators.required],
      paisId: [null as number | null, Validators.required],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      apellidoPaterno: ['', [Validators.required, Validators.maxLength(100)]],
      apellidoMaterno: ['', [Validators.required, Validators.maxLength(100)]],
      fechaNacimiento: ['', Validators.required],
      curp: ['', [Validators.required, Validators.minLength(18), Validators.maxLength(18)]],
      rfc: [''],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
    }),
  });

  ngOnInit(): void {
    this.cargarCatalogos();
    this.form.get('rolId')?.valueChanges.subscribe((rolId) => {
      this.rolIdSeleccionado.set(rolId);
      const rol = this.catalogos()?.roles.find(r => r.id === rolId);
      if (rol && rol.nombre.toLowerCase() === 'visor') {
        this.subrolesSeleccionados.update(actuales => {
          const valido = Array.from(actuales).find(clave => SUBROLES_VISOR.has(clave));
          return valido ? new Set([valido]) : new Set();
        });
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion.set(true);
      this.usuarioId = Number(id);
      this.cargarUsuario(this.usuarioId);
    }
  }

  isInvalid(campo: string): boolean {
    const control = this.form.get(campo);
    return !!(control?.invalid && control?.touched);
  }

  isPersonaInvalid(campo: string): boolean {
    const control = this.form.get('persona')?.get(campo);
    return !!(control?.invalid && control?.touched);
  }

  verificarPasswords(): void {
    const password = this.form.get('password')?.value ?? '';
    const confirmar = this.form.get('confirmarPassword')?.value ?? '';
    this.passwordsNoCoinciden.set(!!confirmar && password !== confirmar);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.subrolesTouched.set(true);
    if (this.rolRequiereSubrol() && this.subrolesSeleccionados().size === 0) {
      this.errorMessage.set(this.rolEsVisor()
        ? 'Selecciona una empresa (ARDUM o Empresas Chinas) para este usuario visor.'
        : 'Selecciona al menos un subrol (ARDUM, ARDUM HL o Empresas Chinas) para este rol.');
      return;
    }

    const raw = this.form.getRawValue();
    const persona = raw.persona!;
    const subroles = this.rolRequiereSubrol() ? Array.from(this.subrolesSeleccionados()) : [];

    if (!this.esEdicion() || raw.password) {
      if ((raw.password ?? '').length < PASSWORD_MIN_LENGTH) {
        this.errorMessage.set(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
        return;
      }
      if (this.passwordsNoCoinciden() || raw.password !== raw.confirmarPassword) {
        this.errorMessage.set('Las contraseñas no coinciden.');
        return;
      }
    }

    const personaPayload = {
      tipoDocumentoId: Number(persona.tipoDocumentoId),
      paisId: Number(persona.paisId),
      nombre: persona.nombre!.trim(),
      apellidoPaterno: persona.apellidoPaterno!.trim(),
      apellidoMaterno: persona.apellidoMaterno!.trim(),
      fechaNacimiento: persona.fechaNacimiento!,
      curp: persona.curp!.trim().toUpperCase(),
      rfc: persona.rfc?.trim() ? persona.rfc.trim().toUpperCase() : null,
      email: persona.email!.trim().toLowerCase(),
      telefono: persona.telefono?.trim() || null,
    };

    this.loading.set(true);
    this.errorMessage.set(null);

    const peticion = this.esEdicion() && this.usuarioId
      ? this.usuarioService.actualizar(this.usuarioId, {
          username: raw.username!.trim(),
          rolId: Number(raw.rolId),
          estadoId: Number(raw.estadoId),
          persona: personaPayload,
          subroles,
          ...(raw.password ? { password: raw.password } : {}),
        })
      : this.usuarioService.crear({
          username: raw.username!.trim(),
          password: raw.password!,
          rolId: Number(raw.rolId),
          estadoId: Number(raw.estadoId),
          persona: personaPayload,
          subroles,
        });

    peticion.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/usuarios']);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.message ?? 'No fue posible guardar el usuario.');
      },
    });
  }

  private cargarCatalogos(): void {
    this.usuarioService.obtenerCatalogos().subscribe({
      next: (catalogos) => this.catalogos.set(catalogos),
      error: () => this.errorMessage.set('No fue posible cargar los catálogos.'),
    });
  }

  private cargarUsuario(id: number): void {
    this.cargandoDatos.set(true);
    this.usuarioService.obtenerDetalle(id).subscribe({
      next: (usuario) => {
        this.rolOriginalId.set(usuario.rol.id);
        this.subrolesSeleccionados.set(new Set(usuario.subroles));
        this.form.patchValue({
          username: usuario.username,
          rolId: usuario.rol.id,
          estadoId: usuario.estado.id,
          persona: {
            tipoDocumentoId: usuario.persona.tipoDocumentoId,
            paisId: usuario.persona.paisId,
            nombre: usuario.persona.nombre,
            apellidoPaterno: usuario.persona.apellidoPaterno,
            apellidoMaterno: usuario.persona.apellidoMaterno,
            fechaNacimiento: usuario.persona.fechaNacimiento,
            curp: usuario.persona.curp,
            rfc: usuario.persona.rfc ?? '',
            email: usuario.persona.email,
            telefono: usuario.persona.telefono ?? '',
          },
        });
        this.cargandoDatos.set(false);
      },
      error: () => {
        this.errorMessage.set('No fue posible cargar el usuario.');
        this.cargandoDatos.set(false);
      },
    });
  }
}
