import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { EmpresaChina } from '../../../core/models';
import { EmpresasChinasService } from '../../../core/services/empresas-chinas.service';
import { agregarLogoReporte, dibujarGraficoPastelConLeyenda, SegmentoPastel } from '../../../core/utils/pdf-report.util';

@Component({ selector:'app-empresas-list-all', standalone:true,
  imports:[CommonModule,RouterLink,NgbPaginationModule,NgbTooltipModule],
  templateUrl:'./empresas-list-all.component.html', styleUrl:'./empresas-list-all.component.scss' })
export class EmpresasListAllComponent implements OnInit {
  private service = inject(EmpresasChinasService);

  search=signal(''); page=signal(1); pageSize=signal(25);
  empresas=signal<EmpresaChina[]>([]);
  loading=signal(false);
  errorMessage=signal<string | null>(null);

  filtrados=computed(()=>{const q=this.search().toLowerCase();return q?this.empresas().filter(e=>e.nombre.toLowerCase().includes(q)||e.codigo.toLowerCase().includes(q)):this.empresas();});
  estadoColor(e:string){return e==='finalizada'||e==='archivada'?'#22C55E':e==='en_proceso'?'#0B4DB8':'#F59E0B';}

  kpis = computed(() => {
    const empresas = this.empresas();
    let enProceso = 0, pendientes = 0, finalizadas = 0;
    for (const e of empresas) {
      if (e.estado === 'en_proceso') enProceso++;
      else if (e.estado === 'pendiente') pendientes++;
      else if (e.estado === 'finalizada' || e.estado === 'archivada') finalizadas++;
    }
    return { total: empresas.length, enProceso, pendientes, finalizadas };
  });

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.service.listarTodas().subscribe({
      next: (empresas) => { this.empresas.set(empresas); this.loading.set(false); },
      error: () => { this.errorMessage.set('No fue posible cargar las empresas.'); this.loading.set(false); },
    });
  }

  private titleCase(s: string): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  private formatFecha(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async generarReporte() {
    const doc = new jsPDF({ orientation: 'landscape' });
    await agregarLogoReporte(doc);

    doc.setFontSize(16);
    doc.text('Reporte de Empresas Chinas', 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generado el ${new Date().toLocaleString('es-MX')}`, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(
      `Total: ${this.kpis().total}    En proceso: ${this.kpis().enProceso}    Pendientes: ${this.kpis().pendientes}    Finalizadas: ${this.kpis().finalizadas}`,
      14, 30
    );

    const k = this.kpis();
    const segmentos: SegmentoPastel[] = [
      { etiqueta: 'En proceso', valor: k.enProceso, color: [11, 77, 184] },
      { etiqueta: 'Pendientes', valor: k.pendientes, color: [245, 158, 11] },
      { etiqueta: 'Finalizadas', valor: k.finalizadas, color: [34, 197, 94] },
    ];
    const diametroGrafico = 42;
    const yGrafico = 36;
    dibujarGraficoPastelConLeyenda(doc, segmentos, 14, yGrafico, diametroGrafico);

    autoTable(doc, {
      startY: yGrafico + diametroGrafico + 8,
      head: [['ID', 'Empresa', 'Representante', 'Etapa actual', 'Progreso', 'Estado', 'Última actualización']],
      body: this.filtrados().map(e => [
        e.codigo,
        e.nombre,
        e.representanteLegal || '—',
        `Etapa ${e.etapaActual}`,
        `${e.progresoPct}%`,
        this.titleCase(e.estado),
        this.formatFecha(e.updatedAt),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [11, 77, 184] },
    });

    doc.save(`reporte-empresas-chinas-${this.fechaArchivo()}.pdf`);
  }

  async generarReporteIndividual(e: EmpresaChina) {
    const doc = new jsPDF();
    await agregarLogoReporte(doc);

    doc.setFontSize(16);
    doc.text(`Reporte de ${e.nombre}`, 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generado el ${new Date().toLocaleString('es-MX')}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Campo', 'Valor']],
      body: [
        ['ID', e.codigo],
        ['Empresa', e.nombre],
        ['Representante', e.representanteLegal || '—'],
        ['Etapa actual', `Etapa ${e.etapaActual}`],
        ['Progreso', `${e.progresoPct}%`],
        ['Estado', this.titleCase(e.estado)],
        ['Última actualización', this.formatFecha(e.updatedAt)],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [11, 77, 184] },
    });

    doc.save(`reporte-${this.slug(e.nombre)}.pdf`);
  }

  async descargarExpediente(e: EmpresaChina) {
    const detalle = await firstValueFrom(this.service.obtenerDetalle(e.id));
    const zip = new JSZip();
    let documentosIncluidos = 0;

    for (const etapa of detalle.etapas) {
      const documentos = etapa.requisitosEstado
        .filter(({ valor }) => valor?.completado && valor.documento)
        .map(({ valor }) => valor!.documento!);

      if (!documentos.length) continue;

      const carpeta = zip.folder(`Etapa ${etapa.etapaNum}`)!;
      for (const doc of documentos) {
        documentosIncluidos++;
        try {
          const blob = await fetch(doc.rutaStorage).then(r => r.blob());
          carpeta.file(doc.nombreArchivo, blob);
        } catch {
          carpeta.file(doc.nombreArchivo, `No fue posible descargar ${doc.nombreArchivo}`);
        }
      }
    }

    zip.file(
      'expediente-info.txt',
      `Expediente de ${e.nombre}\n` +
      `Código: ${e.codigo}\n` +
      `Etapa actual: Etapa ${e.etapaActual}\n` +
      `Estado: ${this.titleCase(e.estado)}\n` +
      `Progreso: ${e.progresoPct}%\n` +
      `Documentos incluidos: ${documentosIncluidos}\n` +
      `Generado el ${new Date().toLocaleString('es-MX')}\n`
    );

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${e.nombre} ${this.fechaArchivo()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private slug(nombre: string): string {
    return nombre.toLowerCase().normalize('NFD').replace(/[^\x00-\x7f]/g, '').replace(/\s+/g, '-');
  }

  private fechaArchivo(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
