import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDropdownModule, NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TableColumn, TipoCampo } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { EmpresasChinasService } from '../../../core/services/empresas-chinas.service';
import { OcultoParaVisorDirective } from '../../directives/oculto-para-visor.directive';

@Component({
  selector: 'app-gestor-columnas-etapa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbDropdownModule, NgbTooltipModule, OcultoParaVisorDirective],
  host: { class: 'd-flex align-items-center gap-2' },
  template: `
    <button *appOcultoParaVisor type="button" class="btn btn-sm btn-outline-secondary" (click)="abrirNueva(modalNueva)" ngbTooltip="Agregar nueva columna">
      <span aria-hidden="true">＋</span> Agregar columna
    </button>
    <div ngbDropdown>
      <button type="button" class="btn btn-sm btn-outline-secondary" ngbDropdownToggle aria-label="Gestionar columnas">⊞ Columnas</button>
      <div ngbDropdownMenu class="p-2" style="min-width:260px;max-height:60vh;overflow:auto">
        @for (col of columns(); track col.key) {
          <div class="form-check mb-1 d-flex align-items-center">
            <input class="form-check-input" type="checkbox" [id]="'gce_' + etapaNum() + '_' + col.key"
                   [checked]="col.visible" (change)="toggled.emit(col.key)"/>
            <label class="form-check-label small flex-grow-1" [for]="'gce_' + etapaNum() + '_' + col.key">{{ col.label }}</label>
            @if (auth.esSuperadmin() && col.requisitoId) {
              <button type="button" class="btn btn-sm btn-icon p-0 ms-2"
                      ngbTooltip="Editar nombre" [attr.aria-label]="'Editar nombre de ' + col.label"
                      (click)="abrirRenombrar(col, modalRenombrar)">✎</button>
            }
            @if (col.custom) {
              <button *appOcultoParaVisor type="button" class="btn btn-sm btn-icon btn-icon--danger p-0 ms-2"
                      ngbTooltip="Eliminar columna" [attr.aria-label]="'Eliminar columna ' + col.label"
                      (click)="confirmarEliminar(col, modalEliminar)">×</button>
            }
          </div>
        }
      </div>
    </div>

    <ng-template #modalNueva let-modal>
      <div class="modal-header">
        <h3 class="modal-title fs-6">Nueva columna · Etapa {{ etapaNum() }}</h3>
        <button type="button" class="btn-close" aria-label="Cerrar" (click)="modal.dismiss()"></button>
      </div>
      <div class="modal-body">
        @if (error()) {
          <div class="alert alert-danger py-2 small" role="alert">{{ error() }}</div>
        }
        <form [formGroup]="form" novalidate>
          <div class="mb-3">
            <label class="form-label" for="gceNombre">Nombre de la columna <span class="text-danger">*</span></label>
            <input id="gceNombre" type="text" class="form-control" formControlName="descripcion" maxlength="200"
                   [class.is-invalid]="form.get('descripcion')?.invalid && form.get('descripcion')?.touched"
                   placeholder="Ej: Folio de trámite"/>
            <div class="invalid-feedback">El nombre es obligatorio.</div>
          </div>
          <div class="mb-3">
            <label class="form-label" for="gceTipo">Tipo de dato</label>
            <select id="gceTipo" class="form-select" formControlName="tipoCampo">
              <option value="texto">Texto</option>
              <option value="numero">Número</option>
              <option value="fecha">Fecha</option>
              <option value="archivo">Archivo</option>
              <option value="boolean">Sí / No</option>
            </select>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-sm" (click)="modal.dismiss()">Cancelar</button>
        <button type="button" class="btn btn-primary btn-sm gd-btn-primary" [disabled]="guardando()" (click)="guardar(modal)">
          {{ guardando() ? 'Guardando…' : 'Agregar columna' }}
        </button>
      </div>
    </ng-template>

    <ng-template #modalRenombrar let-modal>
      <div class="modal-header">
        <h3 class="modal-title fs-6">Editar nombre de columna · Etapa {{ etapaNum() }}</h3>
        <button type="button" class="btn-close" aria-label="Cerrar" (click)="modal.dismiss()"></button>
      </div>
      <div class="modal-body">
        @if (error()) {
          <div class="alert alert-danger py-2 small" role="alert">{{ error() }}</div>
        }
        <label class="form-label" for="gceRenombrar">Nombre de la columna <span class="text-danger">*</span></label>
        <input id="gceRenombrar" type="text" class="form-control" [formControl]="nombreEditado" maxlength="200"
               [class.is-invalid]="nombreEditado.invalid && nombreEditado.touched"
               (keydown.enter)="renombrar(modal)"/>
        <div class="invalid-feedback">El nombre es obligatorio.</div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-sm" (click)="modal.dismiss()">Cancelar</button>
        <button type="button" class="btn btn-primary btn-sm gd-btn-primary" [disabled]="guardando()" (click)="renombrar(modal)">
          {{ guardando() ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </ng-template>

    <ng-template #modalEliminar let-modal>
      <div class="modal-header">
        <h3 class="modal-title fs-6">Eliminar columna</h3>
        <button type="button" class="btn-close" aria-label="Cerrar" (click)="modal.dismiss()"></button>
      </div>
      <div class="modal-body">
        @if (error()) {
          <div class="alert alert-danger py-2 small" role="alert">{{ error() }}</div>
        }
        <p class="mb-0">¿Seguro que deseas eliminar la columna <strong>{{ columnaAEliminar()?.label }}</strong>? Dejará de mostrarse para todas las empresas.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-sm" (click)="modal.dismiss()">Cancelar</button>
        <button type="button" class="btn btn-danger btn-sm" [disabled]="guardando()" (click)="eliminar(modal)">Eliminar</button>
      </div>
    </ng-template>
  `,
})
export class GestorColumnasEtapaComponent {
  private modalService = inject(NgbModal);
  private fb = inject(FormBuilder);
  private service = inject(EmpresasChinasService);
  protected auth = inject(AuthService);

