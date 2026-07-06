import { NavLink, Link } from 'react-router-dom'
import { useUIStore } from '@/stores/useUIStore'
import { navigation } from './navigation'
import NavIcon from './NavIcon'
import moneyIcon from '@/assets/money.svg'

export default function Sidebar() {
  const closeSidebar = useUIStore((s) => s.closeSidebar)

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-surface-900 border-r border-surface-200/80 dark:border-primary-700/20">
      <Link to="/" className="flex items-center gap-3 px-6 h-16">
        <img src={moneyIcon} alt="Splitio" className="w-9 h-9" />
        <span className="text-lg font-bold text-accent-500 dark:text-accent-400 tracking-tight">Splitio</span>
      </Link>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-glow-primary dark:shadow-glow-primary-dark'
                  : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-primary-600/10 hover:text-surface-800 dark:hover:text-surface-100'
              }`
            }
          >
            <NavIcon item={item} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* <div className="px-4 py-4 border-t border-surface-100 dark:border-surface-700/40">
        <p className="text-xs text-surface-400 dark:text-surface-500 text-center">Splitio v1.0</p>
      </div> */}
    </aside>
  )
}
