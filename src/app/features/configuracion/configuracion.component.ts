import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AparienciaService } from '../../core/services/apariencia.service';
import { AuthService } from '../../core/services/auth.service';
import { BackupsService, EstadoBackup } from '../../core/services/backups.service';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';

const DIAS_ANTICIPACION_MINIMO = 1;
const DIAS_ANTICIPACION_MAXIMO = 90;

@Component({
  selector: 'app-configuracion', standalone: true,
  imports: [CommonModule, FormsModule, FileSizePipe],
  templateUrl: './configuracion.component.html', styleUrl: './configuracion.component.scss',
})
export class ConfiguracionComponent implements OnInit {
  private aparienciaService = inject(AparienciaService);
  protected auth = inject(AuthService);
  private backupsService = inject(BackupsService);
  private configuracionService = inject(ConfiguracionService);

  guardado = signal(false);

  dosFactores = signal(false);
  bloqueoIntentos = signal(true);
  cerrarSesionInactividad = signal(true);

  notifCorreo = signal(true);
  notifActividad = signal(false);

  diasAnticipacionFiel = signal<number | null>(null);
  cargandoAlertaFiel = signal(false);
  guardandoAlertaFiel = signal(false);
  errorAlertaFiel = signal<string | null>(null);

  modoOscuro = signal(this.auth.usuario()?.modoOscuro ?? false);
  guardandoApariencia = signal(false);
  errorApariencia = signal<string | null>(null);

  estadoBackup = signal<EstadoBackup | null>(null);
  cargandoBackup = signal(false);
  errorBackup = signal<string | null>(null);

  ngOnInit(): void {
    if (this.auth.tienePermiso('usuarios.editar')) {
      this.cargarEstadoBackup();
      this.cargarAlertaFiel();
    }
  }

  cargarEstadoBackup(): void {
    this.cargandoBackup.set(true);
    this.errorBackup.set(null);
    this.backupsService.obtenerEstado().subscribe({
      next: (estado) => { this.estadoBackup.set(estado); this.cargandoBackup.set(false); },
      error: () => { this.errorBackup.set('No fue posible consultar el estado de los respaldos.'); this.cargandoBackup.set(false); },
    });
  }

  cargarAlertaFiel(): void {
    this.cargandoAlertaFiel.set(true);
    this.errorAlertaFiel.set(null);
    this.configuracionService.obtenerAlertaFiel().subscribe({
      next: (config) => { this.diasAnticipacionFiel.set(config.diasAnticipacion); this.cargandoAlertaFiel.set(false); },
      error: () => { this.errorAlertaFiel.set('No fue posible cargar la configuración de alertas.'); this.cargandoAlertaFiel.set(false); },
    });
  }

  guardarAlertaFiel(valor: number): void {
    if (!Number.isInteger(valor) || valor < DIAS_ANTICIPACION_MINIMO || valor > DIAS_ANTICIPACION_MAXIMO) {
      this.errorAlertaFiel.set(`Los días deben ser un entero entre ${DIAS_ANTICIPACION_MINIMO} y ${DIAS_ANTICIPACION_MAXIMO}.`);
      return;
    }

    const anterior = this.diasAnticipacionFiel();
    this.diasAnticipacionFiel.set(valor);
    this.guardandoAlertaFiel.set(true);
    this.errorAlertaFiel.set(null);

    this.configuracionService.actualizarAlertaFiel(valor).subscribe({
      next: () => { this.guardandoAlertaFiel.set(false); },
      error: () => {
        this.diasAnticipacionFiel.set(anterior);
        this.guardandoAlertaFiel.set(false);
        this.errorAlertaFiel.set('No fue posible guardar la configuración de alertas.');
      },
    });
  }

  cambiarModoOscuro(valor: boolean): void {
    const anterior = this.modoOscuro();
    this.modoOscuro.set(valor);
    this.guardandoApariencia.set(true);
    this.errorApariencia.set(null);

    this.aparienciaService.actualizar(valor).subscribe({
      next: () => {
        this.auth.actualizarModoOscuroLocal(valor);
        this.guardandoApariencia.set(false);
      },
      error: () => {
        this.modoOscuro.set(anterior);
        this.guardandoApariencia.set(false);
        this.errorApariencia.set('No fue posible guardar la preferencia de apariencia.');
      },
    });
  }

  guardar() {
    // TODO: persistir el resto de la configuración (seguridad, notificaciones) en el backend
    this.guardado.set(true);
    setTimeout(() => this.guardado.set(false), 2500);
  }
}
