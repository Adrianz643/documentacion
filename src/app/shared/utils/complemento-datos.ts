// Autor: Adrian Alejandro Vazquez Zambrano · Contacto: adrian.ale.1130@gmail.com
// Archivo de autoría de Adrian Alejandro Vazquez Zambrano. Su distribución o modificación requiere su permiso expreso.

import type JSZip from 'jszip';
import { EmpresaChinaRequisito, EtapaRequisito } from '../../core/models';
import { formatearValorRequisito } from './valor-requisito';

export interface GrupoComplementoDatos {
  titulo: string;
  requisitos: { req: EtapaRequisito; valor: EmpresaChinaRequisito | undefined }[];
}

const CARACTERES_NO_VALIDOS = /[\/:*?"<>|]/g;

function construirTexto(empresa: string, fecha: string, grupos: GrupoComplementoDatos[]): string | null {
  const bloques: string[] = [];
  for (const grupo of grupos) {
    const lineas = grupo.requisitos
      .filter(({ req, valor }) => req.tipoCampo !== 'archivo' && valor?.completado && valor.valorTexto)
      .map(({ req, valor }) => `  ${req.codigo} - ${req.descripcion}: ${formatearValorRequisito(req.tipoCampo, valor?.valorTexto)}`);
    if (lineas.length) bloques.push([grupo.titulo, ...lineas].join('\n'));
  }
  if (!bloques.length) return null;
  return `﻿Complemento de datos - ${empresa}\nFecha: ${fecha}\n\n${bloques.join('\n\n')}\n`;
}

export function agregarComplementoDatos(zip: Pick<JSZip, 'file'>, empresa: string, fecha: string, grupos: GrupoComplementoDatos[]): void {
  const texto = construirTexto(empresa, fecha, grupos);
  if (!texto) return;
  zip.file(`${empresa}_${fecha}_complemento_datos.txt`.replace(CARACTERES_NO_VALIDOS, '-'), texto);
}
