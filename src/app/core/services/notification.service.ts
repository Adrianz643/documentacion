import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, startWith, switchMap, catchError, of } from 'rxjs';
import { NotificacionLog, NotificacionesListado } from '../models';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const INTERVALO_REFRESCO_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = `${environment.apiUrl}/notificaciones`;

  items  = signal<NotificacionLog[]>([]);
  unread = signal(0);

  constructor() {
    interval(INTERVALO_REFRESCO_MS).pipe(
      startWith(0),
      switchMap(() => this.auth.isLoggedIn() ? this.getAll() : of(null)),
      catchError(() => of(null)),
    ).subscribe((resultado) => {
      if (!resultado) return;
      this.items.set(resultado.data);
      this.unread.set(resultado.noLeidas);
    });
  }

  getAll() {
    return this.http.get<NotificacionesListado>(this.base);
  }

  refrescar(): void {
    this.getAll().subscribe((resultado) => {
      this.items.set(resultado.data);
      this.unread.set(resultado.noLeidas);
    });
  }

  marcarLeida(id: number) {
    return this.http.patch<void>(`${this.base}/${id}/leer`, {});
  }

  markAllRead() {
    return this.http.post<void>(`${this.base}/leer-todas`, {});
  }

  eliminar(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
