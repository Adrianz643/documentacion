import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { SidebarNavComponent } from './shared/components/sidebar-nav/sidebar-nav.component';
import { HeaderComponent } from './shared/components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarNavComponent, HeaderComponent],
  template: `
    @if (showChrome()) {
      <div class="gd-shell">
        <app-sidebar-nav/>
        <div class="gd-main">
          <app-header/>
          <main class="gd-content">
            <router-outlet/>
          </main>
        </div>
      </div>
    } @else {
      <router-outlet/>
    }
  `,
  styles: [`
    .gd-shell { display:flex; align-items:stretch; min-height:100vh; font-family:'Inter',sans-serif; }
    .gd-main  { flex:1; display:flex; flex-direction:column; min-width:0; background:#F7F9FC; }
    .gd-content { flex:1; padding:24px; }

    :host-context(.dark-theme) .gd-main { background:#0F1420; }
  `]
})
export class AppComponent {
  private router = inject(Router);

  private static readonly RUTAS_SIN_CHROME = ['/login', '/forgot-password', '/reset-password'];

  private isChromeRoute(url: string): boolean {
    return !AppComponent.RUTAS_SIN_CHROME.some(ruta => url.startsWith(ruta));
  }

  showChrome = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => this.isChromeRoute(e.urlAfterRedirects)),
      startWith(this.isChromeRoute(this.router.url))
    ),
    { initialValue: this.isChromeRoute(this.router.url) }
  );
}
