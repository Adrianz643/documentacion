import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbModal, NgbTooltipModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FielRegistro, Propietario, TableColumn } from '../../../core/models';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { ColumnManagerComponent } from '../../../shared/components/column-manager/column-manager.component';
import { OcultoParaVisorDirective } from '../../../shared/directives/oculto-para-visor.directive';
import { CampoFiel, FielService } from '../../../core/services/fiel.service';
import { PropietarioService } from '../../../core/services/propietario.service';
import {
  VIGENCIA_FIEL_DESDE,
  VIGENCIA_FIEL_UMBRAL_POR_VENCER_DIAS,
  calcularVencimientoFiel,
  diasRestantesVigenciaFiel,
  estadoVigenciaFiel,
  fechaCreacionMaximaFiel,
  fechaCreacionMinimaFiel,
} from '../../../shared/utils/fiel-vigencia';

@Component({
  selector: 'app-fiel',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, RouterLink, NgbTooltipModule, NgbPaginationModule, FileUploadComponent, ColumnManagerComponent, OcultoParaVisorDirective],
  templateUrl: './fiel.component.html',
  styleUrl: './fiel.component.scss'
})
export class FielComponent implements OnInit {
  private route             = inject(ActivatedRoute);
  private modal             = inject(NgbModal);
  private fb                = inject(FormBuilder);
  private fielService       = inject(FielService);
  private propietarioService = inject(PropietarioService);
  private ultimoVencimientoAuto = '';

  empresaId    = signal(0);
  loading      = signal(false);
  errorMessage = signal<string | null>(null);
  guardando    = signal(false);
  search       = signal('');
  page         = signal(1); pageSize = signal(25);
  registros    = signal<FielRegistro[]>([]);
  propietarios = signal<Propietario[]>([]);
  editingId    = signal<number | null>(null);
  editando     = signal<FielRegistro | null>(null);
  aEliminar    = signal<{ registro: FielRegistro; columnKey?: string; columnLabel?: string } | null>(null);

  // Captura inline de la contraseña FIEL: borrador por fila hasta que se confirma (palomita)
  // y se guarda; a partir de ahí el campo queda bloqueado (solo lectura) en el servidor.
  contrasenaDraft   = signal<Record<number, string>>({});
  contrasenaVisible = signal<Set<number>>(new Set());
  guardandoContrasena = signal<Set<number>>(new Set());

  columns   = signal<TableColumn[]>([
    { key:'propietario',    label:'Nombre del Propietario', visible:true, sortable:true,  type:'text' },
    { key:'clavePrivada',   label:'Clave Privada',          visible:true, sortable:false, type:'file' },
    { key:'certificado',    label:'Certificado (.cer)',      visible:true, sortable:false, type:'file' },
    { key:'contrasena',     label:'Contraseña',             visible:true, sortable:false, type:'text' },
    { key:'fechaCreacion',  label:'Fecha de Creación',      visible:true, sortable:true,  type:'date' },
    { key:'fechaVencimiento',label:'Fecha de Vencimiento',  visible:true, sortable:true,  type:'date' },
    { key:'vigencia',       label:'Vigencia',               visible:true, sortable:false, type:'badge' },
  ]);
  visibles = computed(() => this.columns().filter(c => c.visible));
  filtrados = computed(() => { const q=this.search().toLowerCase(); return q ? this.registros().filter(r=>r.propietario?.nombre.toLowerCase().includes(q)) : this.registros(); });
  nuevoForm = this.fb.group({
    propietarioId: this.fb.control<number | null>(null, Validators.required),
    fechaCreacion: ['', [(control: AbstractControl) => this.validarFechaCreacionMinima(control)]],
    fechaVencimiento: [''],
  });

  // El 1/ene/2022 es un piso absoluto: nunca se puede registrar ni editar una FIEL
  // con fecha de creación anterior (el sistema no modela vigencia antes de esa fecha).
  // Para registros NUEVOS el piso además avanza con el tiempo (hoy - 4 años) para no
  // permitir capturar una FIEL que ya nacería vencida; al editar un registro existente
  // se respeta el piso absoluto pero no el dinámico, para no bloquear datos históricos
  // cuya vigencia de 4 años ya venció de forma legítima.
  readonly fechaCreacionMaxima = fechaCreacionMaximaFiel();
  fechaCreacionMinima = computed(() => this.editando() ? VIGENCIA_FIEL_DESDE : fechaCreacionMinimaFiel());

