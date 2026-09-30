import { Component, TemplateRef, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpErrorResponse } from '@angular/common/http';
import { PapeleraItem, PapeleraService } from '../../core/services/papelera.service';

@Component({
  selector: 'app-papelera', standalone: true,
  imports: [CommonModule, NgbPaginationModule, NgbTooltipModule],
  templateUrl: './papelera.component.html', styleUrl: './papelera.component.scss',
})
export class PapeleraComponent implements OnInit {
  private modal   = inject(NgbModal);
  private service = inject(PapeleraService);

  loading      = signal(false);
  errorMessage = signal<string | null>(null);

  search       = signal('');
  moduloFiltro = signal('');
  page         = signal(1);
  pageSize     = signal(10);
  elementos    = signal<PapeleraItem[]>([]);
  seleccionado = signal<PapeleraItem | null>(null);

  modulos = computed(() => Array.from(new Set(this.elementos().map(e => e.moduloLabel))).sort());

  filtrados = computed(() => {
    const q = this.search().toLowerCase();
    const modulo = this.moduloFiltro();
    return this.elementos().filter(e =>
      (!modulo || e.moduloLabel === modulo) &&
      (!q || e.nombre.toLowerCase().includes(q))
    );
  });

  paginados = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtrados().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.service.listar().subscribe({
      next: (elementos) => { this.elementos.set(elementos); this.loading.set(false); },
      error: () => { this.errorMessage.set('No fue posible cargar la papelera.'); this.loading.set(false); },
    });
  }

  restaurar(item: PapeleraItem) {
    this.errorMessage.set(null);
    this.service.restaurar(item.modulo, item.id).subscribe({
      next: () => this.elementos.update(list => list.filter(e => !(e.modulo === item.modulo && e.id === item.id))),
      error: () => this.errorMessage.set('No fue posible restaurar el elemento.'),
    });
  }

  confirmarEliminar(item: PapeleraItem, modalRef: TemplateRef<unknown>) {
    this.seleccionado.set(item);
    this.modal.open(modalRef, { centered: true });
  }

  eliminarDefinitivo(modal: { close: () => void }) {
    const item = this.seleccionado();
    if (item) {
      this.errorMessage.set(null);
      this.service.eliminarDefinitivo(item.modulo, item.id).subscribe({
        next: () => {
          this.elementos.update(list => list.filter(e => !(e.modulo === item.modulo && e.id === item.id)));
          this.seleccionado.set(null);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.error?.message ?? 'No fue posible eliminar el elemento.');
        },
      });
    }
    modal.close();
  }

  vaciarPapelera() {
    this.errorMessage.set(null);
    this.service.vaciar().subscribe({
      next: () => this.elementos.set([]),
      error: () => this.errorMessage.set('No fue posible vaciar la papelera.'),
    });
  }

  iconoTipo(tipo: string): string {
    switch (tipo) {
      case 'Empresa': return 'fi-rr-building';
      case 'Usuario': return 'fi-rr-user';
      case 'Factura': return 'fi-rr-receipt';
      case 'Declaración': return 'fi-rr-calendar';
      default: return 'fi-rr-document';
    }
  }
}
