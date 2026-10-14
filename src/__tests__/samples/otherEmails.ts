/** Correos de ejemplo de otros bancos y comercios (datos ficticios, etiquetas típicas). */

const eml = (from: string, subject: string, body: string, date = 'Tue, 13 Oct 2026 09:10:00 -0600') =>
  [
    `From: ${from}`,
    'To: kevin@example.com',
    `Subject: ${subject}`,
    `Date: ${date}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    body,
  ].join('\r\n')

const table = (rows: Array<[string, string]>) =>
  `<html><body><table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table></body></html>`

/** BCR: otras etiquetas ("Establecimiento", "Número de referencia", "Fecha de la transacción"). */
export const bcrEmail = eml(
  'Banco de Costa Rica <alertas@bancobcr.com>',
  'Aviso de compra con su tarjeta',
  table([
    ['Establecimiento:', 'FARMACIA FISCHEL CARTAGO'],
    ['Fecha de la transacción:', '13/10/2026'],
    ['Número de referencia:', '000123456'],
    ['Monto:', '₡8.750,00'],
  ]),
)

/** BN: pago por SINPE Móvil a una persona. */
export const bnSinpeEmail = eml(
  'BN Notificaciones <notificaciones@bncr.fi.cr>',
  'Comprobante SINPE Móvil',
  table([
    ['Beneficiario:', 'VERDULERIA DON PEPE'],
    ['Fecha:', '2026-10-11'],
    ['Comprobante:', '2026101100045'],
    ['Monto:', 'CRC 3,200.00'],
  ]),
)

/** Recibo de un comercio sin perfil: sin etiqueta "Comercio", se usa el nombre del remitente. */
export const merchantReceipt = eml(
  'Uber Receipts <noreply@uber.com>',
  'Tu viaje del martes',
  '<html><body><p>Gracias por viajar con Uber</p><table><tr><td>Total</td><td>₡4.300</td></tr></table></body></html>',
)

/** Promoción de un comercio: no trae monto etiquetado, no es un gasto. */
export const promoEmail = eml(
  'Tienda XYZ <ofertas@tiendaxyz.co.cr>',
  '¡50% de descuento!',
  '<html><body><p>Aprovechá nuestras ofertas esta semana.</p></body></html>',
)
