import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { DashboardService, DocumentoReciente } from '../../core/services/dashboard.service';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';

type AccesoIcon = 'building' | 'folder' | 'upload' | 'users' | 'shield';
type AccesoColor = 'blue' | 'green' | 'purple' | 'orange' | 'teal';
type EmpresaIcon = 'building' | 'globe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NgbDropdownModule, SafeUrlPipe, FileSizePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private service = inject(DashboardService);
  private modal = inject(NgbModal);

  stats = signal({ empresasActivas: 2, documentosTotales: 0, empresas: ['ARDUM', 'EMPRESAS CHINAS'] });

  accesos = signal<{ label: string; icon: AccesoIcon; color: AccesoColor; sub: string; route: string }[]>([
    { label: 'Empresas',        icon: 'building', color: 'blue',   sub: 'Ver todas',     route: '/empresas' },
    { label: 'Documentos',      icon: 'folder',   color: 'green',  sub: 'Explorar',      route: '/empresas/1/documentos/personales' },
    { label: 'Subir documento', icon: 'upload',   color: 'purple', sub: 'Nuevo archivo', route: '/empresas/1/documentos/personales' },
    { label: 'Usuarios',        icon: 'users',    color: 'orange', sub: 'Administrar',   route: '/usuarios' },
    { label: 'Seguridad',       icon: 'shield',   color: 'teal',   sub: 'Configuración', route: '/usuarios' },
  ]);

  recientes = signal<DocumentoReciente[]>([]);
  docPreview = signal<DocumentoReciente | null>(null);
  loadingRecientes = signal(false);

  empresasActivas = signal<{ nombre: string; icon: EmpresaIcon; color: AccesoColor; route: string }[]>([
    { nombre: 'ARDUM',             icon: 'building', color: 'blue',   route: '/empresas/1' },
    { nombre: 'EMPRESAS CHINAS',   icon: 'globe',    color: 'purple', route: '/empresas-chinas/todas' },
  ]);

  ngOnInit(): void {
    this.loadingRecientes.set(true);
    this.service.obtenerResumen().subscribe({
      next: (resumen) => {
        this.stats.update((s) => ({ ...s, documentosTotales: resumen.documentosTotales }));
        this.recientes.set(resumen.recientes);
        this.loadingRecientes.set(false);
      },
      error: () => this.loadingRecientes.set(false),
    });
  }

  abrirPreview(doc: DocumentoReciente, ref: unknown) {
    this.docPreview.set(doc);
    this.modal.open(ref, { centered: true, size: 'lg' });
  }

  esArchivoSensible(doc: DocumentoReciente): boolean {
    const nombre = doc.nombreArchivo.toLowerCase();
    return nombre.endsWith('.cer') || nombre.endsWith('.key');
  }

  tagPorMime(mime: string): string {
    if (mime === 'application/pdf') return 'PDF';
    if (mime.startsWith('image/')) return 'IMG';
    if (mime.includes('spreadsheet') || mime.includes('excel')) return 'XLS';
    if (mime.includes('word')) return 'DOC';
    return 'ARCH';
  }
}
