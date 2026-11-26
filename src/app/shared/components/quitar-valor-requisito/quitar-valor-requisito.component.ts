import { Component, inject, input, output, signal } from '@angular/core';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { EmpresasChinasService } from '../../../core/services/empresas-chinas.service';

@Component({
  selector: 'app-quitar-valor-requisito',
  standalone: true,
  imports: [NgbTooltipModule],
  template: `
    <button type="button" class="gqv-quitar" [ngbTooltip]="documentoId() !== null ? 'Eliminar este documento' : 'Eliminar este registro'"
            [attr.aria-label]="'Eliminar registro de ' + etiqueta()" (click)="abrir(modalConfirmar)">×</button>

    <ng-template #modalConfirmar let-modal>
      <div class="modal-header">
        <h3 class="modal-title fs-6">Eliminar registro</h3>
        <button type="button" class="btn-close" aria-label="Cerrar" (click)="modal.dismiss()"></button>
      </div>
      <div class="modal-body">
        @if (error()) {
          <div class="alert alert-danger py-2 small" role="alert">{{ error() }}</div>
        }
        @if (documentoId() !== null) {
          <p class="mb-0">¿Seguro que deseas eliminar el documento <strong>{{ etiqueta() }}</strong>? Los demás documentos de este apartado no cambian.</p>
        } @else {
          <p class="mb-0">¿Seguro que deseas eliminar el registro de <strong>{{ etiqueta() }}</strong>? Solo se quita este dato, el resto de la fila no cambia. Podrás volver a cargarlo.</p>
        }
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-sm" (click)="modal.dismiss()">Cancelar</button>
        <button type="button" class="btn btn-danger btn-sm" [disabled]="guardando()" (click)="quitar(modal)">
          {{ guardando() ? 'Eliminando…' : 'Eliminar' }}
        </button>
      </div>
    </ng-template>
  `,
  styles: [`
    .gqv-quitar{border:none;background:none;color:#DC2626;font-size:16px;line-height:1;padding:0 2px;cursor:pointer;}
  `],
})
export class QuitarValorRequisitoComponent {
  private modalService = inject(NgbModal);
  private service = inject(EmpresasChinasService);

  empresaId = input.required<number>();
  codigo = input.required<string>();
  etiqueta = input<string>('');
  documentoId = input<number | null>(null);
  quitado = output<void>();

  guardando = signal(false);
  error = signal<string | null>(null);

  abrir(ref: any): void {
    this.error.set(null);
    this.modalService.open(ref, { centered: true });
  }

  quitar(modal: any): void {
    this.guardando.set(true);
    this.error.set(null);
    const documentoId = this.documentoId();
    const peticion = documentoId === null
      ? this.service.eliminarRequisito(this.empresaId(), this.codigo())
      : this.service.eliminarDocumentoRequisito(this.empresaId(), this.codigo(), documentoId);
    peticion.subscribe({
      next: () => { this.guardando.set(false); modal.close(); this.quitado.emit(); },
      error: () => { this.guardando.set(false); this.error.set('No fue posible eliminar el registro.'); },
    });
  }
}
