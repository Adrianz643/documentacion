// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Apariencia } from '../models';

@Injectable({ providedIn: 'root' })
export class AparienciaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/apariencia`;

  obtener(): Observable<Apariencia> {
    return this.http.get<Apariencia>(`${this.base}/me`);
  }

  actualizar(modoOscuro: boolean): Observable<Apariencia> {
    return this.http.put<Apariencia>(`${this.base}/me`, { modoOscuro });
  }
}
