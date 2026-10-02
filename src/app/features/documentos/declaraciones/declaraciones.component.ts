import {
  Component, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  NgbModal, NgbTooltipModule, NgbDropdownModule, NgbPaginationModule
} from '@ng-bootstrap/ng-bootstrap';
import { Declaracion, Propietario, TableColumn, TipoCampo, TipoDeclaracion } from '../../../core/models/index';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { OcultoParaVisorDirective } from '../../../shared/directives/oculto-para-visor.directive';
import { CampoDeclaracion, DeclaracionesService } from '../../../core/services/declaraciones.service';
import { PropietarioService } from '../../../core/services/propietario.service';
import { ColumnasPersonalizadasService } from '../../../core/services/columnas-personalizadas.service';

const SECCION_MENSUAL = 'declaraciones';
const SECCION_CERO = 'declaraciones_cero';

type TablaDeclaraciones = 'mensual' | 'cero';

const COLUMNAS_BASE: TableColumn[] = [
  { key: 'propietario',             label: 'Nombre del Propietario',      visible: true,  sortable: true,  type: 'text'     },
  { key: 'siguientePagoFrecuencia', label: 'Siguiente Pago Frecuentes',   visible: true,  sortable: false, type: 'text'     },
  { key: 'fechaUltimoPago',         label: 'Fecha del Último Pago',       visible: true,  sortable: true,  type: 'date'     },
  { key: 'fechaDeclaracion',        label: 'Fecha Declaración',           visible: true,  sortable: true,  type: 'date'     },
  { key: 'comprobante',             label: 'Comprobante de la Declaración', visible: true, sortable: false, type: 'file'    },
];

function mapTipoColumnaATableType(tipo: string): TableColumn['type'] {
  switch (tipo) {
    case 'fecha':   return 'date';
    case 'archivo': return 'file';
    default:        return 'text';
  }
}

@Component({
  selector: 'app-declaraciones',
  standalone: true,
  imports: [
    CommonModule,
    OcultoParaVisorDirective,
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    NgbTooltipModule,
    NgbDropdownModule,
    NgbPaginationModule,
    FileUploadComponent,
  ],
  templateUrl: './declaraciones.component.html',
  styleUrl:    './declaraciones.component.scss'
})
export class DeclaracionesComponent implements OnInit {
  private route              = inject(ActivatedRoute);
  private fb                 = inject(FormBuilder);
  private modal              = inject(NgbModal);
  private declaracionesSvc   = inject(DeclaracionesService);
  private propietarioSvc     = inject(PropietarioService);
  private columnasSvc        = inject(ColumnasPersonalizadasService);

  // -- Estado reactivo con Signals --------------------------
  empresaId      = signal<number>(0);
  loading        = signal(false);
  errorMessage   = signal<string | null>(null);
  guardando      = signal(false);
  declaraciones  = signal<Declaracion[]>([]);
  propietarios   = signal<Propietario[]>([]);
  pageSize       = signal(25);
  currentPage    = signal(1);

  editingId  = signal<number | null>(null);
  editando   = signal<Declaracion | null>(null);
  aEliminar  = signal<{ registro: Declaracion; columnKey?: string; columnLabel?: string } | null>(null);
  columnaAEliminar = signal<{ tabla: TablaDeclaraciones; col: TableColumn } | null>(null);

  // Filtros y columnas: independientes por tabla, cada una con su propio buscador,
  // su propio set de columnas (base + personalizadas) y su propia sección en el backend.
  searchTermMensual = signal('');
  searchTermCero    = signal('');
  columnasMensuales = signal<TableColumn[]>([...COLUMNAS_BASE]);
  columnasCero      = signal<TableColumn[]>([...COLUMNAS_BASE]);

  declaracionesMensuales = computed(() => this.filtrarPorBusqueda(
    this.declaraciones().filter(d => d.tipo === 'mensual'),
    this.searchTermMensual(),
  ));
  declaracionesCero = computed(() => this.filtrarPorBusqueda(
    this.declaraciones().filter(d => d.tipo === 'mensual_cero'),
    this.searchTermCero(),
  ));

  private filtrarPorBusqueda(lista: Declaracion[], termino: string): Declaracion[] {
    const q = termino.toLowerCase();
    return q ? lista.filter(d => (d.propietario?.nombre ?? '').toLowerCase().includes(q)) : lista;
  }

  // Formulario para nueva/editar fila
  filaForm!: FormGroup;

