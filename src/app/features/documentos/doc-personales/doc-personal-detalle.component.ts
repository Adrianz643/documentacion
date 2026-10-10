import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Documento, DocumentoPersonal } from '../../../core/models';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';
import { DocumentosPersonalesService } from '../../../core/services/documentos-personales.service';

@Component({
  selector: 'app-doc-personal-detalle',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, SafeUrlPipe, FileSizePipe],
  templateUrl: './doc-personal-detalle.component.html',
  styleUrl: './doc-personal-detalle.component.scss'
})
export class DocPersonalDetalleComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private service = inject(DocumentosPersonalesService);
  private modal   = inject(NgbModal);

  empresaId    = signal(0);
  id           = signal(0);
  loading      = signal(false);
  errorMessage = signal<string | null>(null);
  registro     = signal<DocumentoPersonal | null>(null);
  docPreview   = signal<Documento | null>(null);

  documentos = computed(() => {
    const r = this.registro();
    if (!r) return [];
    return [
      { key: 'contratoArdum',     label: 'Contrato Ardum',      doc: r.contratoArdumDoc },
      { key: 'contratoHegewisch', label: 'Contrato Hegewisch',  doc: r.contratoHegewischDoc },
      { key: 'csf',               label: 'CSF',                 doc: r.csfDoc },
      { key: 'acuseCita',         label: 'Acuse cita',          doc: r.acuseCitaDoc },
    ];
  });

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
