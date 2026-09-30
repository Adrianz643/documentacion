import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Propietario } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PropietarioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/propietarios`;

  getByEmpresa(empresaId: number): Observable<Propietario[]> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.get<Propietario[]>(this.base, { params });
  }
}
