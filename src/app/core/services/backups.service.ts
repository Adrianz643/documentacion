import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EstadoBackup {
  timestamp: string | null;
  exitoso: boolean;
  error: string | null;
  duracionMs: number | null;
  baseDatos: { bytes: number; sha256: string } | null;
  uploads: { archivos: number; bytes: number } | null;
}

@Injectable({ providedIn: 'root' })
export class BackupsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/backups`;

  obtenerEstado(): Observable<EstadoBackup> {
    return this.http.get<EstadoBackup>(this.base);
  }
}
