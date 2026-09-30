import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Empresa } from '../../../core/models';
import { OcultoParaVisorDirective } from '../../../shared/directives/oculto-para-visor.directive';
import { AuthService } from '../../../core/services/auth.service';

const SUBROL_POR_SLUG: Record<string, string> = { ardum: 'ARDUM', 'empresas-chinas': 'EMPRESAS_CHINAS' };

@Component({ selector:'app-empresas-list', standalone:true,
  imports:[CommonModule,RouterLink,NgbPaginationModule,OcultoParaVisorDirective],
  templateUrl:'./empresas-list.component.html', styleUrl:'./empresas-list.component.scss' })
export class EmpresasListComponent {
  private auth = inject(AuthService);

  private todasLasEmpresas=signal<Empresa[]>([
    {id:1,nombre:'ARDUM',tipo:'nacional',activa:true,slug:'ardum',createdAt:'2026-01-01',updatedAt:'2026-01-01'},
    {id:2,nombre:'EMPRESAS CHINAS',tipo:'china',activa:true,slug:'empresas-chinas',createdAt:'2026-01-01',updatedAt:'2026-01-01'},
  ]);

  empresas = computed(() => this.todasLasEmpresas().filter((e) => {
    const subrol = SUBROL_POR_SLUG[e.slug];
    return !subrol || this.auth.tieneSubrol(subrol);
  }));
}
