import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FacturaHl } from '../models';
import { environment } from '../../../environments/environment';

export type CampoFacturaHl = 'comprobante';

export interface FacturaHlFormData {
  cliente: string;
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class FacturasHlService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/facturas-hl`;

  listar(): Observable<FacturaHl[]> {
    return this.http.get<FacturaHl[]>(this.base);
  }

  obtener(id: number): Observable<FacturaHl> {
    return this.http.get<FacturaHl>(`${this.base}/${id}`);
  }

  crear(data: FacturaHlFormData): Observable<FacturaHl> {
    return this.http.post<FacturaHl>(this.base, data);
  }

  actualizar(id: number, data: FacturaHlFormData): Observable<FacturaHl> {
    return this.http.put<FacturaHl>(`${this.base}/${id}`, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  subirDocumento(id: number, campo: CampoFacturaHl, file: File): Observable<FacturaHl> {
    const form = new FormData();
    form.append('archivo', file, file.name);
    return this.http.post<FacturaHl>(`${this.base}/${id}/documentos/${campo}`, form);
  }

  eliminarDocumento(id: number, campo: CampoFacturaHl): Observable<FacturaHl> {
    return this.http.delete<FacturaHl>(`${this.base}/${id}/documentos/${campo}`);
  }
}
