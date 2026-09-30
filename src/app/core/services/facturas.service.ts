import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Factura } from '../models';
import { environment } from '../../../environments/environment';

export type CampoFactura = 'comprobante';

export interface FacturaFormData {
  propietarioId: number;
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class FacturasService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/facturas`;

  listar(empresaId: number): Observable<Factura[]> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.get<Factura[]>(this.base, { params });
  }

  obtener(id: number, empresaId: number): Observable<Factura> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.get<Factura>(`${this.base}/${id}`, { params });
  }

  crear(empresaId: number, data: FacturaFormData): Observable<Factura> {
    return this.http.post<Factura>(this.base, { empresaId, ...data });
  }

  actualizar(id: number, empresaId: number, data: FacturaFormData): Observable<Factura> {
    return this.http.put<Factura>(`${this.base}/${id}`, { empresaId, ...data });
  }

  eliminar(id: number, empresaId: number): Observable<void> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.delete<void>(`${this.base}/${id}`, { params });
  }

  subirDocumento(id: number, empresaId: number, campo: CampoFactura, file: File): Observable<Factura> {
    const form = new FormData();
    form.append('empresaId', String(empresaId));
    form.append('archivo', file, file.name);
    return this.http.post<Factura>(`${this.base}/${id}/documentos/${campo}`, form);
  }

  eliminarDocumento(id: number, empresaId: number, campo: CampoFactura): Observable<Factura> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.delete<Factura>(`${this.base}/${id}/documentos/${campo}`, { params });
  }
}
