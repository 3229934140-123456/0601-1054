import { NavLink } from 'react-router-dom'
import {
  Home,
  Users,
  FileText,
  Sprout,
  Bell,
  MapPin,
} from 'lucide-react'

interface SidebarProps {
  currentPath: string
}

const menuItems = [
  { path: '/dashboard', label: '首页地图', icon: Home },
  { path: '/households', label: '农户档案', icon: Users },
  { path: '/matters', label: '事项办理', icon: FileText },
  { path: '/industry', label: '产业台账', icon: Sprout },
  { path: '/notices', label: '通知统计', icon: Bell },
]

export default function Sidebar({ currentPath }: SidebarProps) {
  return (
    <aside className="w-64 bg-gradient-to-b from-primary-800 to-primary-900 text-white flex flex-col">
      <div className="p-5 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg">数字乡村</h1>
            <p className="text-xs text-primary-200">东风村管理系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPath === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                  : 'text-primary-100 hover:bg-primary-700/50 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-primary-700">
        <div className="bg-primary-700/50 rounded-lg p-3">
          <p className="text-xs text-primary-200">今日工作</p>
          <p className="text-lg font-bold mt-1">待办事项 8 项</p>
          <p className="text-xs text-primary-300 mt-1">预警 3 条需处理</p>
        </div>
      </div>
    </aside>
  )
}
