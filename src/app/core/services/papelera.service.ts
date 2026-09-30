import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PapeleraItem {
  id: number;
  modulo: string;
  moduloLabel: string;
  tipo: string;
  nombre: string;
  eliminadoPor: string;
  fechaEliminacion: string;
  diasRestantes: number;
}

@Injectable({ providedIn: 'root' })
export class PapeleraService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/papelera`;

  listar(): Observable<PapeleraItem[]> {
    return this.http.get<PapeleraItem[]>(this.base);
  }

  restaurar(modulo: string, id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${modulo}/${id}/restaurar`, {});
  }

  eliminarDefinitivo(modulo: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${modulo}/${id}`);
  }

  vaciar(): Observable<void> {
    return this.http.delete<void>(this.base);
  }
}
