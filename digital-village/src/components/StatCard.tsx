import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: string
  trendUp?: boolean
  color?: 'green' | 'blue' | 'orange' | 'red' | 'purple'
}

const colorClasses = {
  green: 'bg-green-100 text-green-600',
  blue: 'bg-blue-100 text-blue-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
}

export default function StatCard({ title, value, icon, trend, trendUp, color = 'green' }: StatCardProps) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
      {trend && (
        <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}
    </div>
  )
}
