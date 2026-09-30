import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NgbModal, NgbTooltipModule, NgbDropdownModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { DocumentoPersonal, TableColumn } from '../../../core/models';
import { ColumnManagerComponent } from '../../../shared/components/column-manager/column-manager.component';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { OcultoParaVisorDirective } from '../../../shared/directives/oculto-para-visor.directive';
import { CampoDocumentoPersonal, DocumentosPersonalesService } from '../../../core/services/documentos-personales.service';

@Component({
  selector: 'app-doc-personales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgbTooltipModule, NgbDropdownModule, NgbPaginationModule, ColumnManagerComponent, FileUploadComponent, OcultoParaVisorDirective],
  templateUrl: './doc-personales.component.html',
  styleUrl: './doc-personales.component.scss'
})
export class DocPersonalesComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private modal   = inject(NgbModal);
  private fb      = inject(FormBuilder);
  private service = inject(DocumentosPersonalesService);

  empresaId     = signal(0);
  loading       = signal(false);
  errorMessage  = signal<string | null>(null);
  guardando     = signal(false);
  search        = signal('');
  page          = signal(1);
  pageSize      = signal(25);
  registros     = signal<DocumentoPersonal[]>([]);
  editingId     = signal<number | null>(null);
  editando      = signal<DocumentoPersonal | null>(null);
  aEliminar     = signal<{ registro: DocumentoPersonal; columnKey?: string; columnLabel?: string } | null>(null);

  columns = signal<TableColumn[]>([
    { key:'propietario',        label:'Nombre del propietario',  visible:true,  sortable:true,  type:'text' },
    { key:'numeroLote',         label:'Número de Lote',          visible:true,  sortable:true,  type:'text' },
    { key:'contratoArdum',      label:'Contrato Ardum',          visible:true,  sortable:false, type:'file' },
    { key:'contratoHegewisch',  label:'Contrato Hegewisch',      visible:true,  sortable:false, type:'file' },
    { key:'csf',                label:'CSF',                     visible:true,  sortable:false, type:'file' },
    { key:'acuseCita',          label:'Acuse cita',              visible:true,  sortable:false, type:'file' },
    { key:'curp',               label:'CURP',                    visible:true,  sortable:false, type:'text' },
  ]);

  visibles = computed(() => this.columns().filter(c => c.visible));

  filtrados = computed(() => {
    const q = this.search().toLowerCase();
    return q ? this.registros().filter(r =>
      r.propietario.nombre.toLowerCase().includes(q) ||
      (r.propietario.numeroLote ?? '').toLowerCase().includes(q) ||
      (r.propietario.curp ?? '').toLowerCase().includes(q)
    ) : this.registros();
  });

  nuevoForm = this.fb.group({ nombre:['',Validators.required], numeroLote:[''], curp:[''], email:['',Validators.email], telefono:[''] });

  ngOnInit() {
    this.empresaId.set(Number(this.route.snapshot.paramMap.get('empresaId') ?? 1));
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.service.listar(this.empresaId()).subscribe({
      next: (registros) => { this.registros.set(registros); this.loading.set(false); },
      error: () => { this.errorMessage.set('No fue posible cargar los registros.'); this.loading.set(false); },
    });
  }

  private reemplazarRegistro(actualizado: DocumentoPersonal): void {
    this.registros.update(regs => regs.map(r => r.id === actualizado.id ? actualizado : r));
  }

  toggleCol(key: string) { this.columns.update(cs => cs.map(c => c.key===key ? {...c, visible:!c.visible} : c)); }

  toggleEditar(id: number) { this.editingId.update(cur => cur === id ? null : id); }

  onCellRemove(r: DocumentoPersonal, key: string, label: string, editRef: any, deleteRef: any) {
    if (key === 'propietario' || key === 'numeroLote' || key === 'curp') { this.openEditar(r, editRef); return; }
    this.confirmarEliminarDocumento(r, key, label, deleteRef);
  }

  cellHasDoc(r: DocumentoPersonal, key: string): boolean {
    switch (key) {
      case 'contratoArdum':     return !!r.contratoArdumDoc;
      case 'contratoHegewisch': return !!r.contratoHegewischDoc;
      case 'csf':                return !!r.csfDoc;
      case 'acuseCita':          return !!r.acuseCitaDoc;
      default: return false;
    }
  }

  subirDocumento(r: DocumentoPersonal, campo: CampoDocumentoPersonal, file: File): void {
    this.errorMessage.set(null);
    this.service.subirDocumento(r.id, this.empresaId(), campo, file).subscribe({
      next: (actualizado) => this.reemplazarRegistro(actualizado),
      error: () => this.errorMessage.set('No fue posible subir el documento.'),
    });
  }

  openNuevo(ref: any) { this.editando.set(null); this.nuevoForm.reset(); this.modal.open(ref,{centered:true,size:'md'}); }

  openEditar(r: DocumentoPersonal, ref: any) {
    this.editando.set(r);
    this.nuevoForm.reset({
      nombre: r.propietario.nombre,
      numeroLote: r.propietario.numeroLote ?? '',
      curp: r.propietario.curp ?? '',
      email: r.propietario.email ?? '',
      telefono: r.propietario.telefono ?? '',
    });
    this.modal.open(ref, { centered: true, size: 'md' });
  }

  guardar(m: any) {
    if (this.nuevoForm.invalid) { this.nuevoForm.markAllAsTouched(); return; }
    const v = this.nuevoForm.getRawValue();
    const datos = { nombre: v.nombre!, numeroLote: v.numeroLote || null, curp: v.curp || null, email: v.email || null, telefono: v.telefono || null };
    const editando = this.editando();

    this.guardando.set(true);
    this.errorMessage.set(null);
    const peticion = editando
      ? this.service.actualizar(editando.id, this.empresaId(), datos)
      : this.service.crear(this.empresaId(), datos);

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
      error: () => {
        this.guardando.set(false);
        this.errorMessage.set('No fue posible guardar el registro.');
      },
    });
  }

  isInvalid(f: string) { const c = this.nuevoForm.get(f); return c?.invalid && c?.touched; }

  abrirAyuda(ref: any) { this.modal.open(ref, { centered: true, size: 'lg' }); }

  confirmarEliminar(r: DocumentoPersonal, ref: any) {
    this.aEliminar.set({ registro: r });
    this.modal.open(ref, { centered: true });
  }

  confirmarEliminarDocumento(r: DocumentoPersonal, columnKey: string, columnLabel: string, ref: any) {
    this.aEliminar.set({ registro: r, columnKey, columnLabel });
    this.modal.open(ref, { centered: true });
  }

  eliminarConfirmado(m: any) {
    const target = this.aEliminar();
    if (!target) { m.close(); return; }

    this.errorMessage.set(null);
    if (target.columnKey) {
      const campo = target.columnKey as CampoDocumentoPersonal;
      this.service.eliminarDocumento(target.registro.id, this.empresaId(), campo).subscribe({
        next: (actualizado) => { this.reemplazarRegistro(actualizado); this.aEliminar.set(null); },
        error: () => this.errorMessage.set('No fue posible eliminar el documento.'),
      });
    } else {
      this.service.eliminar(target.registro.id, this.empresaId()).subscribe({
        next: () => {
          this.registros.update(regs => regs.filter(reg => reg.id !== target.registro.id));
          if (this.editingId() === target.registro.id) this.editingId.set(null);
          this.aEliminar.set(null);
        },
        error: () => this.errorMessage.set('No fue posible eliminar el registro.'),
      });
    }
    m.close();
  }
}
