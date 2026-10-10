import {
  Component, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbTooltipModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import JSZip from 'jszip';
import { EmpresaChinaRequisito, EtapaRequisito, TableColumn } from '../../../core/models/index';
import { ColumnManagerComponent } from '../../../shared/components/column-manager/column-manager.component';
import { OcultoParaVisorDirective } from '../../../shared/directives/oculto-para-visor.directive';
import { AuthService } from '../../../core/services/auth.service';
import { EmpresasChinasService, FilaEtapaChina } from '../../../core/services/empresas-chinas.service';

const ETAPA_NUM = 1;

@Component({
  selector: 'app-etapa1-aprobacion',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    NgbTooltipModule,
    NgbPaginationModule,
    ColumnManagerComponent,
    OcultoParaVisorDirective
  ],
  templateUrl: './etapa1-aprobacion.component.html',
  styleUrl:    './etapa1-aprobacion.component.scss'
})
export class Etapa1AprobacionComponent implements OnInit {
  protected auth = inject(AuthService);
  private modal   = inject(NgbModal);
  private fb      = inject(FormBuilder);
  private service = inject(EmpresasChinasService);

  loading      = signal(false);
  errorMessage = signal<string | null>(null);
  guardando    = signal(false);
  empresas     = signal<FilaEtapaChina[]>([]);
  pageSize     = signal(10);
  currentPage  = signal(1);
  searchTerm   = signal('');

  requisitos = signal<EtapaRequisito[]>([]);
  columnas   = signal<TableColumn[]>([]);

  requisitosVisibles = computed(() => {
    const visibles = new Set(this.columnas().filter(c => c.visible).map(c => c.key));
    return this.requisitos().filter(r => visibles.has(r.codigo));
  });

