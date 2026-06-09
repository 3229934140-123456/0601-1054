import { Users, Home, Landmark, FileCheck, Sprout, Bell, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import { useStore } from '../store/StoreContext'
import { villageGroups } from '../data/mockData'

const todoPriorityColors: Record<string, string> = {
  '高': 'danger',
  '中': 'warning',
  '低': 'default',
}

const todoStatusColors: Record<string, string> = {
  '待办': 'warning',
  '进行中': 'primary',
  '已完成': 'success',
}

const warningLevelColors: Record<string, string> = {
  '严重': 'danger',
  '警告': 'warning',
  '提示': 'info',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { households, matters, crops, livestocks, notices, todoItems, warningItems, recentActivities } = useStore()
  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  const liveStats = useMemo(() => {
    const totalPopulation = households.reduce((sum, h) => sum + h.familyMembers.length, 0)
    const totalLand = households.reduce((sum, h) => sum + h.farmlands.reduce((s, f) => s + f.area, 0), 0)
    const pendingMatters = matters.filter(m => ['待受理', '审核中', '待补充材料'].includes(m.status)).length
    const totalIndustries = crops.length + livestocks.length
    const unreadNotices = notices.reduce((sum, n) => sum + (n.totalCount - n.readCount), 0)
    const lowIncome = households.filter(h => h.familyType === '低保户').length
    const fiveGuarantee = households.filter(h => h.familyType === '五保户').length
    const monitored = households.filter(h => h.familyType === '监测户').length
    const poverty = households.filter(h => h.familyType === '脱贫户').length
    return {
      totalPopulation,
      totalHouseholds: households.length,
      totalLand: Math.round(totalLand * 10) / 10,
      pendingMatters,
      totalIndustries,
      unreadNotices,
      lowIncome,
      fiveGuarantee,
      monitored,
      poverty,
    }
  }, [households, matters, crops, livestocks, notices])

  const populationData = useMemo(() => villageGroups.map(g => {
    const hs = households.filter(h => h.groupId === g.id)
    return {
      name: g.name.replace('东风村', ''),
      人口: hs.reduce((s, h) => s + h.familyMembers.length, 0),
      户数: hs.length,
    }
  }), [households])

  const familyTypeData = useMemo(() => [
    { name: '普通户', value: liveStats.totalHouseholds - liveStats.lowIncome - liveStats.fiveGuarantee - liveStats.monitored - liveStats.poverty, color: '#22c55e' },
    { name: '低保户', value: liveStats.lowIncome, color: '#f59e0b' },
    { name: '五保户', value: liveStats.fiveGuarantee, color: '#ef4444' },
    { name: '监测户', value: liveStats.monitored, color: '#3b82f6' },
    { name: '脱贫户', value: liveStats.poverty, color: '#8b5cf6' },
  ].filter(d => d.value > 0), [liveStats])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">首页概览</h1>
          <p className="text-gray-500 mt-1">东风村数字乡村管理系统</p>
        </div>
        <div className="text-sm text-gray-500">
          今日是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="总人口" value={liveStats.totalPopulation} icon={<Users className="w-6 h-6" />} color="green" />
        <StatCard title="总户数" value={liveStats.totalHouseholds} icon={<Home className="w-6 h-6" />} color="blue" />
        <StatCard title="耕地面积(亩)" value={liveStats.totalLand} icon={<Landmark className="w-6 h-6" />} color="orange" />
        <StatCard title="办理中事项" value={liveStats.pendingMatters} icon={<FileCheck className="w-6 h-6" />} color="purple" />
        <StatCard title="产业项目" value={liveStats.totalIndustries} icon={<Sprout className="w-6 h-6" />} color="green" />
        <StatCard title="未读通知(户)" value={liveStats.unreadNotices} icon={<Bell className="w-6 h-6" />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="村组分布地图" subtitle="按村组查看人口与地块分布" className="lg:col-span-2">
          <div className="relative h-80 bg-gradient-to-br from-green-50 to-primary-50 rounded-xl overflow-hidden border-2 border-primary-100">
            <svg viewBox="0 0 400 300" className="w-full h-full">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d1fae5" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="400" height="300" fill="url(#grid)" />

              {villageGroups.map((group, i) => {
                const positions = [
                  { x: 80, y: 80 },
                  { x: 200, y: 60 },
                  { x: 320, y: 100 },
                  { x: 100, y: 200 },
                  { x: 260, y: 220 },
                ]
                const pos = positions[i]
                const size = Math.sqrt(group.landArea) * 3
                const isActive = activeGroup === group.id
                return (
                  <g key={group.id}
                    onClick={() => setActiveGroup(isActive ? null : group.id)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={size / 2}
                      fill={isActive ? '#22c55e' : '#86efac'}
                      fillOpacity={isActive ? 0.7 : 0.4}
                      stroke={isActive ? '#15803d' : '#22c55e'}
                      strokeWidth={isActive ? 3 : 1.5}
                      className="transition-all duration-300"
                    />
                    <text x={pos.x} y={pos.y + 4} textAnchor="middle" className="text-xs font-bold fill-gray-800">
                      {group.name.replace('东风村', '')}
                    </text>
                  </g>
                )
              })}

              <line x1="80" y1="80" x2="200" y2="60" stroke="#86efac" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="200" y1="60" x2="320" y2="100" stroke="#86efac" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="80" y1="80" x2="100" y2="200" stroke="#86efac" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="200" y1="60" x2="260" y2="220" stroke="#86efac" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="100" y1="200" x2="260" y2="220" stroke="#86efac" strokeWidth="2" strokeDasharray="5,5" />
            </svg>

            <div className="absolute bottom-4 left-4 right-4">
              {activeGroup ? (
                <div className="bg-white rounded-lg shadow-lg p-3">
                  {(() => {
                    const g = villageGroups.find(x => x.id === activeGroup)
                    const gh = households.filter(h => h.groupId === activeGroup)
                    return g ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{g.name}</p>
                          <p className="text-sm text-gray-500">
                            人口 {gh.reduce((s, h) => s + h.familyMembers.length, 0)} 人 · {gh.length} 户 · 耕地 {g.landArea} 亩
                          </p>
                        </div>
                        <Badge variant="primary">{gh.length} 户已建档</Badge>
                      </div>
                    ) : null
                  })()}
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur rounded-lg shadow-lg p-3 text-sm text-gray-600 text-center">
                  点击地图上的村组查看详情
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card title="家庭类型分布">
          {familyTypeData.length > 0 ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={familyTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {familyTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {familyTypeData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <span className="text-sm font-medium ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">暂无数据</div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="人口与户数统计" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={populationData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="人口" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="户数" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card
            title="待办事项"
            subtitle={`${todoItems.filter(t => t.status !== '已完成').length} 项待处理`}
            action={<button onClick={() => navigate('/matters')} className="text-xs text-primary-600 hover:text-primary-700">查看全部</button>}
          >
            <div className="space-y-3">
              {todoItems.length > 0 ? todoItems.slice(0, 4).map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => todo.relatedId && navigate('/matters')}
                >
                  <div className={`mt-0.5 p-1 rounded-full ${
                    todo.priority === '高' ? 'bg-red-100' : todo.priority === '中' ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    {todo.status === '已完成' ? (
                      <CheckCircle2 className={`w-4 h-4 ${todo.priority === '高' ? 'text-red-600' : todo.priority === '中' ? 'text-yellow-600' : 'text-gray-600'}`} />
                    ) : (
                      <Clock className={`w-4 h-4 ${todo.priority === '高' ? 'text-red-600' : todo.priority === '中' ? 'text-yellow-600' : 'text-gray-600'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{todo.title}</p>
                      <Badge variant={todoStatusColors[todo.status] as any}>{todo.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">截止日期: {todo.dueDate}</p>
                  </div>
                  <Badge variant={todoPriorityColors[todo.priority] as any}>{todo.priority}</Badge>
                </div>
              )) : (
                <div className="text-sm text-gray-400 text-center py-6">暂无待办</div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="预警信息"
          subtitle={`${warningItems.filter(w => !w.isHandled).length} 条待处理`}
          action={<button onClick={() => navigate('/notices', { state: { tab: 'abnormal' } })} className="text-xs text-primary-600 hover:text-primary-700">查看全部</button>}
        >
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {warningItems.length > 0 ? warningItems.map((warning) => (
              <div key={warning.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                warning.isHandled ? 'bg-gray-50 border-gray-200' :
                warning.level === '严重' ? 'bg-red-50 border-red-200' :
                warning.level === '警告' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  warning.isHandled ? 'text-gray-400' :
                  warning.level === '严重' ? 'text-red-600' :
                  warning.level === '警告' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${warning.isHandled ? 'text-gray-500' : 'text-gray-900'}`}>
                      {warning.title}
                    </p>
                    <Badge variant={warningLevelColors[warning.level] as any}>{warning.level}</Badge>
                    {warning.isHandled && <Badge variant="success">已处理</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{warning.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{warning.time}</p>
                </div>
              </div>
            )) : (
              <div className="text-sm text-gray-400 text-center py-6">暂无预警</div>
            )}
          </div>
        </Card>

        <Card
          title="近期活动"
          action={<button className="text-xs text-primary-600 hover:text-primary-700">查看全部</button>}
        >
          <div className="space-y-0 max-h-96 overflow-y-auto">
            {recentActivities.length > 0 ? recentActivities.slice(0, 10).map((activity, index) => (
              <div key={activity.id} className="relative pl-8 pb-5 last:pb-0">
                {index < recentActivities.length - 1 && index < 9 && (
                  <div className="absolute left-[11px] top-5 bottom-0 w-0.5 bg-gray-200" />
                )}
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <Badge variant="primary">{activity.type}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time} · {activity.operator}</p>
                </div>
              </div>
            )) : (
              <div className="text-sm text-gray-400 text-center py-6">暂无活动记录</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
