import type { StoreAction, StoreGateway, StoreState } from '../../application'
import type { Category, Expense } from '../../domain'

/** Error HTTP con el mensaje en español que devuelve la API (Problem Details, RFC 9457). */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface ProblemDetails {
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

/** Cuerpo que espera la API para crear/editar un gasto (sin timestamps: los asigna el servidor). */
const expenseBody = ({ id, amount, description, categoryId, date, paymentMethod }: Expense) =>
  ({ id, amount, description, categoryId, date, paymentMethod })

const categoryBody = ({ id, name, color }: Category) => ({ id, name, color })

/**
 * Adaptador contra la API .NET (`/api`). Traduce cada acción del store a un request REST.
 * Los ids los genera el frontend y la API los respeta, así el estado en memoria y la base coinciden.
 */
export class HttpGateway implements StoreGateway {
  readonly label: string
  private readonly baseUrl: string
  private readonly fetchFn: typeof fetch

  constructor(baseUrl: string, fetchFn: typeof fetch = (...args) => fetch(...args)) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.fetchFn = fetchFn
    this.label = `Datos guardados en la API (${this.baseUrl})`
  }

  async load(): Promise<StoreState> {
    const [categories, expenses] = await Promise.all([
      this.request<Category[]>('GET', '/api/categories'),
      this.request<Expense[]>('GET', '/api/expenses'),
    ])
    return { categories, expenses }
  }

  async persist(action: StoreAction): Promise<void> {
    switch (action.type) {
      case 'expense/add':
        return this.send('POST', '/api/expenses', expenseBody(action.expense))
      case 'expense/update':
        return this.send('PUT', `/api/expenses/${encodeURIComponent(action.expense.id)}`, expenseBody(action.expense))
      case 'expense/delete':
        return this.send('DELETE', `/api/expenses/${encodeURIComponent(action.id)}`)
      case 'category/add':
        return this.send('POST', '/api/categories', categoryBody(action.category))
      case 'category/update':
        return this.send('PUT', `/api/categories/${encodeURIComponent(action.category.id)}`, categoryBody(action.category))
      case 'category/delete':
        return this.send('DELETE', `/api/categories/${encodeURIComponent(action.id)}`)
      case 'store/replace':
        return this.send('POST', '/api/import', action.state)
    }
  }

  private async send(method: HttpMethod, path: string, body?: unknown): Promise<void> {
    await this.request<unknown>(method, path, body)
  }

  private async request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
    let response: Response
    try {
      response = await this.fetchFn(`${this.baseUrl}${path}`, {
        method,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch {
      throw new ApiError(0, `No se pudo conectar con la API en ${this.baseUrl}. ¿Está corriendo?`)
    }

    if (!response.ok) throw new ApiError(response.status, await problemMessage(response))
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }
}

/** Extrae un mensaje legible de una respuesta de error (Problem Details o texto plano). */
async function problemMessage(response: Response): Promise<string> {
  try {
    const problem = (await response.json()) as ProblemDetails
    const firstFieldError = problem.errors ? Object.values(problem.errors)[0]?.[0] : undefined
    return firstFieldError ?? problem.detail ?? problem.title ?? `Error ${response.status}`
  } catch {
    return `Error ${response.status}`
  }
}
