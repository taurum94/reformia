import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'
import type { Empresa, Presupuesto, LineaPresupuesto, Factura, LineaFactura } from '../types/database'

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €'
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
}

function cabeceraEmpresa(empresa: Empresa) {
  return `
    <div class="empresa">
      <h1>${empresa.razon_social}</h1>
      <p>${empresa.nif ?? ''}</p>
      <p>${empresa.direccion ?? ''}</p>
      <p>${[empresa.telefono, empresa.email].filter(Boolean).join(' · ')}</p>
      ${empresa.web ? `<p>${empresa.web}</p>` : ''}
    </div>`
}

function desgloseLinea(l: LineaPresupuesto | LineaFactura): string {
  const lp = l as LineaPresupuesto
  const partes: string[] = []
  if (lp.horas_mano_obra != null && lp.coste_hora != null)
    partes.push(`Mano de obra: ${lp.horas_mano_obra}h × ${fmt(lp.coste_hora)}/h = ${fmt(lp.horas_mano_obra * lp.coste_hora)}`)
  if (lp.materiales_coste != null)
    partes.push(`Materiales: ${fmt(lp.materiales_coste)}`)
  if (!partes.length) return ''
  return `<div class="desglose">${partes.map(p => `<span>${p}</span>`).join('')}</div>`
}

function filasLineas(lineas: (LineaPresupuesto | LineaFactura)[]) {
  return lineas.map(l => {
    const subtotal = l.cantidad * l.precio_unitario
    return `
      <tr>
        <td>${l.descripcion}${desgloseLinea(l)}</td>
        <td class="c">${l.cantidad} ${l.unidad}</td>
        <td class="r">${fmt(l.precio_unitario)}</td>
        <td class="c">${l.iva_porcentaje}%</td>
        <td class="r">${fmt(subtotal)}</td>
      </tr>`
  }).join('')
}

