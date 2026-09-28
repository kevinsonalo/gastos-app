export type ValidationErrors<T> = Partial<Record<keyof T, string>>

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0
}
