/** Correos de ejemplo con la estructura típica de las notificaciones de BAC Credomatic (datos ficticios). */

const bacHtml = (rows: Array<[string, string]>) =>
  `<html><body><p>Hola KEVIN, a continuaci&oacute;n le detallamos la transacci&oacute;n realizada:</p><table>${rows
    .map(([k, v]) => `<tr><td><b>${k}</b></td><td>${v}</td></tr>`)
    .join('')}</table><p>BAC Credomatic</p></body></html>`

/** .eml con HTML en quoted-printable, como lo descarga Gmail ("Descargar mensaje"). */
export const bacEml = (opts: { merchant?: string; date?: string; amount?: string; reference?: string; kind?: string } = {}) => {
  const html = bacHtml([
    ['Comercio:', opts.merchant ?? 'AUTOMERCADO TRES RIOS'],
    ['Ciudad y país:', 'SAN JOSE, Costa Rica'],
    ['Fecha:', opts.date ?? 'Oct 12, 2026, 14:35'],
    ['VISA', '************1234'],
    ['Autorización:', '987654'],
    ['Referencia:', opts.reference ?? '512345678901'],
    ['Tipo de Transacción:', opts.kind ?? 'COMPRA'],
    ['Monto:', opts.amount ?? 'CRC 12,500.00'],
  ])
  const qp = html
    .replace(/[^\x20-\x7e]|=/g, (c) =>
      Array.from(new TextEncoder().encode(c)).map((b) => `=${b.toString(16).toUpperCase().padStart(2, '0')}`).join(''),
    )
    .replace(/(.{70})/g, '$1=\r\n')
  return [
    'From: BAC Credomatic <notificacion@notificacionesbaccr.com>',
    'To: kevin@example.com',
    'Subject: =?UTF-8?Q?Notificaci=C3=B3n_de_transacci=C3=B3n?=',
    'Date: Mon, 12 Oct 2026 14:36:02 -0600',
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="b1"',
    '',
    '--b1',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    qp,
    '--b1--',
    '',
  ].join('\r\n')
}

/** Mismo correo guardado como .html desde el navegador. */
export const bacSavedHtml = bacHtml([
  ['Comercio:', 'UBER *TRIP'],
  ['Fecha:', '05/10/2026'],
  ['Referencia:', '777'],
  ['Tipo de Transacción:', 'COMPRA'],
  ['Monto:', 'USD 9.50'],
])

export const unrelatedEmail = [
  'From: Newsletter <news@example.com>',
  'Subject: Ofertas de la semana',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'Hola, estas son nuestras ofertas.',
].join('\r\n')
