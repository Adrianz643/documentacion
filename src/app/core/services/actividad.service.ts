import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ActividadItem {
  id: number;
  usuario: string;
  rol: string;
  accion: 'crear' | 'editar' | 'eliminar' | 'subir' | 'restaurar' | 'login' | 'logout';
  modulo: string;
  descripcion: string;
  fecha: string;
}

interface ActividadApiItem extends Omit<ActividadItem, 'modulo'> {
  modulo: string;
}

const MODULO_LABEL: Record<string, string> = {
  AUTH: 'Sistema',
  DOCUMENTOS_PERSONALES: 'Documentos Personales',
  DECLARACIONES: 'Declaraciones',
  FACTURAS: 'Facturas',
  FIEL: 'FIEL',
  EMPRESAS_CHINAS: 'Empresas Chinas',
  USUARIOS: 'Usuarios',
  PAPELERA: 'Papelera',
};

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/actividad`;

  listar(): Observable<ActividadItem[]> {
    return this.http.get<ActividadApiItem[]>(this.base).pipe(
      map((items) => items.map((item) => ({ ...item, modulo: MODULO_LABEL[item.modulo] ?? item.modulo }))),
    );
  }
}
