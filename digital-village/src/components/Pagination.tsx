import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  current: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}

export default function Pagination({ current, total, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1
  const end = Math.min(current * pageSize, total)

  const pages: (number | string)[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages)
    } else if (current >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', totalPages)
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
      <p className="text-sm text-gray-600">
        显示 <span className="font-medium">{start}</span> - <span className="font-medium">{end}</span> 条，共 <span className="font-medium">{total}</span> 条
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
          className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((page, i) =>
          typeof page === 'string' ? (
            <span key={i} className="px-3 py-2 text-gray-400">
              {page}
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onChange(page)}
              className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                page === current
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onChange(current + 1)}
          disabled={current === totalPages}
          className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
