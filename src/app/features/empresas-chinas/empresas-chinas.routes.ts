import { Routes } from '@angular/router';
export const EMPRESAS_CHINAS_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./dashboard-kpis/dashboard-kpis.component').then(m => m.DashboardKpisComponent), title: 'Dashboard Empresas Chinas' },
  { path: 'todas', loadComponent: () => import('./empresas-list-all/empresas-list-all.component').then(m => m.EmpresasListAllComponent), title: 'Todas las Empresas Chinas' },
  { path: 'etapa/1', loadComponent: () => import('./etapa1-aprobacion/etapa1-aprobacion.component').then(m => m.Etapa1AprobacionComponent), title: 'Etapa 1' },
  { path: 'etapa/2', loadComponent: () => import('./etapa2-rfc/etapa2-rfc.component').then(m => m.Etapa2RfcComponent), title: 'Etapa 2' },
  { path: 'etapa/3', loadComponent: () => import('./etapa3-firma/etapa3-firma.component').then(m => m.Etapa3FirmaComponent), title: 'Etapa 3' },
  { path: 'etapa/4', loadComponent: () => import('./etapa4-bancaria/etapa4-bancaria.component').then(m => m.Etapa4BancariaComponent), title: 'Etapa 4' },
  { path: 'etapa/5', loadComponent: () => import('./etapa5-otros/etapa5-otros.component').then(m => m.Etapa5OtrosComponent), title: 'Etapa 5' },
  { path: ':id', loadComponent: () => import('./empresa-china-detalle/empresa-china-detalle.component').then(m => m.EmpresaChinaDetalleComponent), title: 'Detalle de empresa china' },
];
