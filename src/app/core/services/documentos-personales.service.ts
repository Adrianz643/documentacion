import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentoPersonal } from '../models';
import { environment } from '../../../environments/environment';

export type CampoDocumentoPersonal = 'contratoArdum' | 'contratoHegewisch' | 'csf' | 'acuseCita';

export interface PropietarioFormData {
  nombre: string;
  numeroLote?: string | null;
  curp?: string | null;
  email?: string | null;
  telefono?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DocumentosPersonalesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/documentos-personales`;

  listar(empresaId: number): Observable<DocumentoPersonal[]> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.get<DocumentoPersonal[]>(this.base, { params });
  }

  obtener(id: number, empresaId: number): Observable<DocumentoPersonal> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.get<DocumentoPersonal>(`${this.base}/${id}`, { params });
  }

  crear(empresaId: number, data: PropietarioFormData): Observable<DocumentoPersonal> {
    return this.http.post<DocumentoPersonal>(this.base, { empresaId, ...data });
  }

  actualizar(id: number, empresaId: number, data: PropietarioFormData): Observable<DocumentoPersonal> {
    return this.http.put<DocumentoPersonal>(`${this.base}/${id}`, { empresaId, ...data });
  }

  eliminar(id: number, empresaId: number): Observable<void> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.delete<void>(`${this.base}/${id}`, { params });
  }

  subirDocumento(id: number, empresaId: number, campo: CampoDocumentoPersonal, file: File): Observable<DocumentoPersonal> {
    const form = new FormData();
    form.append('empresaId', String(empresaId));
    form.append('archivo', file, file.name);
    return this.http.post<DocumentoPersonal>(`${this.base}/${id}/documentos/${campo}`, form);
  }

  eliminarDocumento(id: number, empresaId: number, campo: CampoDocumentoPersonal): Observable<DocumentoPersonal> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.delete<DocumentoPersonal>(`${this.base}/${id}/documentos/${campo}`, { params });
  }
}
