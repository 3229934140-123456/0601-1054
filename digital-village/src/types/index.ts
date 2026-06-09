export interface VillageGroup {
  id: string
  name: string
  population: number
  households: number
  landArea: number
}

export interface FamilyMember {
  id: string
  name: string
  relation: string
  idCard: string
  gender: '男' | '女'
  age: number
  phone: string
  education: string
  occupation: string
  isMarried: boolean
  healthStatus: string
}

export interface HouseInfo {
  id: string
  address: string
  area: number
  structure: string
  buildYear: number
  condition: '完好' | '一般' | '需维修' | '危房'
  hasPropertyCert: boolean
}

export interface Farmland {
  id: string
  location: string
  area: number
  type: '水田' | '旱地' | '林地' | '园地' | '其他'
  quality: '一等' | '二等' | '三等'
  currentCrop: string
  isContracted: boolean
}

export interface AidInfo {
  id: string
  type: '低保' | '五保' | '残疾人补贴' | '临时救助' | '产业帮扶' | '教育帮扶' | '医疗帮扶'
  amount: number
  startDate: string
  endDate: string
  status: '有效' | '已过期' | '待审核'
  description: string
}

export interface Household {
  id: string
  householdCode: string
  groupId: string
  groupName: string
  householder: string
  phone: string
  address: string
  familyType: '普通户' | '低保户' | '五保户' | '监测户' | '脱贫户'
  familyMembers: FamilyMember[]
  houseInfo: HouseInfo
  farmlands: Farmland[]
  aidInfos: AidInfo[]
  registerDate: string
  isAbnormal: boolean
  abnormalReason?: string
}

export type MatterType = '低保申请' | '宅基地审批' | '证明开具' | '土地流转' | '医保办理' | '养老认证' | '矛盾调解'

export type MatterStatus = '待受理' | '审核中' | '待补充材料' | '已通过' | '已驳回' | '已办结'

export interface MatterProgress {
  id: string
  status: MatterStatus
  operator: string
  remark: string
  time: string
  supplementDetail?: SupplementDetail
}

export interface SupplementDetail {
  requiredMaterials: string[]
  submittedMaterials: string[]
  submittedBy: string
  submittedAt: string
  isCompleted: boolean
}

export interface MatterSummary {
  content: string
  generatedAt: string
  handler: string
}

export interface Matter {
  id: string
  matterNo: string
  type: MatterType
  applicant: string
  householdId: string
  phone: string
  groupId: string
  groupName: string
  submitDate: string
  status: MatterStatus
  progress: MatterProgress[]
  materials: string[]
  description: string
  handler: string
  expectedDate: string
  isOverdue?: boolean
  summary?: MatterSummary
}

export type IndustryCategory = '种植' | '养殖' | '加工' | '服务'

export interface Crop {
  id: string
  name: string
  category: IndustryCategory
  variety: string
  scale: number
  unit: string
  plantDate: string
  harvestDate: string
  marketDate: string
  expectedYield: number
  actualYield?: number
  price: number
  status: '种植中' | '生长中' | '待收获' | '已收获' | '已上市'
  householdId: string
  householdName: string
  groupId: string
}

export interface Livestock {
  id: string
  name: string
  category: IndustryCategory
  species: string
  count: number
  breedDate: string
  marketDate: string
  expectedWeight: number
  price: number
  status: '养殖中' | '待出栏' | '已出栏' | '已上市'
  householdId: string
  householdName: string
  groupId: string
}

export type IndustryRecord = Crop | Livestock

export interface Notice {
  id: string
  title: string
  content: string
  type: '通知公告' | '政策宣传' | '会议通知' | '应急通知'
  publishDate: string
  publisher: string
  targetGroups: string[]
  attachments: string[]
  isImportant: boolean
  readCount: number
  totalCount: number
  receipts: NoticeReceipt[]
}

export interface NoticeReceipt {
  id: string
  noticeId: string
  householdId: string
  householdName: string
  isRead: boolean
  readDate?: string
  confirmed: boolean
  confirmDate?: string
}

export interface TodoItem {
  id: string
  title: string
  type: '事项办理' | '信息更新' | '会议安排' | '走访任务' | '数据上报'
  priority: '高' | '中' | '低'
  dueDate: string
  status: '待办' | '进行中' | '已完成'
  description: string
  relatedId?: string
}

export interface WarningItem {
  id: string
  title: string
  type: '人口异常' | '土地异常' | '帮扶异常' | '产业异常' | '事项预警'
  level: '严重' | '警告' | '提示'
  description: string
  time: string
  relatedId?: string
  isHandled: boolean
}

export interface RecentActivity {
  id: string
  title: string
  type: string
  operator: string
  time: string
  description: string
}

export interface Statistics {
  totalPopulation: number
  totalHouseholds: number
  totalLand: number
  totalMatters: number
  pendingMatters: number
  totalIndustries: number
  totalNotices: number
  unreadNotices: number
  lowIncomeHouseholds: number
  fiveGuaranteeHouseholds: number
  monitoredHouseholds: number
  povertyAlleviationHouseholds: number
}
