interface ProgressStep {
  label: string
  status: 'completed' | 'current' | 'pending'
  time?: string
  operator?: string
  remark?: string
}

interface ProgressTimelineProps {
  steps: ProgressStep[]
}

export default function ProgressTimeline({ steps }: ProgressTimelineProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => (
        <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.status === 'completed'
                  ? 'bg-primary-500 text-white'
                  : step.status === 'current'
                  ? 'bg-primary-100 text-primary-600 ring-4 ring-primary-50'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.status === 'completed' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-0.5 flex-1 min-h-[40px] mt-1 ${
                  step.status === 'completed' ? 'bg-primary-300' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2">
              <p
                className={`font-medium ${
                  step.status === 'pending' ? 'text-gray-500' : 'text-gray-900'
                }`}
              >
                {step.label}
              </p>
              {step.time && (
                <span className="text-xs text-gray-500">{step.time}</span>
              )}
            </div>
            {step.operator && (
              <p className="text-sm text-gray-600 mt-0.5">操作人：{step.operator}</p>
            )}
            {step.remark && (
              <p className="text-sm text-gray-500 mt-1">{step.remark}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
