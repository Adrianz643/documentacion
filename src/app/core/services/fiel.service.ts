import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FielRegistro } from '../models';
import { environment } from '../../../environments/environment';

export type CampoFiel = 'clavePrivada' | 'certificado';

export interface FielFormData {
  propietarioId: number;
  fechaCreacion?: string | null;
  fechaVencimiento?: string | null;
}

@Injectable({ providedIn: 'root' })
export class FielService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/fiel`;

  listar(empresaId: number): Observable<FielRegistro[]> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.get<FielRegistro[]>(this.base, { params });
  }

  obtener(id: number, empresaId: number): Observable<FielRegistro> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.get<FielRegistro>(`${this.base}/${id}`, { params });
  }

  crear(empresaId: number, data: FielFormData): Observable<FielRegistro> {
    return this.http.post<FielRegistro>(this.base, { empresaId, ...data });
  }

  actualizar(id: number, empresaId: number, data: FielFormData): Observable<FielRegistro> {
    return this.http.put<FielRegistro>(`${this.base}/${id}`, { empresaId, ...data });
  }

  eliminar(id: number, empresaId: number): Observable<void> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.delete<void>(`${this.base}/${id}`, { params });
  }

  subirDocumento(id: number, empresaId: number, campo: CampoFiel, file: File): Observable<FielRegistro> {
    const form = new FormData();
    form.append('empresaId', String(empresaId));
    form.append('archivo', file, file.name);
    return this.http.post<FielRegistro>(`${this.base}/${id}/documentos/${campo}`, form);
  }

  eliminarDocumento(id: number, empresaId: number, campo: CampoFiel): Observable<FielRegistro> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.delete<FielRegistro>(`${this.base}/${id}/documentos/${campo}`, { params });
  }

  actualizarContrasena(id: number, empresaId: number, contrasena: string): Observable<FielRegistro> {
    return this.http.put<FielRegistro>(`${this.base}/${id}/contrasena`, { empresaId, contrasena });
  }

  eliminarContrasena(id: number, empresaId: number): Observable<FielRegistro> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.delete<FielRegistro>(`${this.base}/${id}/contrasena`, { params });
  }
}
