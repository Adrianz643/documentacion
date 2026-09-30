import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CatalogosUsuarios } from '../../core/models';
import { UsuarioService } from '../../core/services/usuario.service';
import { AuthService } from '../../core/services/auth.service';

const PASSWORD_MIN_LENGTH = 8;

@Component({
  selector: 'app-mi-perfil-editar', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './mi-perfil-editar.component.html', styleUrl: './mi-perfil-editar.component.scss',
})
export class MiPerfilEditarComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private usuarioService = inject(UsuarioService);
  private auth = inject(AuthService);

  loading = signal(false);
  cargandoDatos = signal(false);
  errorMessage = signal<string | null>(null);
  guardado = signal(false);
  catalogos = signal<CatalogosUsuarios | null>(null);
  mostrarPassword = signal(false);
  mostrarConfirmarPassword = signal(false);
  passwordsNoCoinciden = signal(false);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    password: [''],
    confirmarPassword: [''],
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
    this.cargarMiPerfil();
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

    const raw = this.form.getRawValue();
    const persona = raw.persona!;

    if (raw.password) {
      if (raw.password.length < PASSWORD_MIN_LENGTH) {
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

    this.usuarioService.actualizarPerfilPropio({
      username: raw.username!.trim(),
      persona: personaPayload,
      ...(raw.password ? { password: raw.password } : {}),
    }).subscribe({
      next: (usuario) => {
        this.auth.actualizarPerfilLocal(usuario);
        this.loading.set(false);
        this.guardado.set(true);
        this.router.navigate(['/perfil']);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.message ?? 'No fue posible guardar tu perfil.');
      },
    });
  }

  private cargarCatalogos(): void {
    this.usuarioService.obtenerCatalogos().subscribe({
      next: (catalogos) => this.catalogos.set(catalogos),
      error: () => this.errorMessage.set('No fue posible cargar los catálogos.'),
    });
  }

  private cargarMiPerfil(): void {
    this.cargandoDatos.set(true);
    this.usuarioService.obtenerMiDetalle().subscribe({
      next: (usuario) => {
        this.form.patchValue({
          username: usuario.username,
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
        this.errorMessage.set('No fue posible cargar tu perfil.');
        this.cargandoDatos.set(false);
      },
    });
  }
}
