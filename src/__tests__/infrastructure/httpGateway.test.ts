import { describe, expect, it } from 'vitest'
import type { StoreAction } from '../../application'
import { createGateway } from '../../infrastructure/container'
import { ApiError, HttpGateway } from '../../infrastructure/http/httpGateway'
import { cats, exp } from '../fixtures'

interface Call {
  method: string
  url: string
  body?: unknown
}

/** fetch falso que registra las llamadas y responde lo indicado por URL. */
function fakeFetch(responses: Record<string, Response> = {}) {
  const calls: Call[] = []
  const fn: typeof fetch = async (input, init) => {
    const url = String(input)
    calls.push({ method: init?.method ?? 'GET', url, body: init?.body ? JSON.parse(String(init.body)) : undefined })
    return responses[url] ?? new Response(null, { status: 204 })
  }
  return { fn, calls }
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

describe('HttpGateway', () => {
  it('se elige con VITE_DATA_SOURCE=api', () => {
    expect(createGateway({ dataSource: 'api', apiUrl: 'http://api.test' })).toBeInstanceOf(HttpGateway)
  })

  it('carga categorías y gastos desde la API', async () => {
    const expense = exp({ id: 'e1' })
    const { fn } = fakeFetch({
      'http://api.test/api/categories': json(cats),
      'http://api.test/api/expenses': json([expense]),
    })

    const state = await new HttpGateway('http://api.test/', fn).load()

    expect(state).toEqual({ categories: cats, expenses: [expense] })
  })

  it.each<[StoreAction, string, string]>([
    [{ type: 'expense/add', expense: exp({ id: 'e1' }) }, 'POST', '/api/expenses'],
    [{ type: 'expense/update', expense: exp({ id: 'e 1' }) }, 'PUT', '/api/expenses/e%201'],
    [{ type: 'expense/delete', id: 'e1' }, 'DELETE', '/api/expenses/e1'],
    [{ type: 'category/add', category: cats[0] }, 'POST', '/api/categories'],
    [{ type: 'category/update', category: cats[0] }, 'PUT', `/api/categories/${cats[0].id}`],
    [{ type: 'category/delete', id: 'food' }, 'DELETE', '/api/categories/food'],
    [{ type: 'store/replace', state: { categories: [], expenses: [] } }, 'POST', '/api/import'],
  ])('traduce %o a %s %s', async (action, method, path) => {
    const { fn, calls } = fakeFetch()

    await new HttpGateway('http://api.test', fn).persist(action)

    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ method, url: `http://api.test${path}` })
  })

  it('envía el gasto sin timestamps (los asigna el servidor)', async () => {
    const { fn, calls } = fakeFetch()
    const expense = exp({ id: 'e1', amount: 2500 })

    await new HttpGateway('http://api.test', fn).persist({ type: 'expense/add', expense })

    expect(calls[0].body).toEqual({
      id: 'e1',
      amount: 2500,
      description: expense.description,
      categoryId: expense.categoryId,
      date: expense.date,
      paymentMethod: expense.paymentMethod,
    })
  })

  it('convierte un Problem Details en ApiError con el primer mensaje por campo', async () => {
    const { fn } = fakeFetch({
      'http://api.test/api/expenses': json({ title: 'Hay datos inválidos.', errors: { amount: ['El monto debe ser mayor a 0.'] } }, 400),
    })

    const promise = new HttpGateway('http://api.test', fn).persist({ type: 'expense/add', expense: exp({}) })

    await expect(promise).rejects.toBeInstanceOf(ApiError)
    await expect(promise).rejects.toThrow('El monto debe ser mayor a 0.')
  })

  it('informa claramente cuando la API no está corriendo', async () => {
    const offline: typeof fetch = async () => {
      throw new TypeError('Failed to fetch')
    }

    await expect(new HttpGateway('http://api.test', offline).load()).rejects.toThrow(/¿Está corriendo\?/)
  })
})
