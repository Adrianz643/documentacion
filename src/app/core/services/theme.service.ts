// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

import { Injectable, signal } from '@angular/core';

const DARK_CLASS = 'dark-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _modoOscuro = signal(false);
  modoOscuro = this._modoOscuro.asReadonly();

  aplicar(valor: boolean): void {
    this._modoOscuro.set(valor);
    document.body.classList.toggle(DARK_CLASS, valor);
  }
}
