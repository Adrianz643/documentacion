import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Empresa, PaginatedResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/empresas`;

  getAll(page = 1, perPage = 25): Observable<PaginatedResponse<Empresa>> {
    const params = new HttpParams().set('page', page).set('per_page', perPage);
    return this.http.get<PaginatedResponse<Empresa>>(this.base, { params });
  }

  getById(id: number): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.base}/${id}`);
  }

  create(data: Partial<Empresa>): Observable<Empresa> {
    return this.http.post<Empresa>(this.base, data);
  }

  update(id: number, data: Partial<Empresa>): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