  private validarFechaCreacionMinima(control: AbstractControl): ValidationErrors | null {
    const valor = control.value as string;
    if (!valor) return null;
    const minima = this.editando() ? VIGENCIA_FIEL_DESDE : fechaCreacionMinimaFiel();
    if (valor < minima) return { fechaCreacionMuyAntigua: { minima } };
    return null;
  }

  porVencer = computed(() => this.registros().filter((r) => {
    const dias = diasRestantesVigenciaFiel(r.fechaVencimiento);
    return dias !== null && dias >= 0 && dias <= VIGENCIA_FIEL_UMBRAL_POR_VENCER_DIAS;
  }));
  vencidas = computed(() => this.registros().filter((r) => {
    const dias = diasRestantesVigenciaFiel(r.fechaVencimiento);
    return dias !== null && dias < 0;
  }));

  ngOnInit() {
    this.empresaId.set(Number(this.route.snapshot.paramMap.get('empresaId')??1));
    this.cargar();
    this.propietarioService.getByEmpresa(this.empresaId()).subscribe({
      next: (propietarios) => this.propietarios.set(propietarios),
      error: () => this.errorMessage.set('No fue posible cargar los propietarios.'),
    });

    // Calendario de vigencia FIEL: del 1/ene/2022 en adelante, vigencia de 4 años.
    // Al capturar la fecha de creación se sugiere automáticamente el vencimiento,
    // salvo que el usuario ya lo haya editado manualmente.
    this.nuevoForm.get('fechaCreacion')!.valueChanges.subscribe((valor) => {
      const vencimientoCtrl = this.nuevoForm.get('fechaVencimiento')!;
      const actual = vencimientoCtrl.value ?? '';
      if (actual && actual !== this.ultimoVencimientoAuto) return;
      const calculado = calcularVencimientoFiel(valor ?? '');
      this.ultimoVencimientoAuto = calculado;
      vencimientoCtrl.setValue(calculado, { emitEvent: false });
    });
  }

  estadoVigencia = estadoVigenciaFiel;

  private cargar(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.fielService.listar(this.empresaId()).subscribe({
      next: (registros) => { this.registros.set(registros); this.loading.set(false); },
      error: () => { this.errorMessage.set('No fue posible cargar los registros.'); this.loading.set(false); },
    });
  }

  private reemplazarRegistro(actualizado: FielRegistro): void {
    this.registros.update(regs => regs.map(r => r.id === actualizado.id ? actualizado : r));
  }

  toggleCol(k:string){this.columns.update(cs=>cs.map(c=>c.key===k?{...c,visible:!c.visible}:c));}

  toggleEditar(id: number) { this.editingId.update(cur => cur === id ? null : id); }

  onCellRemove(r: FielRegistro, c: TableColumn, editRef: any, deleteRef: any) {
    if (c.type === 'file' || c.key === 'contrasena') { this.confirmarEliminarDocumento(r, c.key, c.label, deleteRef); return; }
    this.openEditar(r, editRef);
  }

  cellHasValue(r: FielRegistro, c: TableColumn): boolean {
    if (c.key === 'vigencia') return false;
    if (c.key === 'contrasena') return !!r.contrasena;
    if (c.type !== 'file') return true;
    switch (c.key) {
      case 'clavePrivada': return !!r.clavePrivadaDoc;
      case 'certificado':  return !!r.certificadoDoc;
      default: return false;
    }
  }

  subirDocumento(r: FielRegistro, campo: CampoFiel, file: File): void {
    this.errorMessage.set(null);
    this.fielService.subirDocumento(r.id, this.empresaId(), campo, file).subscribe({
      next: (actualizado) => this.reemplazarRegistro(actualizado),
      error: () => this.errorMessage.set('No fue posible subir el documento.'),
    });
  }

  contrasenaDraftValue(id: number): string {
    return this.contrasenaDraft()[id] ?? '';
  }

  onContrasenaInput(id: number, valor: string): void {
    this.contrasenaDraft.update((d) => ({ ...d, [id]: valor }));
  }

