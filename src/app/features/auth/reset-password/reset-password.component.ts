import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = this.route.snapshot.queryParamMap.get('token') ?? '';
  password = '';
  confirmPassword = '';
  loading = signal(false);
  listo = signal(false);
  errorMessage = signal<string | null>(null);

  restablecer(event?: Event) {
    event?.preventDefault();

    if (!this.token) {
      this.errorMessage.set('El enlace no es válido. Solicita uno nuevo.');
      return;
    }
    if (!this.password || this.password.length < 8) {
      this.errorMessage.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.listo.set(true);
        setTimeout(() => this.router.navigateByUrl('/login'), 2500);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.message ?? 'No fue posible restablecer la contraseña.');
      }
    });
  }
}
