import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Documento, PaginatedResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/documentos`;

  upload(empresaId: number, tipoId: number, propietarioId: number | null, file: File): Observable<Documento> {
    const form = new FormData();
    form.append('empresa_id',        String(empresaId));
    form.append('tipo_documento_id', String(tipoId));
    if (propietarioId) form.append('propietario_id', String(propietarioId));
    form.append('archivo', file, file.name);
    return this.http.post<Documento>(`${this.base}/upload`, form);
  }

  getByEmpresa(empresaId: number, page = 1): Observable<PaginatedResponse<Documento>> {
    const params = new HttpParams().set('empresa_id', empresaId).set('page', page);
    return this.http.get<PaginatedResponse<Documento>>(this.base, { params });
  }

  download(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/download`, { responseType: 'blob' });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
