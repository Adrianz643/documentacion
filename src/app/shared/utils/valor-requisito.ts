import { EmpresaChinaRequisito, EtapaRequisito } from '../../core/models';

export function formatearValorRequisito(tipoCampo: EtapaRequisito['tipoCampo'], valor: string | null | undefined): string {
  if (!valor) return '—';
  if (tipoCampo === 'fecha') {
    const [anio, mes, dia] = valor.split('-');
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : valor;
  }
  return valor;
}

export function valorCelda(req: EtapaRequisito, valor: EmpresaChinaRequisito | undefined): string {
  return formatearValorRequisito(req.tipoCampo, valor?.valorTexto);
}
