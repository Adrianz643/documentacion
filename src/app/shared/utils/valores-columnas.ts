import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { TableColumn, ValorColumnaRegistro } from '../../core/models';
import { ColumnasPersonalizadasService } from '../../core/services/columnas-personalizadas.service';

function clave(columnaId: number, registroId: number): string {
  return `${columnaId}:${registroId}`;
}

function idColumna(col: TableColumn): number {
  return Number(col.key.replace('custom_', ''));
}

export class ValoresColumnas {
  readonly valores = signal<Record<string, ValorColumnaRegistro>>({});

  constructor(
    private readonly service: ColumnasPersonalizadasService,
    private readonly onError: (mensaje: string) => void,
  ) {}

  cargar(empresaId: number, secciones: string[]): void {
    forkJoin(secciones.map(seccion => this.service.listarValores(empresaId, seccion))).subscribe({
      next: (listas) => {
        this.valores.set(Object.fromEntries(listas.flat().map(v => [clave(v.columnaId, v.registroId), v])));
      },
      error: () => this.onError('No fue posible cargar los valores de las columnas personalizadas.'),
    });
  }

  valorDe(col: TableColumn, registroId: number): ValorColumnaRegistro | undefined {
    return this.valores()[clave(idColumna(col), registroId)];
  }

  guardarTexto(col: TableColumn, registroId: number, valor: string): void {
    this.aplicar(this.service.guardarValorTexto(idColumna(col), registroId, valor), col, registroId, 'No fue posible guardar el valor.');
  }

  subirArchivo(col: TableColumn, registroId: number, archivo: File): void {
    this.aplicar(this.service.subirValorArchivo(idColumna(col), registroId, archivo), col, registroId, 'No fue posible subir el documento.');
  }

  quitar(col: TableColumn, registroId: number): void {
    this.service.quitarValor(idColumna(col), registroId).subscribe({
      next: () => this.colocar(col, registroId, null),
      error: () => this.onError('No fue posible quitar el valor.'),
    });
  }

  private aplicar(peticion: Observable<ValorColumnaRegistro | null>, col: TableColumn, registroId: number, mensajePorDefecto: string): void {
    peticion.subscribe({
      next: (valor) => this.colocar(col, registroId, valor),
      error: (error: HttpErrorResponse) => this.onError(error.error?.message ?? mensajePorDefecto),
    });
  }

  private colocar(col: TableColumn, registroId: number, valor: ValorColumnaRegistro | null): void {
    const llave = clave(idColumna(col), registroId);
    this.valores.update(actual => {
      const copia = { ...actual };
      if (valor) copia[llave] = valor;
      else delete copia[llave];
      return copia;
    });
  }
}
