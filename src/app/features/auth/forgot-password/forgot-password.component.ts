import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);

  usuario = '';
  loading = signal(false);
  enviado = signal(false);
  errorMessage = signal<string | null>(null);

  enviar(event?: Event) {
    event?.preventDefault();

    const usuario = this.usuario.trim();
    if (!usuario) {
      this.errorMessage.set('Ingresa tu usuario o correo electrónico.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.forgotPassword(usuario).subscribe({
      next: () => {
        this.loading.set(false);
        this.enviado.set(true);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        if (error.status === 429) {
          this.errorMessage.set(error.error?.message ?? 'Demasiados intentos. Intenta más tarde.');
          return;
        }
        // El backend no distingue si el usuario existe o no (evita enumeracion);
        // cualquier otro error se trata igual que un envio exitoso.
        this.enviado.set(true);
      }
    });
  }
}
