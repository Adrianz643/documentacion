import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ColumnaPersonalizada, TipoCampo, ValorColumnaRegistro } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ColumnasPersonalizadasService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/columnas-personalizadas`;
  private valoresBase = `${environment.apiUrl}/valores-columnas`;

  listar(empresaId: number, seccion: string): Observable<ColumnaPersonalizada[]> {
    const params = new HttpParams().set('empresaId', empresaId).set('seccion', seccion);
    return this.http.get<ColumnaPersonalizada[]>(this.base, { params });
  }

  crear(empresaId: number, seccion: string, nombre: string, tipo: TipoCampo): Observable<ColumnaPersonalizada[]> {
    return this.http.post<ColumnaPersonalizada[]>(this.base, { empresaId, seccion, nombre, tipo });
  }

  listarValores(empresaId: number, seccion: string): Observable<ValorColumnaRegistro[]> {
    const params = new HttpParams().set('empresaId', empresaId).set('seccion', seccion);
    return this.http.get<ValorColumnaRegistro[]>(this.valoresBase, { params });
  }

  guardarValorTexto(columnaId: number, registroId: number, valorTexto: string): Observable<ValorColumnaRegistro | null> {
    return this.http.put<ValorColumnaRegistro | null>(`${this.valoresBase}/${columnaId}/${registroId}`, { valorTexto });
  }

  subirValorArchivo(columnaId: number, registroId: number, file: File): Observable<ValorColumnaRegistro | null> {
    const form = new FormData();
    form.append('archivo', file, file.name);
    return this.http.post<ValorColumnaRegistro | null>(`${this.valoresBase}/${columnaId}/${registroId}/archivo`, form);
  }

  quitarValor(columnaId: number, registroId: number): Observable<void> {
    return this.http.delete<void>(`${this.valoresBase}/${columnaId}/${registroId}`);
  }

  eliminar(id: number): Observable<ColumnaPersonalizada[]> {
    return this.http.delete<ColumnaPersonalizada[]>(`${this.base}/${id}`);
  }
}
