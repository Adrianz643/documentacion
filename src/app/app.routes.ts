import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { noVisorGuard } from './core/guards/no-visor.guard';
import { subrolGuard } from './core/guards/subrol.guard';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent), title: 'Iniciar sesión' },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent), title: 'Recuperar contraseña' },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent), title: 'Restablecer contraseña' },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), title: 'Inicio' },
      { path: 'perfil', loadComponent: () => import('./features/perfil/mi-perfil.component').then(m => m.MiPerfilComponent), title: 'Mi perfil' },
      { path: 'perfil/editar', loadComponent: () => import('./features/perfil/mi-perfil-editar.component').then(m => m.MiPerfilEditarComponent), title: 'Editar mi perfil' },
      { path: 'empresas', loadComponent: () => import('./features/empresas/empresas-list/empresas-list.component').then(m => m.EmpresasListComponent), title: 'Empresas' },
      { path: 'empresas/:id', canActivate: [subrolGuard('ARDUM')], loadComponent: () => import('./features/empresas/empresa-detail/empresa-detail.component').then(m => m.EmpresaDetailComponent), title: 'Empresa' },
      { path: 'empresas/:empresaId/documentos/personales', canActivate: [subrolGuard('ARDUM')], loadComponent: () => import('./features/documentos/doc-personales/doc-personales.component').then(m => m.DocPersonalesComponent), title: 'Docs Personales' },
      { path: 'empresas/:empresaId/documentos/personales/:id', canActivate: [subrolGuard('ARDUM')], loadComponent: () => import('./features/documentos/doc-personales/doc-personal-detalle.component').then(m => m.DocPersonalDetalleComponent), title: 'Detalle de documento personal' },
      { path: 'empresas/:empresaId/documentos/fiel', canActivate: [subrolGuard('ARDUM')], loadComponent: () => import('./features/documentos/fiel/fiel.component').then(m => m.FielComponent), title: 'FIEL' },
      { path: 'empresas/:empresaId/documentos/fiel/:id', canActivate: [subrolGuard('ARDUM')], loadComponent: () => import('./features/documentos/fiel/fiel-detalle.component').then(m => m.FielDetalleComponent), title: 'Detalle FIEL' },
      { path: 'empresas/:empresaId/documentos/declaraciones', canActivate: [subrolGuard('ARDUM')], loadComponent: () => import('./features/documentos/declaraciones/declaraciones.component').then(m => m.DeclaracionesComponent), title: 'Declaraciones' },
      { path: 'empresas/:empresaId/documentos/declaraciones/:id', canActivate: [subrolGuard('ARDUM')], loadComponent: () => import('./features/documentos/declaraciones/declaracion-detalle.component').then(m => m.DeclaracionDetalleComponent), title: 'Detalle de declaración' },
      { path: 'empresas/:empresaId/documentos/facturas', canActivate: [subrolGuard('ARDUM')], loadComponent: () => import('./features/documentos/facturas/facturas.component').then(m => m.FacturasComponent), title: 'Facturas ARDUM' },
      { path: 'empresas/:empresaId/documentos/facturas/:id', canActivate: [subrolGuard('ARDUM')], loadComponent: () => import('./features/documentos/facturas/factura-detalle.component').then(m => m.FacturaDetalleComponent), title: 'Detalle de factura' },
      { path: 'hl/facturas', canActivate: [subrolGuard('ARDUM_HL')], loadComponent: () => import('./features/documentos/facturas-hl/facturas-hl.component').then(m => m.FacturasHlComponent), title: 'Facturas HL' },
      { path: 'hl/facturas/:id', canActivate: [subrolGuard('ARDUM_HL')], loadComponent: () => import('./features/documentos/facturas-hl/factura-hl-detalle.component').then(m => m.FacturaHlDetalleComponent), title: 'Detalle de factura HL' },
      { path: 'empresas-chinas', canActivate: [subrolGuard('EMPRESAS_CHINAS')], loadChildren: () => import('./features/empresas-chinas/empresas-chinas.routes').then(m => m.EMPRESAS_CHINAS_ROUTES) },
      { path: 'usuarios', canActivate: [noVisorGuard], loadComponent: () => import('./features/usuarios/usuarios-list/usuarios-list.component').then(m => m.UsuariosListComponent), title: 'Usuarios' },
      { path: 'usuarios/nuevo', canActivate: [noVisorGuard], loadComponent: () => import('./features/usuarios/usuario-form/usuario-form.component').then(m => m.UsuarioFormComponent), title: 'Nuevo usuario' },
      { path: 'usuarios/:id/editar', canActivate: [noVisorGuard], loadComponent: () => import('./features/usuarios/usuario-form/usuario-form.component').then(m => m.UsuarioFormComponent), title: 'Editar usuario' },
      { path: 'actividad', canActivate: [noVisorGuard], loadComponent: () => import('./features/actividad/actividad.component').then(m => m.ActividadComponent), title: 'Actividad' },
      { path: 'configuracion', canActivate: [noVisorGuard], loadComponent: () => import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent), title: 'Configuración' },
      { path: 'papelera', canActivate: [noVisorGuard], loadComponent: () => import('./features/papelera/papelera.component').then(m => m.PapeleraComponent), title: 'Papelera' },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
