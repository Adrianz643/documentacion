import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DocumentoReciente {
  id: number;
  nombreArchivo: string;
  mimeType: string;
  tamanoBytes: number;
  rutaStorage: string;
  createdAt: string;
  subidoPorNombre: string;
  subidoPorRol: string;
  modulo: string;
  ruta: Array<string | number> | null;
}

export interface DashboardResumen {
  documentosTotales: number;
  recientes: DocumentoReciente[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/dashboard`;

  obtenerResumen(): Observable<DashboardResumen> {
    return this.http.get<DashboardResumen>(this.base);
  }
}