  etapaNum = input.required<number>();
  columns = input<TableColumn[]>([]);
  toggled = output<string>();
  cambio = output<void>();

  guardando = signal(false);
  error = signal<string | null>(null);
  columnaAEliminar = signal<TableColumn | null>(null);
  columnaARenombrar = signal<TableColumn | null>(null);
  nombreEditado = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] });

  form = this.fb.group({
    descripcion: ['', [Validators.required, Validators.maxLength(200)]],
    tipoCampo: ['texto' as TipoCampo, Validators.required],
  });

  abrirNueva(ref: any) {
    this.error.set(null);
    this.form.reset({ descripcion: '', tipoCampo: 'texto' });
    this.modalService.open(ref, { centered: true, size: 'sm' });
  }

  guardar(modal: any) {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.guardando.set(true);
    this.error.set(null);
    this.service.crearRequisito(this.etapaNum(), v.descripcion!.trim(), v.tipoCampo as TipoCampo).subscribe({
      next: () => { this.guardando.set(false); modal.close(); this.cambio.emit(); },
      error: () => { this.guardando.set(false); this.error.set('No fue posible agregar la columna.'); },
    });
  }

  abrirRenombrar(col: TableColumn, ref: any) {
    this.error.set(null);
    this.columnaARenombrar.set(col);
    this.nombreEditado.reset(col.label);
    this.modalService.open(ref, { centered: true, size: 'sm' });
  }

  renombrar(modal: any) {
    const id = this.columnaARenombrar()?.requisitoId;
    const nombre = this.nombreEditado.value.trim();
    if (!id || !nombre) { this.nombreEditado.markAsTouched(); return; }
    this.guardando.set(true);
    this.error.set(null);
    this.service.renombrarRequisito(id, nombre).subscribe({
      next: () => { this.guardando.set(false); this.columnaARenombrar.set(null); modal.close(); this.cambio.emit(); },
      error: () => { this.guardando.set(false); this.error.set('No fue posible renombrar la columna.'); },
    });
  }

  confirmarEliminar(col: TableColumn, ref: any) {
    this.error.set(null);
    this.columnaAEliminar.set(col);
    this.modalService.open(ref, { centered: true });
  }

  eliminar(modal: any) {
    const id = this.columnaAEliminar()?.requisitoId;
    if (!id) { modal.close(); return; }
    this.guardando.set(true);
    this.error.set(null);
    this.service.eliminarRequisitoPersonalizado(id).subscribe({
      next: () => { this.guardando.set(false); this.columnaAEliminar.set(null); modal.close(); this.cambio.emit(); },
      error: () => { this.guardando.set(false); this.error.set('No fue posible eliminar la columna.'); },
    });
  }
}
