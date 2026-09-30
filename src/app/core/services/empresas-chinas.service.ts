import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmpresaChina, EmpresaChinaRequisito, EtapaRequisito, KpiEmpresasChinas } from '../models';
import { environment } from '../../../environments/environment';

export interface FilaEtapaChina extends EmpresaChina {
  requisitos: Record<string, EmpresaChinaRequisito>;
  checkList: boolean;
}

export interface EtapaDetalle {
  etapaNum: number;
  requisitosEstado: { req: EtapaRequisito; valor: EmpresaChinaRequisito | undefined }[];
  checkList: boolean;
}

export interface EmpresaChinaDetalle extends EmpresaChina {
  etapas: EtapaDetalle[];
}

export interface CrearEmpresaChinaData {
  nombre: string;
  representanteLegal?: string | null;
  correoElectronico?: string | null;
  telefono?: string | null;
  fechaRegistro?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EmpresasChinasService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/empresas-chinas`;

  listarRequisitos(etapaNum: number): Observable<EtapaRequisito[]> {
    return this.http.get<EtapaRequisito[]>(`${this.base}/etapa/${etapaNum}/requisitos`);
  }

  listarEtapa(etapaNum: number): Observable<FilaEtapaChina[]> {
    return this.http.get<FilaEtapaChina[]>(`${this.base}/etapa/${etapaNum}`);
  }

  listarTodas(): Observable<EmpresaChina[]> {
    return this.http.get<EmpresaChina[]>(`${this.base}/todas`);
  }

  obtenerKpis(): Observable<KpiEmpresasChinas> {
    return this.http.get<KpiEmpresasChinas>(`${this.base}/kpis`);
  }

  obtenerDetalle(id: number): Observable<EmpresaChinaDetalle> {
    return this.http.get<EmpresaChinaDetalle>(`${this.base}/${id}`);
  }

  crear(data: CrearEmpresaChinaData): Observable<EmpresaChina> {
    return this.http.post<EmpresaChina>(this.base, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  actualizarChecklist(id: number, etapaNum: number, completada: boolean): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/checklist/${etapaNum}`, { completada });
  }

  subirArchivo(id: number, codigo: string, file: File): Observable<EmpresaChinaDetalle> {
    const form = new FormData();
    form.append('archivo', file, file.name);
    return this.http.post<EmpresaChinaDetalle>(`${this.base}/${id}/requisitos/${encodeURIComponent(codigo)}`, form);
  }

  subirValorTexto(id: number, codigo: string, valorTexto: string): Observable<EmpresaChinaDetalle> {
    return this.http.post<EmpresaChinaDetalle>(`${this.base}/${id}/requisitos/${encodeURIComponent(codigo)}`, { valorTexto });
  }

  eliminarRequisito(id: number, codigo: string): Observable<EmpresaChinaDetalle> {
    return this.http.delete<EmpresaChinaDetalle>(`${this.base}/${id}/requisitos/${encodeURIComponent(codigo)}`);
  }
}
