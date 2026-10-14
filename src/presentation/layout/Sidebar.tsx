export type Page = 'dashboard' | 'expenses' | 'categories' | 'admin'

interface NavItem {
  id: Page
  label: string
  icon: string
}

const MAIN: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'expenses', label: 'Gastos', icon: '🧾' },
  { id: 'categories', label: 'Categorías', icon: '🏷️' },
]

const ADMIN: NavItem[] = [{ id: 'admin', label: 'Administración', icon: '⚙️' }]

interface Props {
  current: Page
  storageLabel: string
  onNavigate: (page: Page) => void
}

/** Menú lateral. En pantallas angostas se convierte en una barra horizontal (ver index.css). */
export function Sidebar({ current, storageLabel, onNavigate }: Props) {
  const item = (nav: NavItem) => (
    <li key={nav.id}>
      <button
        type="button"
        className={current === nav.id ? 'nav-item active' : 'nav-item'}
        aria-current={current === nav.id ? 'page' : undefined}
        onClick={() => onNavigate(nav.id)}
      >
        <span aria-hidden>{nav.icon}</span>
        <span>{nav.label}</span>
      </button>
    </li>
  )

  return (
    <aside className="sidebar">
      <div className="brand">💸 Mis Gastos</div>
      <nav aria-label="Navegación principal">
        <ul>{MAIN.map(item)}</ul>
        <p className="nav-section">Sistema</p>
        <ul>{ADMIN.map(item)}</ul>
      </nav>
      <p className="sidebar-foot muted">{storageLabel}</p>
    </aside>
  )
}
