import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificacionLog } from '../../../core/models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, NgbDropdownModule, NgbTooltipModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  auth  = inject(AuthService);
  notif = inject(NotificationService);
  private router = inject(Router);

  @ViewChild('buscarInput') private buscarInput?: ElementRef<HTMLInputElement>;

  buscarAbierto = signal(false);
  busqueda = signal('');

  toggleBuscar(): void {
    this.buscarAbierto.update(v => !v);
    if (this.buscarAbierto()) {
      setTimeout(() => this.buscarInput?.nativeElement.focus());
    } else {
      this.busqueda.set('');
    }
  }

  cerrarBuscar(): void {
    this.buscarAbierto.set(false);
    this.busqueda.set('');
  }

  private isDashboardUrl(url: string): boolean {
    return url === '/' || url.startsWith('/dashboard');
  }

  isDashboard = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => this.isDashboardUrl(e.urlAfterRedirects)),
      startWith(this.isDashboardUrl(this.router.url))
    ),
    { initialValue: this.isDashboardUrl(this.router.url) }
  );

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  abrirNotificacion(n: NotificacionLog): void {
    if (!n.leida) {
      this.notif.marcarLeida(n.id).subscribe(() => this.notif.refrescar());
    }
    this.router.navigateByUrl(n.ruta);
  }

  eliminarNotificacion(n: NotificacionLog): void {
    this.notif.eliminar(n.id).subscribe(() => this.notif.refrescar());
  }

  marcarTodasLeidas(): void {
    this.notif.markAllRead().subscribe(() => this.notif.refrescar());
  }
}
