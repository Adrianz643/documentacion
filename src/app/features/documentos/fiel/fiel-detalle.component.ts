import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Documento, FielRegistro } from '../../../core/models';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';
import { FielService } from '../../../core/services/fiel.service';
import { estadoVigenciaFiel } from '../../../shared/utils/fiel-vigencia';

@Component({
  selector: 'app-fiel-detalle',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, SafeUrlPipe, FileSizePipe],
  templateUrl: './fiel-detalle.component.html',
  styleUrl: './fiel-detalle.component.scss'
})
export class FielDetalleComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private service = inject(FielService);
  private modal   = inject(NgbModal);

  empresaId    = signal(0);
  id           = signal(0);
  loading      = signal(false);
  errorMessage = signal<string | null>(null);
  registro     = signal<FielRegistro | null>(null);
  docPreview   = signal<Documento | null>(null);

  documentos = computed(() => {
    const r = this.registro();
    if (!r) return [];
    return [
      { key: 'clavePrivada', label: 'Clave Privada',       doc: r.clavePrivadaDoc },
      { key: 'certificado',  label: 'Certificado (.cer)',  doc: r.certificadoDoc },
    ];
  });

  contrasenaVisible = signal(false);
  toggleContrasenaVisible() { this.contrasenaVisible.update((v) => !v); }

  ngOnInit() {
    this.empresaId.set(Number(this.route.snapshot.paramMap.get('empresaId') ?? 1));
    this.id.set(Number(this.route.snapshot.paramMap.get('id') ?? 0));

    this.loading.set(true);
    this.service.obtener(this.id(), this.empresaId()).subscribe({
      next: (registro) => { this.registro.set(registro); this.loading.set(false); },
      error: () => { this.errorMessage.set('No fue posible cargar el registro.'); this.loading.set(false); },
    });
  }

  estadoVigencia = estadoVigenciaFiel;

  abrirPreview(doc: Documento, ref: any) {
    this.docPreview.set(doc);
    this.modal.open(ref, { centered: true, size: 'lg' });
  }

  esArchivoSensible(doc: Documento): boolean {
    const nombre = doc.nombreArchivo.toLowerCase();
    return nombre.endsWith('.cer') || nombre.endsWith('.key');
  }
}