function bloqueIva(lineas: (LineaPresupuesto | LineaFactura)[]) {
  const desglose = lineas.reduce<Record<number, number>>((acc, l) => {
    const base = l.cantidad * l.precio_unitario
    acc[l.iva_porcentaje] = (acc[l.iva_porcentaje] ?? 0) + base * (l.iva_porcentaje / 100)
    return acc
  }, {})
  return Object.entries(desglose).map(([pct, importe]) => `
    <tr><td>IVA ${pct}%</td><td class="r">${fmt(importe)}</td></tr>
  `).join('')
}

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a2e; padding: 32px; }
  .wrap { max-width: 700px; margin: auto; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
  .empresa h1 { font-size: 18px; color: #1E3A5F; margin-bottom: 4px; }
  .empresa p { color: #555; line-height: 1.5; }
  .doc-info { text-align: right; }
  .doc-num { font-size: 22px; font-weight: 800; color: #1E3A5F; }
  .doc-tipo { font-size: 11px; font-weight: 700; text-transform: uppercase;
    color: #fff; background: #F97316; padding: 3px 10px; border-radius: 10px;
    display: inline-block; margin-bottom: 6px; }
  .doc-fecha { color: #555; margin-top: 4px; }
  .cliente-box { background: #f5f7fa; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; }
  .cliente-box .label { font-size: 10px; font-weight: 700; text-transform: uppercase;
    color: #888; letter-spacing: 0.8px; margin-bottom: 6px; }
  .cliente-box .nombre { font-size: 14px; font-weight: 700; color: #1E3A5F; }
  .cliente-box .detalle { color: #555; margin-top: 2px; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: #1E3A5F; color: #fff; }
  thead th { padding: 9px 10px; font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px; }
  tbody tr:nth-child(even) { background: #f8f9fb; }
  tbody td { padding: 9px 10px; border-bottom: 1px solid #e8eaf0; vertical-align: top; }
  .c { text-align: center; }
  .r { text-align: right; }
  .totales { margin-left: auto; width: 260px; }
  .totales table { margin-bottom: 0; }
  .totales td { padding: 6px 10px; border: none; }
  .totales tr:last-child td { font-weight: 800; font-size: 15px;
    color: #1E3A5F; border-top: 2px solid #1E3A5F; padding-top: 10px; }
  .desglose { font-size: 10px; color: #666; margin-top: 5px; display: flex; flex-wrap: wrap; gap: 6px; }
  .desglose span { background: #f0f4f8; padding: 2px 7px; border-radius: 4px; }
  .resumen-costes { margin-bottom: 16px; }
  .resumen-costes table { margin-bottom: 0; }
  .resumen-costes td { padding: 5px 10px; border: none; font-size: 12px; color: #555; }
  .resumen-costes .titulo { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #888; padding-bottom: 4px; }
  .notas { margin-top: 24px; padding: 14px; background: #fffbf5;
    border-left: 3px solid #F97316; border-radius: 4px; color: #555; font-size: 11px; }
  .iban { margin-top: 16px; text-align: center; font-size: 11px; color: #888; }
  .pie { margin-top: 32px; text-align: center; font-size: 10px; color: #aaa;
    border-top: 1px solid #e8eaf0; padding-top: 12px; }
`

type ClienteInfo = { nombre?: string; nif?: string; direccion?: string; email?: string; telefono?: string } | null

function resumenCostesHtml(lineas: LineaPresupuesto[]): string {
  const totalMO = lineas.reduce((s, l) =>
    l.horas_mano_obra != null && l.coste_hora != null ? s + l.horas_mano_obra * l.coste_hora : s, 0)
  const totalMat = lineas.reduce((s, l) =>
    l.materiales_coste != null ? s + l.materiales_coste : s, 0)
  if (!totalMO && !totalMat) return ''
  return `
    <div class="resumen-costes" style="margin-left:auto;width:260px;">
      <table>
        <tr><td colspan="2" class="titulo">Costes directos</td></tr>
        ${totalMO ? `<tr><td>Mano de obra</td><td class="r">${fmt(totalMO)}</td></tr>` : ''}
        ${totalMat ? `<tr><td>Materiales</td><td class="r">${fmt(totalMat)}</td></tr>` : ''}
      </table>
    </div>`
}

export function htmlPresupuesto(
  empresa: Empresa,
  presupuesto: Presupuesto & { cliente_nombre?: string },
  lineas: LineaPresupuesto[],
  cliente?: ClienteInfo,
) {
  const base = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0)
  const iva = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario * (l.iva_porcentaje / 100), 0)

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
  <div class="wrap">
    <div class="top">
      ${cabeceraEmpresa(empresa)}
      <div class="doc-info">
        <div class="doc-tipo">Presupuesto</div>
        <div class="doc-num">${presupuesto.numero}</div>
        <div class="doc-fecha">${fmtFecha(presupuesto.fecha)}</div>
      </div>
    </div>

    ${cliente || presupuesto.cliente_nombre ? `
    <div class="cliente-box">
      <div class="label">Cliente</div>
      <div class="nombre">${cliente?.nombre ?? presupuesto.cliente_nombre ?? ''}</div>
      <div class="detalle">
        ${[cliente?.nif, cliente?.direccion, cliente?.telefono, cliente?.email].filter(Boolean).join(' · ')}
      </div>
    </div>` : ''}

    <table>
      <thead><tr>
        <th style="text-align:left">Descripción</th>
        <th class="c">Cantidad</th>
        <th class="r">Precio unit.</th>
        <th class="c">IVA</th>
        <th class="r">Importe</th>
      </tr></thead>
      <tbody>${filasLineas(lineas)}</tbody>
    </table>

    ${resumenCostesHtml(lineas)}

    <div class="totales">
      <table>
        <tr><td>Base imponible</td><td class="r">${fmt(base)}</td></tr>
        ${bloqueIva(lineas)}
        <tr><td>TOTAL</td><td class="r">${fmt(base + iva)}</td></tr>
      </table>
    </div>

    ${presupuesto.notas ? `<div class="notas"><strong>Notas:</strong> ${presupuesto.notas}</div>` : ''}
    ${empresa.iban ? `<div class="iban">IBAN: ${empresa.iban}</div>` : ''}
    <div class="pie">${empresa.razon_social} · ${empresa.nif ?? ''} · ${empresa.email ?? ''}</div>
  </div>
  </body></html>`
}

export function htmlFactura(
  empresa: Empresa,
  factura: Factura & { cliente_nombre?: string },
  lineas: LineaFactura[],
  cliente?: ClienteInfo,
) {
  const base = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0)
  const iva = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario * (l.iva_porcentaje / 100), 0)

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
  <div class="wrap">
    <div class="top">
      ${cabeceraEmpresa(empresa)}
      <div class="doc-info">
        <div class="doc-tipo">Factura</div>
        <div class="doc-num">${factura.numero}</div>
        <div class="doc-fecha">Fecha: ${fmtFecha(factura.fecha)}</div>
        ${factura.fecha_vencimiento ? `<div class="doc-fecha" style="color:#e85d04">Vence: ${fmtFecha(factura.fecha_vencimiento)}</div>` : ''}
      </div>
    </div>

    ${cliente || factura.cliente_nombre ? `
    <div class="cliente-box">
      <div class="label">Cliente</div>
      <div class="nombre">${cliente?.nombre ?? factura.cliente_nombre ?? ''}</div>
      <div class="detalle">
        ${[cliente?.nif, cliente?.direccion, cliente?.telefono, cliente?.email].filter(Boolean).join(' · ')}
      </div>
    </div>` : ''}

    <table>
      <thead><tr>
        <th style="text-align:left">Concepto</th>
        <th class="c">Cantidad</th>
        <th class="r">Precio unit.</th>
        <th class="c">IVA</th>
        <th class="r">Importe</th>
      </tr></thead>
      <tbody>${filasLineas(lineas)}</tbody>
    </table>

    <div class="totales">
      <table>
        <tr><td>Base imponible</td><td class="r">${fmt(base)}</td></tr>
        ${bloqueIva(lineas)}
        <tr><td>TOTAL FACTURA</td><td class="r">${fmt(base + iva)}</td></tr>
      </table>
    </div>

    ${empresa.iban ? `<div class="iban">Datos bancarios — IBAN: ${empresa.iban}</div>` : ''}
    <div class="pie">${empresa.razon_social} · ${empresa.nif ?? ''} · ${empresa.email ?? ''}</div>
  </div>
  </body></html>`
}

export async function exportarPDF(html: string, nombre: string) {
  if (Platform.OS === 'web') {
    // En web: abre el diálogo de impresión del navegador (permite guardar como PDF)
    await Print.printAsync({ html })
    return
  }

  // En nativo: genera fichero PDF y abre el menú de compartir
  const { uri } = await Print.printToFileAsync({ html, base64: false })

  const puedeCompartir = await Sharing.isAvailableAsync()
  if (puedeCompartir) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Compartir ${nombre}`,
      UTI: 'com.adobe.pdf',
    })
  } else {
    await Print.printAsync({ html })
  }
}
