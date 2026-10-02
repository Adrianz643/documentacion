import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ColumnaPersonalizada, TipoCampo } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ColumnasPersonalizadasService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/columnas-personalizadas`;

  listar(empresaId: number, seccion: string): Observable<ColumnaPersonalizada[]> {
    const params = new HttpParams().set('empresaId', empresaId).set('seccion', seccion);
    return this.http.get<ColumnaPersonalizada[]>(this.base, { params });
  }

  crear(empresaId: number, seccion: string, nombre: string, tipo: TipoCampo): Observable<ColumnaPersonalizada[]> {
    return this.http.post<ColumnaPersonalizada[]>(this.base, { empresaId, seccion, nombre, tipo });
  }

  eliminar(id: number): Observable<ColumnaPersonalizada[]> {
    return this.http.delete<ColumnaPersonalizada[]>(`${this.base}/${id}`);
  }
}
