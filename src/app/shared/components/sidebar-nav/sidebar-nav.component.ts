import { Component, signal, input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem { label:string; icon:string; route:string; children?:NavItem[]; subrol?:string; }

const OCULTOS_PARA_VISOR = new Set(['Usuarios', 'Configuración', 'Actividad', 'Papelera']);

function filtrarPorSubrol(items: NavItem[], tieneSubrol: (clave: string) => boolean): NavItem[] {
  return items.reduce<NavItem[]>((acc, item) => {
    if (item.subrol && !tieneSubrol(item.subrol)) return acc;
    if (item.children) {
      const children = filtrarPorSubrol(item.children, tieneSubrol);
      if (children.length === 0) return acc;
      acc.push({ ...item, children });
    } else {
      acc.push(item);
    }
    return acc;
  }, []);
}

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar-nav.component.html',
  styleUrl: './sidebar-nav.component.scss'
})
export class SidebarNavComponent {
  private auth = inject(AuthService);
  expanded = signal<Set<string>>(new Set());

  private todosLosItems = signal<NavItem[]>([
    { label:'Inicio',        icon:'fi-rr-home', route:'/dashboard' },
    { label:'Empresas',      icon:'fi-rr-building', route:'/empresas'  },
    { label:'Documentos',    icon:'fi-rr-folder', route:'#', children:[
      { label:'ARDUM', icon:'fi-rr-folder-open', route:'/empresas/1', children:[
        { label:'Documentos Personales', icon:'fi-rr-document', route:'/empresas/1/documentos/personales', subrol:'ARDUM' },
        { label:'Documentos Fiscales',   icon:'fi-rr-folder', route:'#', children:[
          { label:'FIEL',          icon:'fi-rr-document', route:'/empresas/1/documentos/fiel', subrol:'ARDUM' },
          { label:'Declaraciones', icon:'fi-rr-document', route:'/empresas/1/documentos/declaraciones', subrol:'ARDUM' },
          { label:'Facturas ARDUM', icon:'fi-rr-document', route:'/empresas/1/documentos/facturas', subrol:'ARDUM' },
          { label:'Facturas HL',   icon:'fi-rr-document', route:'/hl/facturas', subrol:'ARDUM_HL' },
        ]},
      ]},
      { label:'Empresas Chinas', icon:'fi-rr-globe', route:'#', subrol:'EMPRESAS_CHINAS', children:[
        { label:'Etapa 1: Aprobación del nombre de la empresa y estatutos', icon:'fi-rr-document', route:'/empresas-chinas/etapa/1' },
        { label:'Etapa 2: Registro Fiscal RFC',                              icon:'fi-rr-document', route:'/empresas-chinas/etapa/2' },
        { label:'Etapa 3: Firma Electrónica',                                icon:'fi-rr-document', route:'/empresas-chinas/etapa/3' },
        { label:'Etapa 4: Apertura de cuenta bancaria corporativa',          icon:'fi-rr-document', route:'/empresas-chinas/etapa/4' },
        { label:'Etapa 5: Otros',                                            icon:'fi-rr-document', route:'/empresas-chinas/etapa/5' },
      ]},
    ]},
    { label:'Usuarios',      icon:'fi-rr-user', route:'/usuarios'       },
    { label:'Configuración', icon:'fi-rr-settings', route:'/configuracion'  },
    { label:'Actividad',     icon:'fi-rr-clock', route:'/actividad'      },
    { label:'Papelera',      icon:'fi-rr-trash', route:'/papelera'       },
  ]);

  navItems = computed(() => {
    const base = this.auth.esVisor()
      ? this.todosLosItems().filter(item => !OCULTOS_PARA_VISOR.has(item.label))
      : this.todosLosItems();
    return filtrarPorSubrol(base, (clave) => this.auth.tieneSubrol(clave));
  });

  toggle(label:string) {
    this.expanded.update(s => { const n=new Set(s); n.has(label)?n.delete(label):n.add(label); return n; });
  }
  isOpen(label:string) { return this.expanded().has(label); }
}
