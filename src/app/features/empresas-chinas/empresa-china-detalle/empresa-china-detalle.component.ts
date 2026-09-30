import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EmpresasChinasService, EmpresaChinaDetalle } from '../../../core/services/empresas-chinas.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-empresa-china-detalle',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './empresa-china-detalle.component.html',
  styleUrl: './empresa-china-detalle.component.scss'
})
export class EmpresaChinaDetalleComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private location = inject(Location);
  private service  = inject(EmpresasChinasService);
  private modal    = inject(NgbModal);
  protected auth   = inject(AuthService);

  id           = signal(0);
  loading      = signal(false);
  errorMessage = signal<string | null>(null);
  registro     = signal<EmpresaChinaDetalle | null>(null);

  etapasDetalle = signal<EmpresaChinaDetalle['etapas']>([]);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id') ?? 0);
    this.id.set(id);

    this.loading.set(true);
    this.service.obtenerDetalle(id).subscribe({
      next: (detalle) => {
        this.registro.set(detalle);
        this.etapasDetalle.set(detalle.etapas);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('No fue posible cargar la empresa.');
        this.loading.set(false);
      },
    });
  }

  volver() {
    this.location.back();
  }

  confirmarEliminar(ref: any): void {
    this.modal.open(ref, { centered: true });
  }

  eliminarConfirmado(modal: any): void {
    this.errorMessage.set(null);
    this.service.eliminar(this.id()).subscribe({
      next: () => this.router.navigate(['/empresas-chinas/todas']),
      error: () => this.errorMessage.set('No fue posible eliminar la empresa.'),
    });
    modal.close();
  }

  estadoLabel(estado: string): string {
    switch (estado) {
      case 'en_proceso': return 'En proceso';
      case 'pendiente':  return 'Pendiente';
      case 'finalizada': return 'Finalizada';
      case 'archivada':  return 'Archivada';
      default: return estado;
    }
  }
}
