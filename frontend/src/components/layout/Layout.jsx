import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileNav from './MobileNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Sidebar />
      <MobileNav />
      <div className="lg:pl-64">
        <Header />
        <main className="p-5 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
