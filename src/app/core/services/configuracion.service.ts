// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConfiguracionAlertaFiel {
  diasAnticipacion: number;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/configuracion`;

  obtenerAlertaFiel(): Observable<ConfiguracionAlertaFiel> {
    return this.http.get<ConfiguracionAlertaFiel>(`${this.base}/alertas-fiel`);
  }

  actualizarAlertaFiel(diasAnticipacion: number): Observable<ConfiguracionAlertaFiel> {
    return this.http.put<ConfiguracionAlertaFiel>(`${this.base}/alertas-fiel`, { diasAnticipacion });
  }
}
