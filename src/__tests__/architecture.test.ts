import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Regla de dependencias (Clean Architecture): cada capa solo puede importar
 * de las capas listadas. main.tsx (composition root) queda fuera de la regla.
 */
const ALLOWED: Record<string, string[]> = {
  domain: ['domain'],
  application: ['domain', 'application'],
  infrastructure: ['domain', 'application', 'infrastructure'],
  presentation: ['domain', 'application', 'presentation'],
}

/** Paquetes externos prohibidos por capa: el núcleo no conoce React. */
const FORBIDDEN_PACKAGES: Record<string, string[]> = {
  domain: ['react', 'react-dom'],
  application: ['react', 'react-dom'],
}

const SRC = resolve(__dirname, '..')
const IMPORT_SPEC = /\bfrom\s+['"]([^'"]+)['"]|\bimport\s+['"]([^'"]+)['"]/g

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.tsx?$/.test(entry.name) ? [full] : []
  })
}

const layerOf = (file: string) => relative(SRC, file).split(sep)[0]

function violations(layer: string): string[] {
  return sourceFiles(join(SRC, layer)).flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(IMPORT_SPEC)]
      .map((m) => m[1] ?? m[2])
      .filter((spec) =>
        spec.startsWith('.')
          ? !ALLOWED[layer].includes(layerOf(resolve(dirname(file), spec)))
          : (FORBIDDEN_PACKAGES[layer] ?? []).includes(spec),
      )
      .map((spec) => `${relative(SRC, file)} → ${spec}`),
  )
}

describe('arquitectura en capas', () => {
  it.each(Object.keys(ALLOWED))('la capa %s respeta la regla de dependencias', (layer) => {
    expect(violations(layer)).toEqual([])
  })
})
