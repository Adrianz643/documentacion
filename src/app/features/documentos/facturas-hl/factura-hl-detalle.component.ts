import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Documento, FacturaHl } from '../../../core/models';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';
import { FacturasHlService } from '../../../core/services/facturas-hl.service';

@Component({
  selector: 'app-factura-hl-detalle',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, SafeUrlPipe, FileSizePipe],
  templateUrl: './factura-hl-detalle.component.html',
  styleUrl: './factura-hl-detalle.component.scss'
})
export class FacturaHlDetalleComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private service = inject(FacturasHlService);
  private modal   = inject(NgbModal);

  id           = signal(0);
  loading      = signal(false);
  errorMessage = signal<string | null>(null);
  registro     = signal<FacturaHl | null>(null);
  docPreview   = signal<Documento | null>(null);

  ngOnInit() {
    this.id.set(Number(this.route.snapshot.paramMap.get('id') ?? 0));

    this.loading.set(true);
    this.service.obtener(this.id()).subscribe({
      next: (registro) => { this.registro.set(registro); this.loading.set(false); },
      error: () => { this.errorMessage.set('No fue posible cargar el registro.'); this.loading.set(false); },
    });
  }

  abrirPreview(doc: Documento, ref: any) {
    this.docPreview.set(doc);
    this.modal.open(ref, { centered: true, size: 'lg' });
  }
}
