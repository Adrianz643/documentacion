import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActualizarPerfilPropioRequest,
  ActualizarUsuarioRequest,
  CatalogosUsuarios,
  CrearUsuarioRequest,
  PaginatedResponse,
  UsuarioAutenticado,
  UsuarioDetalle,
  UsuarioListItem,
} from '../models';

export interface ListarUsuariosParams {
  page: number;
  perPage: number;
  search: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private usuariosUrl = `${environment.apiUrl}/usuarios`;
  private catalogosUrl = `${environment.apiUrl}/catalogos`;

  listar(params: ListarUsuariosParams): Observable<PaginatedResponse<UsuarioListItem>> {
    const query = new HttpParams()
      .set('page', params.page)
      .set('perPage', params.perPage)
      .set('search', params.search);
    return this.http.get<PaginatedResponse<UsuarioListItem>>(this.usuariosUrl, { params: query });
  }

  obtenerDetalle(id: number): Observable<UsuarioDetalle> {
    return this.http.get<UsuarioDetalle>(`${this.usuariosUrl}/${id}`);
  }

  crear(payload: CrearUsuarioRequest): Observable<UsuarioDetalle> {
    return this.http.post<UsuarioDetalle>(this.usuariosUrl, payload);
  }

  actualizar(id: number, payload: ActualizarUsuarioRequest): Observable<UsuarioDetalle> {
    return this.http.put<UsuarioDetalle>(`${this.usuariosUrl}/${id}`, payload);
  }

  obtenerMiDetalle(): Observable<UsuarioDetalle> {
    return this.http.get<UsuarioDetalle>(`${this.usuariosUrl}/me/detalle`);
  }

  actualizarPerfilPropio(payload: ActualizarPerfilPropioRequest): Observable<UsuarioAutenticado> {
    return this.http.put<UsuarioAutenticado>(`${this.usuariosUrl}/me`, payload);
  }

  obtenerCatalogos(): Observable<CatalogosUsuarios> {
    return this.http.get<CatalogosUsuarios>(this.catalogosUrl);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.usuariosUrl}/${id}`);
  }
}
