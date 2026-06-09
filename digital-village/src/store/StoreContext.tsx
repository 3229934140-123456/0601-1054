import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import {
  households as initialHouseholds,
  matters as initialMatters,
  crops as initialCrops,
  livestocks as initialLivestocks,
  notices as initialNotices,
} from '../data/mockData'
import type {
  Household,
  Matter,
  Crop,
  Livestock,
  Notice,
  MatterProgress,
  FamilyMember,
  Farmland,
  AidInfo,
  NoticeReceipt,
  SupplementDetail,
  MatterSummary,
  TodoItem,
  WarningItem,
  RecentActivity,
} from '../types'

const STORAGE_KEY = 'digital-village-store-v1'

interface StoredData {
  households: Household[]
  matters: Matter[]
  crops: Crop[]
  livestocks: Livestock[]
  notices: Notice[]
}

function loadFromStorage(): StoredData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredData
  } catch {
    return null
  }
}

function saveToStorage(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

interface StoreContextType {
  households: Household[]
  matters: Matter[]
  crops: Crop[]
  livestocks: Livestock[]
  notices: Notice[]

  todoItems: TodoItem[]
  warningItems: WarningItem[]
  recentActivities: RecentActivity[]

  addHousehold: (h: Household) => void
  updateHousehold: (id: string, updates: Partial<Household>) => void
  updateHouseholdMembers: (id: string, members: FamilyMember[]) => void
  updateHouseholdHouse: (id: string, house: Household['houseInfo']) => void
  updateHouseholdFarmlands: (id: string, farmlands: Farmland[]) => void
  updateHouseholdAids: (id: string, aids: AidInfo[]) => void

  addMatter: (m: Matter) => void
  updateMatterStatus: (id: string, status: Matter['status'], remark: string, operator?: string) => void
  updateMatterSupplement: (
    id: string,
    supplement: SupplementDetail,
    remark?: string,
    operator?: string
  ) => void
  completeMatter: (id: string, summary: MatterSummary, remark?: string, operator?: string) => void

  addCrop: (c: Crop) => void
  addLivestock: (l: Livestock) => void

  addNotice: (n: Notice) => void
  updateNoticeReceipt: (noticeId: string, receiptId: string, updates: Partial<NoticeReceipt>) => void

  markTodoDone: (id: string) => void
  markWarningHandled: (id: string) => void
  resetStore: () => void
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const stored = loadFromStorage()
  const [households, setHouseholds] = useState<Household[]>(stored?.households ?? initialHouseholds)
  const [matters, setMatters] = useState<Matter[]>(stored?.matters ?? initialMatters)
  const [crops, setCrops] = useState<Crop[]>(stored?.crops ?? initialCrops)
  const [livestocks, setLivestocks] = useState<Livestock[]>(stored?.livestocks ?? initialLivestocks)
  const [notices, setNotices] = useState<Notice[]>(stored?.notices ?? initialNotices)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])

  useEffect(() => {
    saveToStorage({ households, matters, crops, livestocks, notices })
  }, [households, matters, crops, livestocks, notices])

  const formatNow = () => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  }
  const formatNowWithTime = () => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  }

  const pushActivity = (activity: Omit<RecentActivity, 'id' | 'time'>) => {
    const newAct: RecentActivity = {
      id: `act${Date.now()}`,
      time: formatNowWithTime(),
      ...activity,
    }
    setRecentActivities(prev => [newAct, ...prev].slice(0, 30))
  }

  const addHousehold = (h: Household) => {
    setHouseholds(prev => [h, ...prev])
    pushActivity({
      title: `新增农户档案：${h.householder}`,
      type: '农户档案',
      operator: '管理员',
      description: `户号 ${h.householdCode}，${h.groupName}`,
    })
  }
  const updateHousehold = (id: string, updates: Partial<Household>) => {
    setHouseholds(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h))
    if (updates.isAbnormal || updates.abnormalReason) {
      const h = households.find(x => x.id === id)
      if (h) pushActivity({
        title: `农户异常标记：${h.householder}`,
        type: '预警',
        operator: '系统',
        description: updates.abnormalReason || '异常状态更新',
      })
    }
  }
  const updateHouseholdMembers = (id: string, members: FamilyMember[]) => {
    setHouseholds(prev => prev.map(h => h.id === id ? { ...h, familyMembers: members } : h))
  }
  const updateHouseholdHouse = (id: string, house: Household['houseInfo']) => {
    setHouseholds(prev => prev.map(h => h.id === id ? { ...h, houseInfo: house } : h))
  }
  const updateHouseholdFarmlands = (id: string, farmlands: Farmland[]) => {
    setHouseholds(prev => prev.map(h => h.id === id ? { ...h, farmlands } : h))
  }
  const updateHouseholdAids = (id: string, aids: AidInfo[]) => {
    setHouseholds(prev => prev.map(h => h.id === id ? { ...h, aidInfos: aids } : h))
  }

  const addMatter = (m: Matter) => {
    setMatters(prev => [m, ...prev])
    pushActivity({
      title: `登记事项：${m.type}`,
      type: '事项办理',
      operator: m.handler || '李明',
      description: `申请人 ${m.applicant}，事项编号 ${m.matterNo}`,
    })
  }
  const updateMatterStatus = (id: string, status: Matter['status'], remark: string, operator = '李明') => {
    const newProgress: MatterProgress = {
      id: `p${Date.now()}`,
      status,
      operator,
      remark,
      time: formatNowWithTime(),
    }
    const isOverdue = computeOverdue(matters.find(m => m.id === id)?.expectedDate)
    setMatters(prev => prev.map(m => {
      if (m.id !== id) return m
      return { ...m, status, progress: [...m.progress, newProgress], isOverdue }
    }))
    const matter = matters.find(m => m.id === id)
    if (matter) pushActivity({
      title: `事项${status}：${matter.type}`,
      type: '事项办理',
      operator,
      description: remark || `${matter.applicant} 的申请`,
    })
  }
  const updateMatterSupplement = (
    id: string,
    supplement: SupplementDetail,
    remark = '材料已补充',
    operator = '申请人'
  ) => {
    const newProgress: MatterProgress = {
      id: `p${Date.now()}`,
      status: '审核中',
      operator,
      remark,
      time: formatNowWithTime(),
      supplementDetail: supplement,
    }
    setMatters(prev => prev.map(m =>
      m.id === id ? { ...m, status: '审核中', progress: [...m.progress, newProgress] } : m
    ))
    const matter = matters.find(m => m.id === id)
    if (matter) pushActivity({
      title: `补充材料：${matter.type}`,
      type: '事项办理',
      operator,
      description: `已补充 ${supplement.submittedMaterials.length} 份材料`,
    })
  }
  const completeMatter = (id: string, summary: MatterSummary, remark = '事项已办结', operator = '李明') => {
    const newProgress: MatterProgress = {
      id: `p${Date.now()}`,
      status: '已办结',
      operator,
      remark,
      time: formatNowWithTime(),
    }
    setMatters(prev => prev.map(m =>
      m.id === id ? { ...m, status: '已办结', progress: [...m.progress, newProgress], summary } : m
    ))
    const matter = matters.find(m => m.id === id)
    if (matter) pushActivity({
      title: `事项办结：${matter.type}`,
      type: '事项办理',
      operator,
      description: `${matter.applicant} 的申请已办结`,
    })
  }

  const computeOverdue = (expectedDate?: string) => {
    if (!expectedDate) return false
    return new Date(expectedDate) < new Date(formatNow())
  }

  useEffect(() => {
    const today = formatNow()
    setMatters(prev => prev.map(m => {
      const overdue = m.status !== '已办结' && m.status !== '已驳回' && m.expectedDate && new Date(m.expectedDate) < new Date(today)
      if (!!overdue !== !!m.isOverdue) return { ...m, isOverdue: !!overdue }
      return m
    }))
  }, [])

  const addCrop = (c: Crop) => {
    setCrops(prev => [c, ...prev])
    pushActivity({
      title: `录入种植：${c.name}`,
      type: '产业台账',
      operator: '管理员',
      description: `${c.householdName}，${c.scale}${c.unit}`,
    })
  }
  const addLivestock = (l: Livestock) => {
    setLivestocks(prev => [l, ...prev])
    pushActivity({
      title: `录入养殖：${l.name}`,
      type: '产业台账',
      operator: '管理员',
      description: `${l.householdName}，${l.count}头/只`,
    })
  }

  const addNotice = (n: Notice) => {
    setNotices(prev => [n, ...prev])
    pushActivity({
      title: `发布通知：${n.title}`,
      type: '通知公告',
      operator: n.publisher,
      description: `发送范围：${n.targetGroups.length} 个村组，共 ${n.totalCount} 户`,
    })
  }
  const updateNoticeReceipt = (noticeId: string, receiptId: string, updates: Partial<NoticeReceipt>) => {
    setNotices(prev => prev.map(n => {
      if (n.id !== noticeId) return n
      const newReceipts = n.receipts.map(r => r.id === receiptId ? { ...r, ...updates } : r)
      const readCount = newReceipts.filter(r => r.isRead).length
      return { ...n, receipts: newReceipts, readCount: Math.max(readCount, n.readCount) }
    }))
  }

  const todoItems: TodoItem[] = (() => {
    const todos: TodoItem[] = []
    matters.filter(m => ['待受理', '审核中', '待补充材料'].includes(m.status)).forEach((m, i) => {
      const priorityMap: Record<Matter['status'], '高' | '中' | '低'> = {
        '待受理': '高',
        '审核中': '中',
        '待补充材料': '中',
        '已通过': '低',
        '已驳回': '低',
        '已办结': '低',
      }
      todos.push({
        id: `todo-m-${m.id}`,
        title: `${m.type} - ${m.applicant}`,
        type: '事项办理',
        priority: priorityMap[m.status],
        dueDate: m.expectedDate,
        status: m.status === '待补充材料' ? '进行中' : '待办',
        description: `经办人：${m.handler}`,
        relatedId: m.id,
      })
    })
    notices.filter(n => n.readCount < n.totalCount).forEach((n, i) => {
      todos.push({
        id: `todo-n-${n.id}`,
        title: `通知回执催收 - ${n.title}`,
        type: '数据上报',
        priority: '中',
        dueDate: n.publishDate,
        status: '进行中',
        description: `已读 ${n.readCount}/${n.totalCount}`,
        relatedId: n.id,
      })
    })
    return todos.slice(0, 10)
  })()

  const warningItems: WarningItem[] = (() => {
    const warnings: WarningItem[] = []
    households.filter(h => h.isAbnormal).forEach(h => {
      warnings.push({
        id: `warn-h-${h.id}`,
        title: `农户异常：${h.householder}`,
        type: '人口异常',
        level: '严重',
        description: h.abnormalReason || '存在异常情况，需及时处理',
        time: h.registerDate,
        relatedId: h.id,
        isHandled: false,
      })
    })
    matters.filter(m => m.isOverdue).forEach(m => {
      warnings.push({
        id: `warn-m-${m.id}`,
        title: `事项超期：${m.type}`,
        type: '事项预警',
        level: '警告',
        description: `${m.applicant} 的申请预计 ${m.expectedDate} 办结，现已超期`,
        time: m.expectedDate,
        relatedId: m.id,
        isHandled: false,
      })
    })
    notices.filter(n => n.totalCount - n.readCount > 50).forEach(n => {
      warnings.push({
        id: `warn-n-${n.id}`,
        title: `通知未读过多：${n.title}`,
        type: '事项预警',
        level: '提示',
        description: `尚有 ${n.totalCount - n.readCount} 户未阅读`,
        time: n.publishDate,
        relatedId: n.id,
        isHandled: false,
      })
    })
    return warnings.sort((a, b) => {
      const order = { '严重': 0, '警告': 1, '提示': 2 }
      return order[a.level] - order[b.level]
    })
  })()

  const markTodoDone = (id: string) => {
    // optional: could persist handled state - for now visual only in session
  }
  const markWarningHandled = (id: string) => {
    // optional
  }

  const resetStore = () => {
    setHouseholds(initialHouseholds)
    setMatters(initialMatters)
    setCrops(initialCrops)
    setLivestocks(initialLivestocks)
    setNotices(initialNotices)
    setRecentActivities([])
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  return (
    <StoreContext.Provider value={{
      households, matters, crops, livestocks, notices,
      todoItems, warningItems, recentActivities,
      addHousehold, updateHousehold, updateHouseholdMembers, updateHouseholdHouse, updateHouseholdFarmlands, updateHouseholdAids,
      addMatter, updateMatterStatus, updateMatterSupplement, completeMatter,
      addCrop, addLivestock,
      addNotice, updateNoticeReceipt,
      markTodoDone, markWarningHandled, resetStore,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
