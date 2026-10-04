import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, of, retry, tap, throwError, timer } from 'rxjs';
import { AuthResponse, LoginRequest, UsuarioAutenticado } from '../models';
import { environment } from '../../../environments/environment';
import { ThemeService } from './theme.service';

const TOKEN_STORAGE_KEY = 'gd_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private theme = inject(ThemeService);
  private _usuario = signal<UsuarioAutenticado | null>(null);
  private _token    = signal<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY));

  usuario    = this._usuario.asReadonly();
  isLoggedIn = computed(() => !!this._token());
  esVisor    = computed(() => this._usuario()?.rol?.nombre === 'Visor');
  esAdminOSuperadmin = computed(() => {
    const rol = this._usuario()?.rol?.nombre?.toLowerCase();
    return rol === 'admin' || rol === 'superadmin';
  });

  constructor() {
    if (this._token()) {
      this.http.get<UsuarioAutenticado>(`${environment.apiUrl}/usuarios/me`).pipe(
        // Reintenta ante fallas transitorias (backend reiniciandose, un hipo de red) para no
        // dejar el perfil en null para el resto de la sesion por una sola falla pasajera.
        retry({
          count: 2,
          delay: (error: unknown, retryCount) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
              return throwError(() => error);
            }
            return timer(500 * retryCount);
          },
        }),
        tap(usuario => {
          this._usuario.set(usuario);
          this.theme.aplicar(usuario.modoOscuro);
        }),
        catchError((error: unknown) => {
          // Solo se cierra la sesion si el token realmente ya no es valido (401). Un error de
          // red, el backend reiniciandose, un 500, etc. no deben tirar una sesion valida.
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.clearSesionLocal();
          }
          return of(null);
        })
      ).subscribe();
    }
  }

  login(body: LoginRequest) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, body).pipe(
      tap(res => {
        this._token.set(res.token);
        this._usuario.set(res.usuario);
        localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
        this.theme.aplicar(res.usuario.modoOscuro);
      })
    );
  }

  forgotPassword(usuario: string) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/forgot-password`, { usuario });
  }

  resetPassword(token: string, password: string) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/reset-password`, { token, password });
  }

  logout() {
    const habiaSesion = !!this._token();
    this.clearSesionLocal();
    if (habiaSesion) {
      this.http.post(`${environment.apiUrl}/auth/logout`, {}).pipe(
        catchError(() => of(null))
      ).subscribe();
    }
  }

  getToken(): string | null { return this._token(); }

  tienePermiso(permiso: string): boolean {
    return !!this._usuario()?.permisos.includes(permiso);
  }

  tieneSubrol(clave: string): boolean {
    if (this.esAdminOSuperadmin()) return true;
    return !!this._usuario()?.subroles.includes(clave);
  }

  actualizarPerfilLocal(usuario: UsuarioAutenticado): void {
    this._usuario.set(usuario);
  }

  actualizarModoOscuroLocal(modoOscuro: boolean): void {
    const usuario = this._usuario();
    if (usuario) {
      this._usuario.set({ ...usuario, modoOscuro });
    }
    this.theme.aplicar(modoOscuro);
  }

  private clearSesionLocal(): void {
    this._token.set(null);
    this._usuario.set(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.theme.aplicar(false);
  }
}
