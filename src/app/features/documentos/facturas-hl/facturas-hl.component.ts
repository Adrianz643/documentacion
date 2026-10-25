import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbTooltipModule, NgbDropdownModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { FacturaHl, TableColumn, TipoCampo } from '../../../core/models';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { VIGENCIA_FIEL_UMBRAL_POR_VENCER_DIAS, diasRestantesVigenciaFiel, estadoVigenciaFiel } from '../../../shared/utils/fiel-vigencia';
import { OcultoParaVisorDirective } from '../../../shared/directives/oculto-para-visor.directive';
import { CampoFacturaHl, FacturasHlService } from '../../../core/services/facturas-hl.service';
import { ColumnasPersonalizadasService } from '../../../core/services/columnas-personalizadas.service';

const EMPRESA_ID = 3;
const SECCION = 'facturas_hl';

const COLUMNAS_BASE: TableColumn[] = [
  {key:'cliente',label:'Cliente',visible:true,sortable:true,type:'text'},
  {key:'fecha',label:'Fecha de Creación',visible:true,sortable:true,type:'date'},
  {key:'fechaVencimiento',label:'Fecha de Vencimiento',visible:true,sortable:true,type:'date'},
  {key:'vigencia',label:'Vigencia',visible:true,sortable:false,type:'badge'},
  {key:'comprobante',label:'Comprobante',visible:true,sortable:false,type:'file'},
];

function mapTipoColumnaATableType(tipo: string): TableColumn['type'] {
  switch (tipo) {
    case 'fecha':   return 'date';
    case 'archivo': return 'file';
    default:        return 'text';
  }
}

@Component({ selector:'app-facturas-hl', standalone:true,
  imports:[CommonModule,DatePipe,ReactiveFormsModule,RouterLink,NgbTooltipModule,NgbDropdownModule,NgbPaginationModule,FileUploadComponent,OcultoParaVisorDirective],
  templateUrl:'./facturas-hl.component.html', styleUrl:'./facturas-hl.component.scss' })
export class FacturasHlComponent implements OnInit {
  private modal=inject(NgbModal); private fb=inject(FormBuilder);
  private facturasSvc = inject(FacturasHlService);
  private columnasSvc = inject(ColumnasPersonalizadasService);

  loading=signal(false); errorMessage=signal<string | null>(null); guardando=signal(false);
  search=signal(''); page=signal(1); pageSize=signal(25);
  registros = signal<FacturaHl[]>([]);
  editingId = signal<number | null>(null);
  editando  = signal<FacturaHl | null>(null);
  aEliminar = signal<{ registro: FacturaHl; columnKey?: string; columnLabel?: string } | null>(null);

  columnaAEliminar = signal<TableColumn | null>(null);

  columns=signal<TableColumn[]>([...COLUMNAS_BASE]);
  visibles=computed(()=>this.columns().filter(c=>c.visible));
  estadoVigencia = estadoVigenciaFiel;
  porVencer = computed(() => this.registros().filter((r) => {
    const dias = diasRestantesVigenciaFiel(r.fechaVencimiento);
    return dias !== null && dias >= 0 && dias <= VIGENCIA_FIEL_UMBRAL_POR_VENCER_DIAS;
  }));
  vencidas = computed(() => this.registros().filter((r) => {
    const dias = diasRestantesVigenciaFiel(r.fechaVencimiento);
    return dias !== null && dias < 0;
  }));
  filtrados=computed(()=>{const q=this.search().toLowerCase();return q?this.registros().filter(r=>r.cliente.toLowerCase().includes(q)):this.registros();});
  nuevoForm = this.fb.group({ cliente: ['', [Validators.required, Validators.maxLength(180)]], fecha:['',Validators.required], fechaVencimiento:[''] });

  columnaForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    tipo:   ['texto', Validators.required]
  });

  ngOnInit(){
    this.cargar();
    this.cargarColumnasPersonalizadas();
  }

  private aplicarColumnasPersonalizadas(columnas: { id: number; nombre: string; tipo: string }[]): void {
    const extra: TableColumn[] = columnas.map(c => ({
      key: `custom_${c.id}`,
      label: c.nombre,
      visible: true,
      sortable: false,
      type: mapTipoColumnaATableType(c.tipo),
    }));
    this.columns.set([...COLUMNAS_BASE, ...extra]);
  }

  private cargarColumnasPersonalizadas(): void {
    this.columnasSvc.listar(EMPRESA_ID, SECCION).subscribe({
      next: (columnas) => this.aplicarColumnasPersonalizadas(columnas),
      error: () => this.errorMessage.set('No fue posible cargar las columnas personalizadas.'),
    });
  }

  agregarColumna(ref: any) {
    this.columnaForm.reset({ tipo: 'texto' });
    this.modal.open(ref, { centered: true, size: 'sm' });
  }

  guardarColumna(m: any) {
    if (this.columnaForm.invalid) { this.columnaForm.markAllAsTouched(); return; }
    const v = this.columnaForm.getRawValue();
    this.columnasSvc.crear(EMPRESA_ID, SECCION, v.nombre!.trim(), v.tipo as TipoCampo).subscribe({
      next: (columnas) => { this.aplicarColumnasPersonalizadas(columnas); m.close(); },
      error: () => this.errorMessage.set('No fue posible agregar la columna.'),
    });
  }

  confirmarEliminarColumna(col: TableColumn, ref: any) {
    this.columnaAEliminar.set(col);
    this.modal.open(ref, { centered: true });
  }

  eliminarColumnaConfirmada(m: any) {
    const col = this.columnaAEliminar();
    if (!col) { m.close(); return; }
    this.errorMessage.set(null);
    this.columnasSvc.eliminar(Number(col.key.replace('custom_', ''))).subscribe({
      next: (columnas) => { this.aplicarColumnasPersonalizadas(columnas); this.columnaAEliminar.set(null); },
      error: () => this.errorMessage.set('No fue posible eliminar la columna.'),
    });
    m.close();
  }

  private cargar(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.facturasSvc.listar().subscribe({
      next: (registros) => { this.registros.set(registros); this.loading.set(false); },
      error: () => { this.errorMessage.set('No fue posible cargar las facturas.'); this.loading.set(false); },
    });
  }

  private reemplazarRegistro(actualizado: FacturaHl): void {
    this.registros.update(regs => regs.map(r => r.id === actualizado.id ? actualizado : r));
  }

  toggleCol(k:string){this.columns.update(cs=>cs.map(c=>c.key===k?{...c,visible:!c.visible}:c));}

  toggleEditar(id: number) { this.editingId.update(cur => cur === id ? null : id); }

  onCellRemove(r: FacturaHl, c: TableColumn, editRef: any, deleteRef: any) {
    if (c.type === 'file') { this.confirmarEliminarDocumento(r, c.key, c.label, deleteRef); return; }
    this.abrirEditar(r, editRef);
  }

  cellHasValue(r: FacturaHl, c: TableColumn): boolean {
    if (c.key === 'vigencia') return false;
    if (c.type !== 'file') return true;
    return c.key === 'comprobante' ? !!r.comprobanteDoc : false;
  }

  subirDocumento(r: FacturaHl, campo: CampoFacturaHl, file: File): void {
    this.errorMessage.set(null);
    this.facturasSvc.subirDocumento(r.id, campo, file).subscribe({
      next: (actualizado) => this.reemplazarRegistro(actualizado),
      error: () => this.errorMessage.set('No fue posible subir el comprobante.'),
    });
  }

  openNuevo(ref:any){ this.editando.set(null); this.nuevoForm.reset(); this.modal.open(ref,{centered:true}); }

  abrirEditar(r: FacturaHl, ref: any) {
    this.editando.set(r);
    this.nuevoForm.reset({ cliente: r.cliente, fecha: r.fecha, fechaVencimiento: r.fechaVencimiento ?? '' });
    this.modal.open(ref, { centered: true });
  }

  guardar(m:any){
    if(this.nuevoForm.invalid){this.nuevoForm.markAllAsTouched();return;}
    const v = this.nuevoForm.getRawValue();
    const datos = { cliente: v.cliente!.trim(), fecha: v.fecha!, fechaVencimiento: v.fechaVencimiento || null };
    const editando = this.editando();

    this.guardando.set(true);
    this.errorMessage.set(null);
    const peticion = editando
      ? this.facturasSvc.actualizar(editando.id, datos)
      : this.facturasSvc.crear(datos);

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

  confirmarEliminar(r: FacturaHl, ref: any) {
    this.aEliminar.set({ registro: r });
    this.modal.open(ref, { centered: true });
  }

  confirmarEliminarDocumento(r: FacturaHl, columnKey: string, columnLabel: string, ref: any) {
    this.aEliminar.set({ registro: r, columnKey, columnLabel });
    this.modal.open(ref, { centered: true });
  }

  eliminarConfirmado(m: any) {
    const target = this.aEliminar();
    if (!target) { m.close(); return; }

    this.errorMessage.set(null);
    if (target.columnKey) {
      const campo = target.columnKey as CampoFacturaHl;
      this.facturasSvc.eliminarDocumento(target.registro.id, campo).subscribe({
        next: (actualizado) => { this.reemplazarRegistro(actualizado); this.aEliminar.set(null); },
        error: () => this.errorMessage.set('No fue posible eliminar el documento.'),
      });
    } else {
      this.facturasSvc.eliminar(target.registro.id).subscribe({
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
