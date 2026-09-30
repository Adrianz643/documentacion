import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  ingresar(event?: Event) {
    event?.preventDefault();

    const username = this.username.trim();
    if (!username || !this.password) {
      this.errorMessage.set('Ingresa tu usuario y contraseña.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login({ username, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/dashboard');
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.message ?? 'No fue posible iniciar sesión.');
      }
    });
  }
}
