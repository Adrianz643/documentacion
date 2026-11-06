import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TipoCampo, ValorColumnaRegistro } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { formatearValorRequisito } from '../../utils/valor-requisito';

@Component({
  selector: 'app-celda-columna-personalizada',
  standalone: true,
  imports: [CommonModule, FileUploadComponent],
  template: `
    @switch (tipo()) {
      @case ('archivo') {
        @if (valor()?.documento; as doc) {
          <div class="gcp-archivo">
            <a [href]="doc.rutaStorage" [attr.download]="doc.nombreArchivo" class="gcp-link" target="_blank" rel="noopener" [title]="doc.nombreArchivo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
              <span class="gcp-nombre">{{ doc.nombreArchivo }}</span>
            </a>
            <span class="gcp-fecha">{{ doc.createdAt | date:'dd/MM/yyyy' }}</span>
            @if (!auth.esVisor()) {
              <button type="button" class="gcp-quitar" aria-label="Quitar documento" title="Quitar documento" (click)="quitar.emit()">×</button>
            }
          </div>
        } @else {
          <app-file-upload label="documento" (fileSelected)="archivo.emit($event)"/>
        }
      }
      @default {
        @if (auth.esVisor()) {
          {{ textoSoloLectura() }}
        } @else if (tipo() === 'boolean') {
          <select class="form-select form-select-sm gcp-campo" [value]="valor()?.valorTexto ?? ''" (change)="alCambiar($any($event.target).value)" aria-label="Valor">
            <option value="">—</option>
            <option value="Sí">Sí</option>
            <option value="No">No</option>
          </select>
        } @else {
          <input class="form-control form-control-sm gcp-campo"
                 [type]="tipo() === 'numero' ? 'number' : (tipo() === 'fecha' ? 'date' : 'text')"
                 [attr.step]="tipo() === 'numero' ? 'any' : null"
                 [value]="valor()?.valorTexto ?? ''"
                 (change)="alCambiar($any($event.target).value)"
                 maxlength="2000" aria-label="Valor"/>
        }
      }
    }
  `,
  styles: [`
    .gcp-campo{min-width:120px;font-size:12px;}
    .gcp-archivo{display:flex;flex-direction:column;align-items:flex-start;gap:2px;position:relative;padding-right:16px;}
    .gcp-link{color:#1FA971;text-decoration:none;font-size:12px;display:inline-flex;align-items:center;gap:5px;min-width:0;max-width:180px;}
    .gcp-link:hover{text-decoration:underline;}
    .gcp-link svg{width:15px;height:15px;flex-shrink:0;}
    .gcp-nombre{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .gcp-fecha{font-size:11px;color:#7A889B;}
    .gcp-quitar{position:absolute;top:0;right:0;border:none;background:none;color:#DC2626;font-size:16px;line-height:1;padding:0 2px;cursor:pointer;}
  `],
})
export class CeldaColumnaPersonalizadaComponent {
  protected auth = inject(AuthService);

  tipo = input<TipoCampo>('texto');
  valor = input<ValorColumnaRegistro | undefined>(undefined);

  texto = output<string>();
  archivo = output<File>();
  quitar = output<void>();

  textoSoloLectura(): string {
    return formatearValorRequisito(this.tipo(), this.valor()?.valorTexto);
  }

  alCambiar(nuevo: string): void {
    const limpio = nuevo.trim();
    if (limpio === (this.valor()?.valorTexto ?? '')) return;
    if (limpio) this.texto.emit(limpio);
    else this.quitar.emit();
  }
}
