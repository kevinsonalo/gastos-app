import { expect, test, type Page } from '@playwright/test'

// Cada prueba arranca con un navegador limpio (localStorage vacío): solo existen las categorías por defecto.

async function irA(page: Page, seccion: 'Dashboard' | 'Gastos' | 'Categorías' | 'Administración') {
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name: seccion }).click()
  await expect(page.getByRole('heading', { level: 1, name: seccion })).toBeVisible()
}

// El formulario de alta/edición. Hay que acotar los campos a él: la barra de filtros
// de la lista también tiene un select "Categoría" y getByLabel encontraría los dos.
function formulario(page: Page) {
  return page.locator('form')
}

async function agregarGasto(page: Page, monto: string, descripcion: string, categoria = 'Alimentación') {
  const form = formulario(page)
  await form.getByLabel('Monto').fill(monto)
  await form.getByLabel('Descripción').fill(descripcion)
  await form.getByLabel('Categoría').selectOption({ label: categoria })
  await form.getByRole('button', { name: 'Agregar gasto' }).click()
}

function filaDeGasto(page: Page, descripcion: string) {
  return page.getByRole('listitem').filter({ hasText: descripcion })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Datos guardados en este navegador')).toBeVisible()
})

test('registra un gasto y aparece en la lista', async ({ page }) => {
  await irA(page, 'Gastos')
  await expect(page.getByText('Aún no hay gastos')).toBeVisible()

  await agregarGasto(page, '3500', 'Almuerzo E2E')

  await expect(page.getByRole('status')).toHaveText('✓ Guardado')
  const fila = filaDeGasto(page, 'Almuerzo E2E')
  await expect(fila).toBeVisible()
  await expect(fila).toContainText('Alimentación')
  await expect(page.getByText('1 registro(s)')).toBeVisible()
})

test('muestra los errores de validación y no guarda', async ({ page }) => {
  await irA(page, 'Gastos')

  await page.getByRole('button', { name: 'Agregar gasto' }).click()

  await expect(page.getByText('El monto debe ser mayor a 0.')).toBeVisible()
  await expect(page.getByText('La descripción es obligatoria.')).toBeVisible()
  await expect(page.getByText('Aún no hay gastos')).toBeVisible()
})

test('edita y elimina un gasto', async ({ page }) => {
  await irA(page, 'Gastos')
  await agregarGasto(page, '12000', 'Gasolina E2E', 'Transporte')

  // Editar: el formulario se carga con los datos y cambia a "Guardar cambios".
  await page.getByRole('button', { name: 'Editar Gasolina E2E' }).click()
  await expect(page.getByRole('heading', { name: 'Editar gasto' })).toBeVisible()
  await formulario(page).getByLabel('Descripción').fill('Gasolina editada E2E')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(filaDeGasto(page, 'Gasolina editada E2E')).toBeVisible()

  // Eliminar: acepta el confirm() del navegador.
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Eliminar Gasolina editada E2E' }).click()
  await expect(filaDeGasto(page, 'Gasolina editada E2E')).toHaveCount(0)
})

test('los datos sobreviven a una recarga (localStorage)', async ({ page }) => {
  await irA(page, 'Gastos')
  await agregarGasto(page, '8000', 'Persistencia E2E')

  await page.reload()
  await irA(page, 'Gastos')

  await expect(filaDeGasto(page, 'Persistencia E2E')).toBeVisible()
})