  esContrasenaVisible(id: number): boolean {
    return this.contrasenaVisible().has(id);
  }

  toggleContrasenaVisible(id: number): void {
    this.contrasenaVisible.update((set) => {
      const nuevo = new Set(set);
      nuevo.has(id) ? nuevo.delete(id) : nuevo.add(id);
      return nuevo;
    });
  }

  confirmarContrasena(r: FielRegistro): void {
    const valor = this.contrasenaDraftValue(r.id).trim();
    if (!valor || this.guardandoContrasena().has(r.id)) return;

    this.errorMessage.set(null);
    this.guardandoContrasena.update((set) => new Set(set).add(r.id));
    this.fielService.actualizarContrasena(r.id, this.empresaId(), valor).subscribe({
      next: (actualizado) => {
        this.reemplazarRegistro(actualizado);
        this.contrasenaDraft.update((d) => { const { [r.id]: _quitado, ...resto } = d; return resto; });
        this.contrasenaVisible.update((set) => { const nuevo = new Set(set); nuevo.delete(r.id); return nuevo; });
        this.guardandoContrasena.update((set) => { const nuevo = new Set(set); nuevo.delete(r.id); return nuevo; });
      },
      error: () => {
        this.errorMessage.set('No fue posible guardar la contraseña.');
        this.guardandoContrasena.update((set) => { const nuevo = new Set(set); nuevo.delete(r.id); return nuevo; });
      },
    });
  }

  openNuevo(ref:any){ this.editando.set(null); this.nuevoForm.reset(); this.modal.open(ref,{centered:true,size:'md'});}

  openEditar(r: FielRegistro, ref: any) {
    this.editando.set(r);
    this.nuevoForm.reset({
      propietarioId: r.propietarioId,
      fechaCreacion: r.fechaCreacion ?? '',
      fechaVencimiento: r.fechaVencimiento ?? '',
    });
    this.modal.open(ref, { centered: true, size: 'md' });
  }

  guardar(m:any){
    if(this.nuevoForm.invalid){this.nuevoForm.markAllAsTouched();return;}
    const v = this.nuevoForm.getRawValue();
    const datos = {
      propietarioId: Number(v.propietarioId),
      fechaCreacion: v.fechaCreacion || null,
      fechaVencimiento: v.fechaVencimiento || null,
    };
    const editando = this.editando();

    this.guardando.set(true);
    this.errorMessage.set(null);
    const peticion = editando
      ? this.fielService.actualizar(editando.id, this.empresaId(), datos)
      : this.fielService.crear(this.empresaId(), datos);

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
        this.errorMessage.set(error.error?.message ?? 'No fue posible guardar el registro.');
      },
    });
  }

  isInvalid(f:string){const c=this.nuevoForm.get(f);return c?.invalid&&c?.touched;}

  confirmarEliminar(r: FielRegistro, ref: any) {
    this.aEliminar.set({ registro: r });
    this.modal.open(ref, { centered: true });
  }

  confirmarEliminarDocumento(r: FielRegistro, columnKey: string, columnLabel: string, ref: any) {
    this.aEliminar.set({ registro: r, columnKey, columnLabel });
    this.modal.open(ref, { centered: true });
  }

  eliminarConfirmado(m: any) {
    const target = this.aEliminar();
    if (!target) { m.close(); return; }

    this.errorMessage.set(null);
    if (target.columnKey === 'contrasena') {
      this.fielService.eliminarContrasena(target.registro.id, this.empresaId()).subscribe({
        next: (actualizado) => { this.reemplazarRegistro(actualizado); this.aEliminar.set(null); },
        error: () => this.errorMessage.set('No fue posible eliminar la contraseña.'),
      });
    } else if (target.columnKey) {
      const campo = target.columnKey as CampoFiel;
      this.fielService.eliminarDocumento(target.registro.id, this.empresaId(), campo).subscribe({
        next: (actualizado) => { this.reemplazarRegistro(actualizado); this.aEliminar.set(null); },
        error: () => this.errorMessage.set('No fue posible eliminar el documento.'),
      });
    } else {
      this.fielService.eliminar(target.registro.id, this.empresaId()).subscribe({
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

  abrirAyuda(ref: any) { this.modal.open(ref, { centered: true, size: 'lg' }); }
}
