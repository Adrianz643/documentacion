import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbTooltipModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { UsuarioListItem } from '../../../core/models';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/services/auth.service';

const BUSQUEDA_DEBOUNCE_MS = 350;

@Component({
  selector: 'app-usuarios-list', standalone: true,
  imports: [CommonModule, RouterLink, NgbTooltipModule, NgbPaginationModule],
  templateUrl: './usuarios-list.component.html', styleUrl: './usuarios-list.component.scss',
})
export class UsuariosListComponent implements OnInit, OnDestroy {
  private usuarioService = inject(UsuarioService);
  private modal = inject(NgbModal);
  protected auth = inject(AuthService);
  private debounceHandle?: ReturnType<typeof setTimeout>;

  search = signal('');
  page = signal(1);
  pageSize = signal(25);
  total = signal(0);
  usuarios = signal<UsuarioListItem[]>([]);
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  aEliminar = signal<UsuarioListItem | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    clearTimeout(this.debounceHandle);
  }

  onSearchInput(valor: string): void {
    this.search.set(valor);
    this.page.set(1);
    clearTimeout(this.debounceHandle);
    this.debounceHandle = setTimeout(() => this.cargar(), BUSQUEDA_DEBOUNCE_MS);
  }

  onPageChange(pagina: number): void {
    this.page.set(pagina);
    this.cargar();
  }

  colorEstado(clave: string): string {
    switch (clave) {
      case 'ACTIVO': return '#22C55E';
      case 'BLOQUEADO': return '#F59E0B';
      case 'INACTIVO': return '#6B7280';
      default: return '#DC2626';
    }
  }

  colorRol(nombre: string): string {
    switch (nombre) {
      case 'superadmin': return '#0B4DB8';
      case 'admin': return '#1596A0';
      case 'editor': return '#7C3AED';
      default: return '#6B7280';
    }
  }

  private cargar(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.usuarioService.listar({ page: this.page(), perPage: this.pageSize(), search: this.search() }).subscribe({
      next: (resultado) => {
        this.usuarios.set(resultado.data);
        this.total.set(resultado.total);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('No fue posible cargar los usuarios.');
        this.loading.set(false);
      },
    });
  }

  confirmarEliminar(u: UsuarioListItem, ref: any): void {
    this.aEliminar.set(u);
    this.modal.open(ref, { centered: true });
  }

  eliminarConfirmado(modal: any): void {
    const u = this.aEliminar();
    if (!u) { modal.close(); return; }

    this.errorMessage.set(null);
    this.usuarioService.eliminar(u.id).subscribe({
      next: () => {
        this.usuarios.update(list => list.filter(x => x.id !== u.id));
        this.total.update(t => Math.max(0, t - 1));
        this.aEliminar.set(null);
      },
      error: () => this.errorMessage.set('No fue posible eliminar el usuario.'),
    });
    modal.close();
  }
}
