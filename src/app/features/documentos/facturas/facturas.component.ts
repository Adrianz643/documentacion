import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NgbModal, NgbTooltipModule, NgbDropdownModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Factura, Propietario, TableColumn, TipoCampo } from '../../../core/models';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { OcultoParaVisorDirective } from '../../../shared/directives/oculto-para-visor.directive';
import { CampoFactura, FacturasService } from '../../../core/services/facturas.service';
import { PropietarioService } from '../../../core/services/propietario.service';
import { ColumnasPersonalizadasService } from '../../../core/services/columnas-personalizadas.service';

const SECCION = 'facturas';

const COLUMNAS_BASE: TableColumn[] = [
  {key:'propietario',label:'Nombre del Propietario',visible:true,sortable:true,type:'text'},
  {key:'fecha',label:'Fecha',visible:true,sortable:true,type:'date'},
  {key:'comprobante',label:'Comprobante',visible:true,sortable:false,type:'file'},
];

function mapTipoColumnaATableType(tipo: string): TableColumn['type'] {
  switch (tipo) {
    case 'fecha':   return 'date';
    case 'archivo': return 'file';
    default:        return 'text';
  }
}

@Component({ selector:'app-facturas', standalone:true,
  imports:[CommonModule,DatePipe,ReactiveFormsModule,RouterLink,NgbTooltipModule,NgbDropdownModule,NgbPaginationModule,FileUploadComponent,OcultoParaVisorDirective],
  templateUrl:'./facturas.component.html', styleUrl:'./facturas.component.scss' })
export class FacturasComponent implements OnInit {
  private route=inject(ActivatedRoute); private modal=inject(NgbModal); private fb=inject(FormBuilder);
  private facturasSvc = inject(FacturasService);
  private propietarioSvc = inject(PropietarioService);
  private columnasSvc = inject(ColumnasPersonalizadasService);

  empresaId=signal(0); loading=signal(false); errorMessage=signal<string | null>(null); guardando=signal(false);
  search=signal(''); page=signal(1); pageSize=signal(25);
  registros = signal<Factura[]>([]);
  propietarios = signal<Propietario[]>([]);
  editingId = signal<number | null>(null);
  editando  = signal<Factura | null>(null);
  aEliminar = signal<{ registro: Factura; columnKey?: string; columnLabel?: string } | null>(null);
  columnaAEliminar = signal<TableColumn | null>(null);

  columns=signal<TableColumn[]>([...COLUMNAS_BASE]);
  visibles=computed(()=>this.columns().filter(c=>c.visible));
  filtrados=computed(()=>{const q=this.search().toLowerCase();return q?this.registros().filter(r=>r.propietario?.nombre.toLowerCase().includes(q)):this.registros();});
  nuevoForm = this.fb.group({ propietarioId: this.fb.control<number | null>(null, Validators.required), fecha:['',Validators.required] });

  columnaForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    tipo:   ['texto', Validators.required]
  });

  ngOnInit(){
    this.empresaId.set(Number(this.route.snapshot.paramMap.get('empresaId')??1));
    this.cargar();
    this.propietarioSvc.getByEmpresa(this.empresaId()).subscribe({
      next: (propietarios) => this.propietarios.set(propietarios),
      error: () => this.errorMessage.set('No fue posible cargar los propietarios.'),
    });
    this.cargarColumnasPersonalizadas();
  }

  private cargarColumnasPersonalizadas(): void {
    this.columnasSvc.listar(this.empresaId(), SECCION).subscribe({
      next: (columnas) => {
        const extra: TableColumn[] = columnas.map(c => ({
          key: `custom_${c.id}`,
          label: c.nombre,
          visible: true,
          sortable: false,
          type: mapTipoColumnaATableType(c.tipo),
        }));
        this.columns.set([...COLUMNAS_BASE, ...extra]);
      },
      error: () => this.errorMessage.set('No fue posible cargar las columnas personalizadas.'),
    });
  }

  agregarColumna(modalRef: any) {
    this.columnaForm.reset({ tipo: 'texto' });
    this.modal.open(modalRef, { centered: true, size: 'sm' });
  }

  guardarColumna(modalInstance: any) {
    if (this.columnaForm.invalid) {
      this.columnaForm.markAllAsTouched();
      return;
    }
    const v = this.columnaForm.getRawValue();
    this.columnasSvc.crear(this.empresaId(), SECCION, v.nombre!, v.tipo as TipoCampo).subscribe({
      next: (columnas) => {
        const extra: TableColumn[] = columnas.map(c => ({
          key: `custom_${c.id}`,
          label: c.nombre,
          visible: true,
          sortable: false,
          type: mapTipoColumnaATableType(c.tipo),
        }));
        this.columns.set([...COLUMNAS_BASE, ...extra]);
        modalInstance.close();
      },
      error: () => this.errorMessage.set('No fue posible agregar la columna.'),
    });
  }

  confirmarEliminarColumna(col: TableColumn, ref: any) {
    this.columnaAEliminar.set(col);
    this.modal.open(ref, { centered: true });
  }

  eliminarColumnaConfirmada(modalInstance: any) {
    const col = this.columnaAEliminar();
    if (!col) { modalInstance.close(); return; }

    const id = Number(col.key.replace('custom_', ''));
    this.errorMessage.set(null);
    this.columnasSvc.eliminar(id).subscribe({
      next: (columnas) => {
        const extra: TableColumn[] = columnas.map(c => ({
          key: `custom_${c.id}`,
          label: c.nombre,
          visible: true,
          sortable: false,
          type: mapTipoColumnaATableType(c.tipo),
        }));
        this.columns.set([...COLUMNAS_BASE, ...extra]);
        this.columnaAEliminar.set(null);
      },
      error: () => this.errorMessage.set('No fue posible eliminar la columna.'),
    });
    modalInstance.close();
  }

  private cargar(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.facturasSvc.listar(this.empresaId()).subscribe({
      next: (registros) => { this.registros.set(registros); this.loading.set(false); },
      error: () => { this.errorMessage.set('No fue posible cargar las facturas.'); this.loading.set(false); },
    });
  }

  private reemplazarRegistro(actualizado: Factura): void {
    this.registros.update(regs => regs.map(r => r.id === actualizado.id ? actualizado : r));
  }

  toggleCol(k:string){this.columns.update(cs=>cs.map(c=>c.key===k?{...c,visible:!c.visible}:c));}

  toggleEditar(id: number) { this.editingId.update(cur => cur === id ? null : id); }

  onCellRemove(r: Factura, c: TableColumn, editRef: any, deleteRef: any) {
    if (c.type === 'file') { this.confirmarEliminarDocumento(r, c.key, c.label, deleteRef); return; }
    this.abrirEditar(r, editRef);
  }

  cellHasValue(r: Factura, c: TableColumn): boolean {
    if (c.type !== 'file') return true;
    return c.key === 'comprobante' ? !!r.comprobanteDoc : false;
  }

  subirDocumento(r: Factura, campo: CampoFactura, file: File): void {
    this.errorMessage.set(null);
    this.facturasSvc.subirDocumento(r.id, this.empresaId(), campo, file).subscribe({
      next: (actualizado) => this.reemplazarRegistro(actualizado),
      error: () => this.errorMessage.set('No fue posible subir el comprobante.'),
    });
  }

  openNuevo(ref:any){ this.editando.set(null); this.nuevoForm.reset(); this.modal.open(ref,{centered:true}); }

  abrirEditar(r: Factura, ref: any) {
    this.editando.set(r);
    this.nuevoForm.reset({ propietarioId: r.propietarioId, fecha: r.fecha });
    this.modal.open(ref, { centered: true });
  }

  guardar(m:any){
    if(this.nuevoForm.invalid){this.nuevoForm.markAllAsTouched();return;}
    const v = this.nuevoForm.getRawValue();
    const datos = { propietarioId: Number(v.propietarioId), fecha: v.fecha! };
    const editando = this.editando();

    this.guardando.set(true);
    this.errorMessage.set(null);
    const peticion = editando
      ? this.facturasSvc.actualizar(editando.id, this.empresaId(), datos)
      : this.facturasSvc.crear(this.empresaId(), datos);

    peticion.subscribe({
      next: (resultado) => {
        this.guardando.set(false);
        if (editando) {
          this.reemplazarRegistro(resultado);
          this.editingId.set(null);
        } else {
          this.registros.update(regs => [...regs, resultado]);
        }
        this.editando.set(null);
        m.close();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorMessage.set(error.error?.message ?? 'No fue posible guardar la factura.');
      },
    });
  }

  isInvalid(f:string){const c=this.nuevoForm.get(f);return c?.invalid&&c?.touched;}
  isInvalidColumna(f:string){const c=this.columnaForm.get(f);return c?.invalid&&c?.touched;}

  confirmarEliminar(r: Factura, ref: any) {
    this.aEliminar.set({ registro: r });
    this.modal.open(ref, { centered: true });
  }

  confirmarEliminarDocumento(r: Factura, columnKey: string, columnLabel: string, ref: any) {
    this.aEliminar.set({ registro: r, columnKey, columnLabel });
    this.modal.open(ref, { centered: true });
  }

  eliminarConfirmado(m: any) {
    const target = this.aEliminar();
    if (!target) { m.close(); return; }

    this.errorMessage.set(null);
    if (target.columnKey) {
      const campo = target.columnKey as CampoFactura;
      this.facturasSvc.eliminarDocumento(target.registro.id, this.empresaId(), campo).subscribe({
        next: (actualizado) => { this.reemplazarRegistro(actualizado); this.aEliminar.set(null); },
        error: () => this.errorMessage.set('No fue posible eliminar el documento.'),
      });
    } else {
      this.facturasSvc.eliminar(target.registro.id, this.empresaId()).subscribe({
        next: () => {
          this.registros.update(regs => regs.filter(reg => reg.id !== target.registro.id));
          if (this.editingId() === target.registro.id) this.editingId.set(null);
          this.aEliminar.set(null);
        },
        error: () => this.errorMessage.set('No fue posible eliminar la factura.'),
      });
    }
    m.close();
  }

  abrirAyuda(ref: any) { this.modal.open(ref, { centered: true, size: 'lg' }); }
}
