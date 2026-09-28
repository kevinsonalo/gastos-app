import type { Clock, IdGenerator } from '../../application'

export const cryptoIdGenerator: IdGenerator = {
  next() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  },
}

export const systemClock: Clock = {
  now: () => new Date().toISOString(),
}
