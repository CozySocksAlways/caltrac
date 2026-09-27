import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import Log from './pages/Log'
import Dashboard from './pages/Dashboard'
import DayDetail from './pages/DayDetail'
import Setup from './pages/Setup'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <header className="app-header">
        <h1>CalTrac</h1>
        <NavLink to="/setup" className="icon-btn" aria-label="Settings">
          ⚙
        </NavLink>
      </header>
      <main className="app-main">{children}</main>
      <nav className="app-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-icon">＋</span>
          Log
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-icon">▤</span>
          Dashboard
        </NavLink>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Log />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/day/:date" element={<DayDetail />} />
          <Route path="/setup" element={<Setup />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
