import { NavLink, Link } from 'react-router-dom'
import { useUIStore } from '@/stores/useUIStore'
import { navigation } from './navigation'
import NavIcon from './NavIcon'
import moneyIcon from '@/assets/money.svg'

export default function MobileNav() {
  const { sidebarOpen, closeSidebar } = useUIStore()

  if (!sidebarOpen) return null

  return (
    <div className="fixed inset-0 z-40 lg:hidden" onClick={closeSidebar}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <aside
        className="relative w-72 h-full bg-white dark:bg-surface-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-surface-100 dark:border-primary-700/20">
          <Link to="/" onClick={closeSidebar} className="flex items-center gap-3">
            <img src={moneyIcon} alt="Splitio" className="w-9 h-9" />
            <span className="text-lg font-bold text-accent-500 dark:text-accent-400 tracking-tight">Splitio</span>
          </Link>
          <button
            onClick={closeSidebar}
            className="p-1.5 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-primary-600/10 cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="px-3 py-3 space-y-0.5">
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
      </aside>
    </div>
  )
}
