import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { KpiEmpresasChinas } from '../../../core/models';
import { EmpresasChinasService } from '../../../core/services/empresas-chinas.service';

const KPI_VACIO: KpiEmpresasChinas = { total: 0, enProceso: 0, pendientes: 0, finalizadas: 0, progresoPorEtapa: [] };

@Component({ selector:'app-dashboard-kpis', standalone:true, imports:[CommonModule,RouterLink],
  templateUrl:'./dashboard-kpis.component.html', styleUrl:'./dashboard-kpis.component.scss' })
export class DashboardKpisComponent implements OnInit {
  private service = inject(EmpresasChinasService);

  kpis = signal<KpiEmpresasChinas>(KPI_VACIO);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.service.obtenerKpis().subscribe({
      next: (kpis) => { this.kpis.set(kpis); this.loading.set(false); },
      error: () => { this.errorMessage.set('No fue posible cargar los indicadores.'); this.loading.set(false); },
    });
  }
}
