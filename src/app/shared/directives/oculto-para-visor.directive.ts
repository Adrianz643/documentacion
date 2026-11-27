// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

import { Directive, inject, TemplateRef, ViewContainerRef, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Directive({ selector: '[appOcultoParaVisor]', standalone: true })
export class OcultoParaVisorDirective {
  private auth = inject(AuthService);
  private tpl  = inject(TemplateRef<unknown>);
  private vcr  = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      const esVisor = this.auth.esVisor();
      this.vcr.clear();
      if (!esVisor) this.vcr.createEmbeddedView(this.tpl);
    });
  }
}
