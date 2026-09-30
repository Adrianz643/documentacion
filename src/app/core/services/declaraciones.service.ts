import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Declaracion, FrecuenciaPago, TipoDeclaracion } from '../models';
import { environment } from '../../../environments/environment';

export type CampoDeclaracion = 'comprobante';

export interface CrearDeclaracionData {
  propietarioId: number;
  tipo: TipoDeclaracion;
  siguientePagoFrecuencia: FrecuenciaPago;
  fechaUltimoPago?: string | null;
  fechaDeclaracion?: string | null;
}

export interface ActualizarDeclaracionData {
  propietarioId: number;
  siguientePagoFrecuencia: FrecuenciaPago;
  fechaUltimoPago?: string | null;
  fechaDeclaracion?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DeclaracionesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/declaraciones`;

  listar(empresaId: number): Observable<Declaracion[]> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.get<Declaracion[]>(this.base, { params });
  }

  obtener(id: number, empresaId: number): Observable<Declaracion> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.get<Declaracion>(`${this.base}/${id}`, { params });
  }

  crear(empresaId: number, data: CrearDeclaracionData): Observable<Declaracion> {
    return this.http.post<Declaracion>(this.base, { empresaId, ...data });
  }

  actualizar(id: number, empresaId: number, data: ActualizarDeclaracionData): Observable<Declaracion> {
    return this.http.put<Declaracion>(`${this.base}/${id}`, { empresaId, ...data });
  }

  eliminar(id: number, empresaId: number): Observable<void> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.delete<void>(`${this.base}/${id}`, { params });
  }

  subirDocumento(id: number, empresaId: number, campo: CampoDeclaracion, file: File): Observable<Declaracion> {
    const form = new FormData();
    form.append('empresaId', String(empresaId));
    form.append('archivo', file, file.name);
    return this.http.post<Declaracion>(`${this.base}/${id}/documentos/${campo}`, form);
  }

  eliminarDocumento(id: number, empresaId: number, campo: CampoDeclaracion): Observable<Declaracion> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.delete<Declaracion>(`${this.base}/${id}/documentos/${campo}`, { params });
  }
}
