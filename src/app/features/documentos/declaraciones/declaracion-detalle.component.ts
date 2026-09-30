import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Declaracion, Documento } from '../../../core/models';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';
import { DeclaracionesService } from '../../../core/services/declaraciones.service';

@Component({
  selector: 'app-declaracion-detalle',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, SafeUrlPipe, FileSizePipe],
  templateUrl: './declaracion-detalle.component.html',
  styleUrl: './declaracion-detalle.component.scss'
})
export class DeclaracionDetalleComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private service = inject(DeclaracionesService);
  private modal   = inject(NgbModal);

  empresaId    = signal(0);
  id           = signal(0);
  loading      = signal(false);
  errorMessage = signal<string | null>(null);
  registro     = signal<Declaracion | null>(null);
  docPreview   = signal<Documento | null>(null);

  ngOnInit() {
    this.empresaId.set(Number(this.route.snapshot.paramMap.get('empresaId') ?? 1));
    this.id.set(Number(this.route.snapshot.paramMap.get('id') ?? 0));

    this.loading.set(true);
    this.service.obtener(this.id(), this.empresaId()).subscribe({
      next: (registro) => { this.registro.set(registro); this.loading.set(false); },
      error: () => { this.errorMessage.set('No fue posible cargar el registro.'); this.loading.set(false); },
    });
  }

  abrirPreview(doc: Documento, ref: any) {
    this.docPreview.set(doc);
    this.modal.open(ref, { centered: true, size: 'lg' });
  }
}
