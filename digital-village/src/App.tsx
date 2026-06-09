import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Households from './pages/Households'
import Matters from './pages/Matters'
import Industry from './pages/Industry'
import Notices from './pages/Notices'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="households" element={<Households />} />
        <Route path="matters" element={<Matters />} />
        <Route path="industry" element={<Industry />} />
        <Route path="notices" element={<Notices />} />
      </Route>
    </Routes>
  )
}
