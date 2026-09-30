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
