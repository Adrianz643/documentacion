import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActividadItem, ActividadService } from '../../core/services/actividad.service';

const ACCIONES: Record<ActividadItem['accion'], { label: string; icon: string; color: string }> = {
  crear:     { label: 'Creación',      icon: 'fi-rr-plus',          color: '#22C55E' },
  editar:    { label: 'Edición',       icon: 'fi-rr-edit',          color: '#0B4DB8' },
  eliminar:  { label: 'Eliminación',   icon: 'fi-rr-trash',         color: '#DC2626' },
  subir:     { label: 'Carga',         icon: 'fi-rr-cloud-upload',  color: '#7C3AED' },
  restaurar: { label: 'Restauración',  icon: 'fi-rr-undo',          color: '#F59E0B' },
  login:     { label: 'Inicio sesión', icon: 'fi-rr-sign-in-alt',   color: '#1596A0' },
  logout:    { label: 'Cierre sesión', icon: 'fi-rr-sign-out-alt',  color: '#6B7280' },
};

@Component({
  selector: 'app-actividad', standalone: true,
  imports: [CommonModule, NgbPaginationModule],
  templateUrl: './actividad.component.html', styleUrl: './actividad.component.scss',
})
export class ActividadComponent implements OnInit {
  private service = inject(ActividadService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  search = signal('');
  moduloFiltro = signal('');
  page = signal(1);
  pageSize = signal(10);
  actividades = signal<ActividadItem[]>([]);

  modulos = computed(() => Array.from(new Set(this.actividades().map(a => a.modulo))).sort());

  filtrados = computed(() => {
    const q = this.search().toLowerCase();
    const modulo = this.moduloFiltro();
    return this.actividades().filter(a =>
      (!modulo || a.modulo === modulo) &&
      (!q || a.usuario.toLowerCase().includes(q) || a.descripcion.toLowerCase().includes(q))
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
      next: (actividades) => { this.actividades.set(actividades); this.loading.set(false); },
      error: () => { this.errorMessage.set('No fue posible cargar la actividad.'); this.loading.set(false); },
    });
  }

  accionInfo(accion: ActividadItem['accion']) {
    return ACCIONES[accion];
  }
}
