import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: ReactNode
}

export default function Card({ children, className = '', title, subtitle, action }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}
