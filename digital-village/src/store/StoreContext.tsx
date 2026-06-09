import { createContext, useContext, useState, type ReactNode } from 'react'
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
} from '../types'

interface StoreContextType {
  households: Household[]
  matters: Matter[]
  crops: Crop[]
  livestocks: Livestock[]
  notices: Notice[]

  addHousehold: (h: Household) => void
  updateHousehold: (id: string, updates: Partial<Household>) => void
  updateHouseholdMembers: (id: string, members: FamilyMember[]) => void
  updateHouseholdHouse: (id: string, house: Household['houseInfo']) => void
  updateHouseholdFarmlands: (id: string, farmlands: Farmland[]) => void
  updateHouseholdAids: (id: string, aids: AidInfo[]) => void

  addMatter: (m: Matter) => void
  updateMatterStatus: (id: string, status: Matter['status'], remark: string, operator?: string) => void

  addCrop: (c: Crop) => void
  addLivestock: (l: Livestock) => void

  addNotice: (n: Notice) => void
  updateNoticeReceipt: (noticeId: string, receiptId: string, updates: Partial<NoticeReceipt>) => void
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [households, setHouseholds] = useState<Household[]>(initialHouseholds)
  const [matters, setMatters] = useState<Matter[]>(initialMatters)
  const [crops, setCrops] = useState<Crop[]>(initialCrops)
  const [livestocks, setLivestocks] = useState<Livestock[]>(initialLivestocks)
  const [notices, setNotices] = useState<Notice[]>(initialNotices)

  const formatNow = () => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  }

  const addHousehold = (h: Household) => setHouseholds(prev => [h, ...prev])
  const updateHousehold = (id: string, updates: Partial<Household>) =>
    setHouseholds(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h))
  const updateHouseholdMembers = (id: string, members: FamilyMember[]) =>
    setHouseholds(prev => prev.map(h => h.id === id ? { ...h, familyMembers: members } : h))
  const updateHouseholdHouse = (id: string, house: Household['houseInfo']) =>
    setHouseholds(prev => prev.map(h => h.id === id ? { ...h, houseInfo: house } : h))
  const updateHouseholdFarmlands = (id: string, farmlands: Farmland[]) =>
    setHouseholds(prev => prev.map(h => h.id === id ? { ...h, farmlands } : h))
  const updateHouseholdAids = (id: string, aids: AidInfo[]) =>
    setHouseholds(prev => prev.map(h => h.id === id ? { ...h, aidInfos: aids } : h))

  const addMatter = (m: Matter) => setMatters(prev => [m, ...prev])
  const updateMatterStatus = (id: string, status: Matter['status'], remark: string, operator = '李明') => {
    const newProgress: MatterProgress = {
      id: `p${Date.now()}`,
      status,
      operator,
      remark,
      time: formatNow(),
    }
    setMatters(prev => prev.map(m =>
      m.id === id ? { ...m, status, progress: [...m.progress, newProgress] } : m
    ))
  }

  const addCrop = (c: Crop) => setCrops(prev => [c, ...prev])
  const addLivestock = (l: Livestock) => setLivestocks(prev => [l, ...prev])

  const addNotice = (n: Notice) => setNotices(prev => [n, ...prev])
  const updateNoticeReceipt = (noticeId: string, receiptId: string, updates: Partial<NoticeReceipt>) => {
    setNotices(prev => prev.map(n => {
      if (n.id !== noticeId) return n
      const newReceipts = n.receipts.map(r => r.id === receiptId ? { ...r, ...updates } : r)
      const readCount = newReceipts.filter(r => r.isRead).length
      return { ...n, receipts: newReceipts, readCount: Math.max(readCount, n.readCount) }
    }))
  }

  return (
    <StoreContext.Provider value={{
      households, matters, crops, livestocks, notices,
      addHousehold, updateHousehold, updateHouseholdMembers, updateHouseholdHouse, updateHouseholdFarmlands, updateHouseholdAids,
      addMatter, updateMatterStatus,
      addCrop, addLivestock,
      addNotice, updateNoticeReceipt,
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
