// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

import { Directive, inject, input, TemplateRef, ViewContainerRef, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Directive({ selector: '[appHasRole]', standalone: true })
export class HasRoleDirective {
  appHasRole = input<string[]>([]);
  private auth = inject(AuthService);
  private tpl  = inject(TemplateRef);
  private vcr  = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      const roles    = this.appHasRole();
      const usuario  = this.auth.usuario();
      const allowed  = !roles.length || (!!usuario && roles.includes(usuario.rol?.nombre ?? ''));
      this.vcr.clear();
      if (allowed) this.vcr.createEmbeddedView(this.tpl);
    });
  }
}