  toggleColumna(key: string) {
    this.columnas.update(cs => cs.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  }

  // Formulario para subir/capturar el valor de un requisito
  uploadForm = this.fb.group({
    archivo:    this.fb.control<File | null>(null),
    valorTexto: this.fb.control(''),
  });
  requisitoSeleccionado  = signal<EtapaRequisito | null>(null);
  empresaSeleccionadaId  = signal<number | null>(null);

  // Formulario para dar de alta una empresa china
  nuevaEmpresaForm = this.fb.group({
    nombre:              ['', Validators.required],
    representanteLegal:  [''],
    correoElectronico:   ['', Validators.email],
    telefono:            [''],
    fechaRegistro:       [''],
  });

  ngOnInit() {
    this.cargarRequisitos();
    this.cargar();
  }

  private cargarRequisitos(): void {
    this.service.listarRequisitos(ETAPA_NUM).subscribe({
      next: (requisitos) => {
        this.requisitos.set(requisitos);
        this.columnas.set(requisitos.map(r => ({
          key: r.codigo,
          label: `${r.codigo} — ${r.descripcion}`,
          visible: true,
          sortable: false,
          type: r.tipoCampo === 'archivo' ? 'file' : 'text',
        })));
      },
      error: () => this.errorMessage.set('No fue posible cargar los requisitos.'),
    });
  }

  private cargar(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.service.listarEtapa(ETAPA_NUM).subscribe({
      next: (empresas) => { this.empresas.set(empresas); this.loading.set(false); },
      error: () => { this.errorMessage.set('No fue posible cargar las empresas.'); this.loading.set(false); },
    });
  }

  openUpload(modalRef: any, empresaId: number, requisito: EtapaRequisito) {
    this.empresaSeleccionadaId.set(empresaId);
    this.requisitoSeleccionado.set(requisito);
    this.uploadForm.reset({ archivo: null, valorTexto: '' });
    this.modal.open(modalRef, { centered: true });
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.uploadForm.patchValue({ archivo: file });
    this.uploadForm.get('archivo')?.markAsDirty();
  }

  subirDocumento(modalInst: any) {
    const empresaId = this.empresaSeleccionadaId();
    const requisito = this.requisitoSeleccionado();
    if (!empresaId || !requisito) return;

    this.errorMessage.set(null);
    let peticion;
    if (requisito.tipoCampo === 'archivo') {
      const archivo = this.uploadForm.value.archivo;
      if (!archivo) { this.uploadForm.get('archivo')?.markAsTouched(); return; }
      peticion = this.service.subirArchivo(empresaId, requisito.codigo, archivo);
    } else {
      const valorTexto = (this.uploadForm.value.valorTexto ?? '').trim();
      if (!valorTexto) { this.uploadForm.get('valorTexto')?.markAsTouched(); return; }
      peticion = this.service.subirValorTexto(empresaId, requisito.codigo, valorTexto);
    }

    this.guardando.set(true);
    peticion.subscribe({
      next: () => { this.guardando.set(false); this.cargar(); modalInst.close(); },
      error: () => { this.guardando.set(false); this.errorMessage.set('No fue posible guardar el requisito.'); },
    });
  }

  agregarEmpresa(modalRef: any) {
    this.nuevaEmpresaForm.reset();
    this.modal.open(modalRef, { centered: true, size: 'md' });
  }

  isInvalidNuevaEmpresa(campo: string): boolean {
    const c = this.nuevaEmpresaForm.get(campo);
    return !!(c?.invalid && c?.touched);
  }

  guardarNuevaEmpresa(modalInst: any) {
    if (this.nuevaEmpresaForm.invalid) { this.nuevaEmpresaForm.markAllAsTouched(); return; }
    const v = this.nuevaEmpresaForm.getRawValue();

    this.guardando.set(true);
    this.errorMessage.set(null);
    this.service.crear({
      nombre: v.nombre!.trim(),
      representanteLegal: v.representanteLegal || null,
      correoElectronico: v.correoElectronico || null,
      telefono: v.telefono || null,
      fechaRegistro: v.fechaRegistro || null,
    }).subscribe({
      next: () => { this.guardando.set(false); this.cargar(); modalInst.close(); },
      error: () => { this.guardando.set(false); this.errorMessage.set('No fue posible dar de alta la empresa.'); },
    });
  }

  async exportar(empresa: FilaEtapaChina) {
    const zip = new JSZip();

    const documentos = this.requisitos()
      .map(req => ({ req, valor: this.getReqValue(empresa, req.codigo) }))
      .filter(({ valor }) => valor?.completado && valor.documento);

    for (const { valor } of documentos) {
      const doc = valor!.documento!;
      try {
        const blob = await fetch(doc.rutaStorage).then(r => r.blob());
        zip.file(doc.nombreArchivo, blob);
      } catch {
        zip.file(doc.nombreArchivo, `No fue posible descargar ${doc.nombreArchivo}`);
      }
    }

    zip.file(
      'expediente-info.txt',
      `Expediente de ${empresa.nombre}\n` +
      `Código: ${empresa.codigo}\n` +
      `Etapa actual: Etapa ${empresa.etapaActual}\n` +
      `Documentos incluidos: ${documentos.length} de ${this.requisitos().length}\n` +
      `Check List: ${empresa.checkList ? 'Completo' : 'Pendiente'}\n` +
      `Generado el ${new Date().toLocaleString('es-MX')}\n`
    );

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${empresa.nombre} ${this.fechaArchivo()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private fechaArchivo(): string {
    return new Date().toISOString().slice(0, 10);
  }

  getReqValue(empresa: FilaEtapaChina, codigo: string): EmpresaChinaRequisito | undefined {
    return empresa.requisitos[codigo];
  }

  empresasFiltradas = computed(() => {
    const q = this.searchTerm().toLowerCase();
    if (!q) return this.empresas();
    return this.empresas().filter(e =>
      e.nombre.toLowerCase().includes(q) ||
      e.codigo.toLowerCase().includes(q)
    );
  });

  get pagedEmpresas(): FilaEtapaChina[] {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.empresasFiltradas().slice(start, start + this.pageSize());
  }
}