  // Formulario para nueva columna (compartido por el modal; sabe a cuál tabla
  // aplica gracias a tablaColumnaActiva, fijada al abrir el modal desde cada tabla)
  tablaColumnaActiva = signal<TablaDeclaraciones>('mensual');
  columnaForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    tipo:   ['texto', Validators.required]
  });

  ngOnInit() {
    this.empresaId.set(Number(this.route.snapshot.paramMap.get('empresaId') ?? 1));
    this.initFilaForm();
    this.cargar();
    this.cargarPropietarios();
    this.cargarColumnasPersonalizadas('mensual');
    this.cargarColumnasPersonalizadas('cero');
  }

  private initFilaForm() {
    this.filaForm = this.fb.group({
      tipo:                   this.fb.control<TipoDeclaracion>('mensual', Validators.required),
      propietarioId:          this.fb.control<number | null>(null, Validators.required),
      siguientePagoFrecuencia:['mensual', Validators.required],
      fechaUltimoPago:        this.fb.control<string | null>(null),
      fechaDeclaracion:       this.fb.control<string | null>(null),
    });
  }

  private cargar(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.declaracionesSvc.listar(this.empresaId()).subscribe({
      next: (registros) => { this.declaraciones.set(registros); this.loading.set(false); },
      error: () => { this.errorMessage.set('No fue posible cargar las declaraciones.'); this.loading.set(false); },
    });
  }

  private cargarPropietarios(): void {
    this.propietarioSvc.getByEmpresa(this.empresaId()).subscribe({
      next: (propietarios) => this.propietarios.set(propietarios),
      error: () => this.errorMessage.set('No fue posible cargar los propietarios.'),
    });
  }

  private cargarColumnasPersonalizadas(tabla: TablaDeclaraciones): void {
    const seccion = tabla === 'mensual' ? SECCION_MENSUAL : SECCION_CERO;
    const destino = tabla === 'mensual' ? this.columnasMensuales : this.columnasCero;
    this.columnasSvc.listar(this.empresaId(), seccion).subscribe({
      next: (columnas) => {
        const extra: TableColumn[] = columnas.map(c => ({
          key: `custom_${c.id}`,
          label: c.nombre,
          visible: true,
          sortable: false,
          type: mapTipoColumnaATableType(c.tipo),
        }));
        destino.set([...COLUMNAS_BASE, ...extra]);
      },
      error: () => this.errorMessage.set('No fue posible cargar las columnas personalizadas.'),
    });
  }

  private reemplazarRegistro(actualizado: Declaracion): void {
    this.declaraciones.update(regs => regs.map(r => r.id === actualizado.id ? actualizado : r));
  }

  toggleEditar(id: number) { this.editingId.update(cur => cur === id ? null : id); }

  onCellRemove(r: Declaracion, c: TableColumn, editRef: any, deleteRef: any) {
    if (c.type === 'file') { this.confirmarEliminarDocumento(r, c.key, c.label, deleteRef); return; }
    this.abrirEditar(r, editRef);
  }

  cellHasValue(r: Declaracion, c: TableColumn): boolean {
    if (c.type !== 'file') return true;
    return c.key === 'comprobante' ? !!r.comprobanteDoc : false;
  }

  subirDocumento(r: Declaracion, file: File): void {
    this.errorMessage.set(null);
    this.declaracionesSvc.subirDocumento(r.id, this.empresaId(), 'comprobante', file).subscribe({
      next: (actualizado) => this.reemplazarRegistro(actualizado),
      error: () => this.errorMessage.set('No fue posible subir el comprobante.'),
    });
  }

  agregarFila(modalRef: any) {
    this.editando.set(null);
    this.filaForm.reset({ tipo: 'mensual', siguientePagoFrecuencia: 'mensual' });
    this.filaForm.get('tipo')?.enable();
    this.modal.open(modalRef, { centered: true, size: 'lg' });
  }

  abrirEditar(r: Declaracion, modalRef: any) {
    this.editando.set(r);
    this.filaForm.reset({
      tipo: r.tipo,
      propietarioId: r.propietarioId,
      siguientePagoFrecuencia: r.siguientePagoFrecuencia,
      fechaUltimoPago: r.fechaUltimoPago ?? null,
      fechaDeclaracion: r.fechaDeclaracion ?? null,
    });
    this.filaForm.get('tipo')?.disable();
    this.modal.open(modalRef, { centered: true, size: 'lg' });
  }

  guardarFila(modalInstance: any) {
    if (this.filaForm.invalid) {
      this.filaForm.markAllAsTouched();
      return;
    }
    const v = this.filaForm.getRawValue();
    const editando = this.editando();
    const datosComunes = {
      propietarioId: Number(v.propietarioId),
      siguientePagoFrecuencia: v.siguientePagoFrecuencia!,
      fechaUltimoPago: v.fechaUltimoPago || null,
      fechaDeclaracion: v.fechaDeclaracion || null,
    };

    this.guardando.set(true);
    this.errorMessage.set(null);
    const peticion = editando
      ? this.declaracionesSvc.actualizar(editando.id, this.empresaId(), datosComunes)
      : this.declaracionesSvc.crear(this.empresaId(), { ...datosComunes, tipo: v.tipo as TipoDeclaracion });

    peticion.subscribe({
      next: (resultado) => {
        this.guardando.set(false);
        if (editando) {
          this.reemplazarRegistro(resultado);
          this.editingId.set(null);
        } else {
          this.declaraciones.update(regs => [...regs, resultado]);
        }
        this.editando.set(null);
        modalInstance.close();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorMessage.set(error.error?.message ?? 'No fue posible guardar la declaración.');
      },
    });
  }

  agregarColumna(tabla: TablaDeclaraciones, modalRef: any) {
    this.tablaColumnaActiva.set(tabla);
    this.columnaForm.reset({ tipo: 'texto' });
    this.modal.open(modalRef, { centered: true, size: 'sm' });
  }

  guardarColumna(modalInstance: any) {
    if (this.columnaForm.invalid) {
      this.columnaForm.markAllAsTouched();
      return;
    }
    const v = this.columnaForm.getRawValue();
    const tabla = this.tablaColumnaActiva();
    const seccion = tabla === 'mensual' ? SECCION_MENSUAL : SECCION_CERO;
    const destino = tabla === 'mensual' ? this.columnasMensuales : this.columnasCero;
    this.columnasSvc.crear(this.empresaId(), seccion, v.nombre!, v.tipo as TipoCampo).subscribe({
      next: (columnas) => {
        const extra: TableColumn[] = columnas.map(c => ({
          key: `custom_${c.id}`,
          label: c.nombre,
          visible: true,
          sortable: false,
          type: mapTipoColumnaATableType(c.tipo),
        }));
        destino.set([...COLUMNAS_BASE, ...extra]);
        modalInstance.close();
      },
      error: () => this.errorMessage.set('No fue posible agregar la columna.'),
    });
  }

  toggleColumnaMensual(key: string) {
    this.columnasMensuales.update(cols => cols.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  }

  toggleColumnaCero(key: string) {
    this.columnasCero.update(cols => cols.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  }

  columnasVisiblesMensuales = computed(() => this.columnasMensuales().filter(c => c.visible));
  columnasVisiblesCero      = computed(() => this.columnasCero().filter(c => c.visible));

  // Solo las columnas personalizadas (key "custom_<id>") se pueden borrar; las base no.
  confirmarEliminarColumna(tabla: TablaDeclaraciones, col: TableColumn, ref: any) {
    this.columnaAEliminar.set({ tabla, col });
    this.modal.open(ref, { centered: true });
  }

  eliminarColumnaConfirmada(modalInstance: any) {
    const objetivo = this.columnaAEliminar();
    if (!objetivo) { modalInstance.close(); return; }

    const id = Number(objetivo.col.key.replace('custom_', ''));
    const destino = objetivo.tabla === 'mensual' ? this.columnasMensuales : this.columnasCero;
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
        destino.set([...COLUMNAS_BASE, ...extra]);
        this.columnaAEliminar.set(null);
      },
      error: () => this.errorMessage.set('No fue posible eliminar la columna.'),
    });
    modalInstance.close();
  }

  isInvalid(form: FormGroup, field: string) {
    const ctrl = form.get(field);
    return ctrl?.invalid && ctrl?.touched;
  }

  confirmarEliminar(r: Declaracion, ref: any) {
    this.aEliminar.set({ registro: r });
    this.modal.open(ref, { centered: true });
  }

  confirmarEliminarDocumento(r: Declaracion, columnKey: string, columnLabel: string, ref: any) {
    this.aEliminar.set({ registro: r, columnKey, columnLabel });
    this.modal.open(ref, { centered: true });
  }

  eliminarConfirmado(m: any) {
    const target = this.aEliminar();
    if (!target) { m.close(); return; }

    this.errorMessage.set(null);
    if (target.columnKey) {
      const campo = target.columnKey as CampoDeclaracion;
      this.declaracionesSvc.eliminarDocumento(target.registro.id, this.empresaId(), campo).subscribe({
        next: (actualizado) => { this.reemplazarRegistro(actualizado); this.aEliminar.set(null); },
        error: () => this.errorMessage.set('No fue posible eliminar el documento.'),
      });
    } else {
      this.declaracionesSvc.eliminar(target.registro.id, this.empresaId()).subscribe({
        next: () => {
          this.declaraciones.update(regs => regs.filter(reg => reg.id !== target.registro.id));
          if (this.editingId() === target.registro.id) this.editingId.set(null);
          this.aEliminar.set(null);
        },
        error: () => this.errorMessage.set('No fue posible eliminar la declaración.'),
      });
    }
    m.close();
  }

  abrirAyuda(ref: any) { this.modal.open(ref, { centered: true, size: 'lg' }); }
}
