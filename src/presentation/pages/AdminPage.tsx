import type { ExpenseStore } from '../hooks/useExpenseStore'
import { BackupControls } from '../components/BackupControls'
import { DangerZone } from '../components/DangerZone'
import { EmailImport } from '../components/EmailImport'

interface Props {
  store: ExpenseStore
}

/** Administración: importar datos (correos y respaldos) y borrar todo. */
export function AdminPage({ store }: Props) {
  return (
    <>
      <EmailImport onImport={store.importBankEmails} />

      <section className="card">
        <h2>Respaldo de datos</h2>
        <p className="muted">{store.storageLabel}. Exportá un respaldo para moverlos o protegerlos.</p>
        <BackupControls onExport={store.exportBackup} onImport={store.importBackup} />
      </section>

      <DangerZone expenseCount={store.expenses.length} onReset={store.resetData} />
    </>
  )
}
