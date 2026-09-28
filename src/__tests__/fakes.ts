import type { Services } from '../application'

/** Servicios deterministas para probar casos de uso. */
export function fakeServices(now = '2026-09-27T12:00:00.000Z'): Services {
  let seq = 0
  return {
    ids: { next: () => `id-${++seq}` },
    clock: { now: () => now },
  }
}
