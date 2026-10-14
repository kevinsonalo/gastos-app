/**
 * Convierte un correo (.eml en formato MIME, o un .html / .txt guardado) en texto plano.
 * Sin dependencias: decodifica quoted-printable y base64, respeta el charset y quita el HTML.
 */

const HEADER_END = /\r?\n\r?\n/

interface MimePart {
  headers: Record<string, string>
  body: string
}

function parsePart(raw: string): MimePart {
  const match = HEADER_END.exec(raw)
  if (!match) return { headers: {}, body: raw }
  const headerText = raw.slice(0, match.index).replace(/\r?\n[ \t]+/g, ' ') // une encabezados plegados
  const headers: Record<string, string> = {}
  for (const line of headerText.split(/\r?\n/)) {
    const colon = line.indexOf(':')
    if (colon > 0) headers[line.slice(0, colon).trim().toLowerCase()] = line.slice(colon + 1).trim()
  }
  return { headers, body: raw.slice(match.index + match[0].length) }
}

const param = (header: string | undefined, name: string) =>
  header?.match(new RegExp(`${name}\\s*=\\s*"?([^";]+)"?`, 'i'))?.[1]

function bytesToText(bytes: Uint8Array, charset = 'utf-8'): string {
  try {
    return new TextDecoder(charset.toLowerCase()).decode(bytes)
  } catch {
    return new TextDecoder('utf-8').decode(bytes)
  }
}

function decodeQuotedPrintable(text: string): Uint8Array {
  const clean = text.replace(/=\r?\n/g, '') // saltos de línea suaves
  const bytes: number[] = []
  for (let i = 0; i < clean.length; i++) {
    const hex = clean.slice(i + 1, i + 3)
    if (clean[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(hex)) {
      bytes.push(parseInt(hex, 16))
      i += 2
    } else {
      bytes.push(clean.charCodeAt(i) & 0xff)
    }
  }
  return Uint8Array.from(bytes)
}

function decodeBase64(text: string): Uint8Array {
  const binary = atob(text.replace(/\s+/g, ''))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

function decodeBody(part: MimePart): string {
  const encoding = (part.headers['content-transfer-encoding'] ?? '').toLowerCase()
  const charset = param(part.headers['content-type'], 'charset')
  if (encoding === 'quoted-printable') return bytesToText(decodeQuotedPrintable(part.body), charset)
  if (encoding === 'base64') {
    try {
      return bytesToText(decodeBase64(part.body), charset)
    } catch {
      return ''
    }
  }
  return part.body
}

const ENTITIES: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', colon: ':',
}

/** HTML → texto: celdas separadas por tabulador, filas y bloques por salto de línea. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(td|th)>/gi, '\t')
    .replace(/<\/(tr|p|div|li|h[1-6]|table)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name] ?? m)
    .replace(/[  ]+/g, ' ')
    .replace(/ *\t[ \t]*/g, '\t')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

const isHtml = (contentType: string | undefined, text: string) =>
  contentType ? /html/i.test(contentType) : /<\/?(html|body|table|div|p|br)\b/i.test(text)

/** Recorre las partes MIME y junta el texto legible del correo. */
function collectText(part: MimePart, depth = 0): string[] {
  const type = part.headers['content-type'] ?? ''
  const boundary = param(type, 'boundary')
  if (/multipart\//i.test(type) && boundary && depth < 5) {
    return part.body
      .split(`--${boundary}`)
      .slice(1)
      .filter((chunk) => !chunk.startsWith('--'))
      .flatMap((chunk) => collectText(parsePart(chunk.replace(/^\r?\n/, '')), depth + 1))
  }
  if (type && !/text\//i.test(type)) return [] // adjuntos, imágenes
  const body = decodeBody(part)
  return [isHtml(type, body) ? htmlToText(body) : body]
}

export interface ParsedEmail {
  subject: string
  from: string
  /** Encabezado Date del correo, si existe. */
  date?: string
  text: string
}

/** Lee un .eml, .html o .txt y devuelve asunto, remitente, fecha y texto plano. */
export function parseEmail(content: string): ParsedEmail {
  const looksLikeMime = /^(?:[\w-]+:.*\r?\n)+/i.test(content) && /\n(?:from|subject|content-type):/i.test(`\n${content}`)
  if (!looksLikeMime) {
    return { subject: '', from: '', text: isHtml(undefined, content) ? htmlToText(content) : content }
  }
  const root = parsePart(content)
  return {
    subject: decodeHeader(root.headers.subject ?? ''),
    from: decodeHeader(root.headers.from ?? ''),
    date: root.headers.date,
    text: collectText(root).join('\n'),
  }
}

/** Decodifica encabezados RFC 2047: =?UTF-8?Q?Notificaci=C3=B3n?= / =?UTF-8?B?...?= */
export function decodeHeader(value: string): string {
  return value.replace(/=\?([^?]+)\?([QB])\?([^?]*)\?=/gi, (_, charset: string, enc: string, text: string) =>
    enc.toUpperCase() === 'B'
      ? bytesToText(decodeBase64(text), charset)
      : bytesToText(decodeQuotedPrintable(text.replace(/_/g, ' ')), charset),
  )
}
