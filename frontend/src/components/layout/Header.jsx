import { Link } from 'react-router-dom'
import { useUIStore } from '@/stores/useUIStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useAuthStore } from '@/stores/useAuthStore'
import Avatar from '@/components/ui/Avatar'
import moneyIcon from '@/assets/money.svg'

export default function Header() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 bg-white/85 dark:bg-surface-900/85 backdrop-blur-md border-b border-surface-200/70 dark:border-primary-700/20">
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 -ml-1 rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-primary-600/10 transition-colors cursor-pointer"
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <Link to="/" className="lg:hidden flex items-center gap-2.5">
        <img src={moneyIcon} alt="Splitio" className="w-8 h-8" />
        <span className="text-lg font-bold text-accent-500 dark:text-accent-400 tracking-tight">Splitio</span>
      </Link>

      <div className="lg:flex-1" />

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-primary-600/10 transition-colors cursor-pointer"
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998z" />
            </svg>
          )}
        </button>

        <div className="h-6 w-px bg-surface-200 dark:bg-primary-700/25 mx-1" />

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-surface-800 dark:text-surface-100 leading-none">
              {user?.name}
            </span>
            <span className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">{user?.email}</span>
          </div>
          <Avatar name={user?.name} src={user?.avatar} size="sm" />
        </div>

        <button
          onClick={logout}
          className="p-2 rounded-xl text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-primary-600/10 transition-colors cursor-pointer"
          aria-label="Cerrar sesión"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
        </button>
      </div>
    </header>
  )
}
