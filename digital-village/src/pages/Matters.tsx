import { useState, useMemo } from 'react'
import { Search, Plus, FileText, User, Clock, ChevronRight, ClipboardList, Paperclip, X, AlertCircle, CheckCircle } from 'lucide-react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Table, { TableColumn } from '../components/Table'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import ProgressTimeline from '../components/ProgressTimeline'
import { useStore } from '../store/StoreContext'
import { villageGroups } from '../data/mockData'
import type { Matter, MatterStatus, MatterType, MatterProgress } from '../types'

const matterStatusColors: Record<MatterStatus, string> = {
  '待受理': 'warning',
  '审核中': 'primary',
  '待补充材料': 'warning',
  '已通过': 'success',
  '已驳回': 'danger',
  '已办结': 'success',
}

const matterTypeList: MatterType[] = ['低保申请', '宅基地审批', '证明开具', '土地流转', '医保办理', '养老认证', '矛盾调解']

export default function Matters() {
  const { matters, addMatter, updateMatterStatus, updateMatterSupplement, completeMatter } = useStore()
  const [searchText, setSearchText] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const [showSupplementModal, setShowSupplementModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const pageSize = 10

  const [supplementRequired, setSupplementRequired] = useState('')
  const [supplementSubmitted, setSupplementSubmitted] = useState('')
  const [supplementSubmittedBy, setSupplementSubmittedBy] = useState('申请人')
  const [completeSummary, setCompleteSummary] = useState('')

  const [formType, setFormType] = useState<MatterType | ''>('')
  const [formApplicant, setFormApplicant] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formGroupId, setFormGroupId] = useState('')
  const [formExpectedDate, setFormExpectedDate] = useState('')
  const [formHandler, setFormHandler] = useState('李明')
  const [formDescription, setFormDescription] = useState('')
  const [formMaterials, setFormMaterials] = useState<string[]>([])
  const [materialInput, setMaterialInput] = useState('')

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

  const filteredMatters = useMemo(() => {
    return matters.filter(m => {
      if (searchText && !m.applicant.includes(searchText) && !m.matterNo.includes(searchText) && !m.description.includes(searchText)) {
        return false
      }
      if (selectedType && m.type !== selectedType) return false
      if (selectedStatus && m.status !== selectedStatus) return false
      if (selectedGroup && m.groupId !== selectedGroup) return false
      return true
    })
  }, [matters, searchText, selectedType, selectedStatus, selectedGroup])

  const paginatedMatters = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredMatters.slice(start, start + pageSize)
  }, [filteredMatters, currentPage])

  const stats = useMemo(() => {
    return {
      total: matters.length,
      pending: matters.filter(m => ['待受理', '审核中', '待补充材料'].includes(m.status)).length,
      passed: matters.filter(m => ['已通过', '已办结'].includes(m.status)).length,
      rejected: matters.filter(m => m.status === '已驳回').length,
    }
  }, [matters])

  const getTimelineSteps = (matter: Matter) => {
    return matter.progress.map((p, i) => {
      const isLast = i === matter.progress.length - 1
      return {
        label: p.status,
        time: p.time,
        operator: p.operator,
        remark: p.remark,
        status: isLast ? 'current' as const : 'completed' as const,
      }
    })
  }

  const liveMatter = useMemo(() => {
    if (!selectedMatter) return null
    return matters.find(m => m.id === selectedMatter.id) || selectedMatter
  }, [selectedMatter, matters])

  const latestSupplement = useMemo(() => {
    if (!liveMatter) return null
    for (let i = liveMatter.progress.length - 1; i >= 0; i--) {
      if (liveMatter.progress[i].supplementDetail) {
        return liveMatter.progress[i].supplementDetail
      }
    }
    return null
  }, [liveMatter])

  const handleSubmitRegister = () => {
    if (!formType || !formApplicant || !formGroupId || !formDescription) {
      alert('请填写必填项')
      return
    }
    const group = villageGroups.find(g => g.id === formGroupId)
    const newMatter: Matter = {
      id: `m${Date.now()}`,
      matterNo: `SZ${formatNow().replace(/-/g, '')}${String(matters.length + 1).padStart(3, '0')}`,
      type: formType,
      applicant: formApplicant,
      householdId: '',
      phone: formPhone,
      groupId: formGroupId,
      groupName: group?.name || '',
      submitDate: formatNow(),
      status: '待受理',
      handler: formHandler || '李明',
      expectedDate: formExpectedDate || formatNow(),
      description: formDescription,
      materials: formMaterials,
      progress: [
        {
          id: `p${Date.now()}`,
          status: '待受理',
          operator: '系统',
          remark: '申请已提交，等待受理',
          time: formatNowWithTime(),
        } as MatterProgress,
      ],
    }
    addMatter(newMatter)
    resetForm()
    setShowRegister(false)
    setCurrentPage(1)
  }

  const resetForm = () => {
    setFormType('')
    setFormApplicant('')
    setFormPhone('')
    setFormGroupId('')
    setFormExpectedDate('')
    setFormHandler('李明')
    setFormDescription('')
    setFormMaterials([])
    setMaterialInput('')
  }

  const addMaterial = () => {
    if (materialInput.trim()) {
      setFormMaterials([...formMaterials, materialInput.trim()])
      setMaterialInput('')
    }
  }

  const removeMaterial = (idx: number) => {
    setFormMaterials(formMaterials.filter((_, i) => i !== idx))
  }

  const handleAdvance = () => {
    if (!liveMatter) return
    const nextStatus: Record<string, MatterStatus> = {
      '待受理': '审核中',
      '审核中': '已通过',
      '待补充材料': '审核中',
    }
    const target = nextStatus[liveMatter.status]
    if (target) {
      updateMatterStatus(liveMatter.id, target, `已推进到「${target}」状态`)
    } else if (liveMatter.status === '已通过') {
      updateMatterStatus(liveMatter.id, '已办结', '事项已办结归档')
    }
  }

  const handleSupplement = () => {
    if (!liveMatter) return
    setShowSupplementModal(true)
  }

  const handleSubmitSupplement = () => {
    if (!liveMatter) return
    const requiredMaterials = supplementRequired.split('\n').map(s => s.trim()).filter(Boolean)
    const submittedMaterials = supplementSubmitted.split('\n').map(s => s.trim()).filter(Boolean)
    const isCompleted = requiredMaterials.length > 0 && requiredMaterials.every(req => submittedMaterials.includes(req))
    const supplementDetail = {
      requiredMaterials,
      submittedMaterials,
      submittedBy: supplementSubmittedBy || '申请人',
      submittedAt: formatNowWithTime(),
      isCompleted,
    }
    updateMatterSupplement(liveMatter.id, supplementDetail, isCompleted ? '材料已补充完毕' : '已提交部分补充材料')
    setShowSupplementModal(false)
    resetSupplementForm()
  }

  const resetSupplementForm = () => {
    setSupplementRequired('')
    setSupplementSubmitted('')
    setSupplementSubmittedBy('申请人')
  }

  const handleComplete = () => {
    if (!liveMatter) return
    setShowCompleteModal(true)
  }

  const handleSubmitComplete = () => {
    if (!liveMatter || !completeSummary.trim()) {
      alert('请填写办理摘要')
      return
    }
    const summary = {
      content: completeSummary,
      generatedAt: formatNowWithTime(),
      handler: liveMatter.handler || '李明',
    }
    completeMatter(liveMatter.id, summary)
    setShowCompleteModal(false)
    setCompleteSummary('')
  }

  const handleReject = () => {
    if (!liveMatter) return
    const reason = prompt('请输入驳回原因：')
    if (reason !== null) {
      updateMatterStatus(liveMatter.id, '已驳回', reason || '申请不符合条件，予以驳回')
    }
  }

  const columns: TableColumn<Matter>[] = [
    {
      key: 'matterNo',
      title: '事项编号',
      width: '140px',
      render: (row) => <span className="font-mono text-sm text-gray-700">{row.matterNo}</span>,
    },
    {
      key: 'type',
      title: '事项类型',
      width: '110px',
      render: (row) => <Badge variant="primary" size="md">{row.type}</Badge>,
    },
    {
      key: 'applicant',
      title: '申请人',
      width: '100px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <span className="font-medium">{row.applicant}</span>
        </div>
      ),
    },
    { key: 'groupName', title: '村组', width: '120px' },
    { key: 'submitDate', title: '申请日期', width: '110px' },
    {
      key: 'expectedDate',
      title: '预计办结',
      width: '110px',
      render: (row) => {
        const isOverdue = new Date(row.expectedDate) < new Date() && !['已通过', '已办结', '已驳回'].includes(row.status)
        return (
          <div className="flex items-center gap-1">
            <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>{row.expectedDate}</span>
          </div>
        )
      },
    },
    { key: 'handler', title: '经办人', width: '80px' },
    {
      key: 'status',
      title: '状态',
      width: '140px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Badge variant={matterStatusColors[row.status] as any} size="md">{row.status}</Badge>
          {row.isOverdue && !['已办结', '已驳回'].includes(row.status) && (
            <Badge variant="danger" size="md">
              <AlertCircle className="w-3 h-3 mr-1" />
              超期
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      title: '操作',
      width: '100px',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedMatter(row) }}
          className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1"
        >
          查看 <ChevronRight className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">事项办理</h1>
          <p className="text-gray-500 mt-1">共 {filteredMatters.length} 条办理事项</p>
        </div>
        <button onClick={() => setShowRegister(true)} className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          登记事项
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">全部事项</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 bg-yellow-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">办理中</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">已通过/办结</p>
            <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">已驳回</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="label">搜索</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="事项编号、申请人、内容..."
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1) }}
                className="input pl-9"
              />
            </div>
          </div>
          <div className="min-w-[150px]">
            <label className="label">事项类型</label>
            <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1) }} className="select">
              <option value="">全部类型</option>
              {matterTypeList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="min-w-[130px]">
            <label className="label">办理状态</label>
            <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1) }} className="select">
              <option value="">全部状态</option>
              <option value="待受理">待受理</option>
              <option value="审核中">审核中</option>
              <option value="待补充材料">待补充材料</option>
              <option value="已通过">已通过</option>
              <option value="已驳回">已驳回</option>
              <option value="已办结">已办结</option>
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="label">所属村组</label>
            <select value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setCurrentPage(1) }} className="select">
              <option value="">全部村组</option>
              {villageGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <button
            onClick={() => { setSearchText(''); setSelectedType(''); setSelectedStatus(''); setSelectedGroup(''); setCurrentPage(1) }}
            className="btn-secondary"
          >
            重置
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-0">
          <Table columns={columns as any} data={paginatedMatters as any} rowKey={(r: any) => r.id} onRowClick={(row) => setSelectedMatter(row as Matter)} />
          <Pagination current={currentPage} total={filteredMatters.length} pageSize={pageSize} onChange={setCurrentPage} />
        </div>
      </Card>

      <Modal
        open={!!liveMatter}
        onClose={() => setSelectedMatter(null)}
        title={liveMatter ? `事项详情 - ${liveMatter.matterNo}` : ''}
        width="max-w-3xl"
      >
        {liveMatter && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-5">
              {liveMatter.isOverdue && !['已办结', '已驳回'].includes(liveMatter.status) && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-red-700 font-medium">该事项已超期，预计办结日期：{liveMatter.expectedDate}</span>
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900">{liveMatter.type}</h3>
                    <Badge variant={matterStatusColors[liveMatter.status] as any} size="md">
                      {liveMatter.status}
                    </Badge>
                    {liveMatter.isOverdue && !['已办结', '已驳回'].includes(liveMatter.status) && (
                      <Badge variant="danger" size="md">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        超期
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    申请编号: {liveMatter.matterNo} · 申请日期: {liveMatter.submitDate}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-gray-500">申请人</span><p className="font-medium text-gray-900 mt-0.5">{liveMatter.applicant}</p></div>
                <div><span className="text-gray-500">联系电话</span><p className="font-medium text-gray-900 mt-0.5">{liveMatter.phone}</p></div>
                <div><span className="text-gray-500">所属村组</span><p className="font-medium text-gray-900 mt-0.5">{liveMatter.groupName}</p></div>
                <div><span className="text-gray-500">经办人</span><p className="font-medium text-gray-900 mt-0.5">{liveMatter.handler}</p></div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">申请说明</h4>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-4 text-sm leading-relaxed">{liveMatter.description}</p>
            </div>

            {liveMatter.materials.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">提交材料</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {liveMatter.materials.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {latestSupplement && (
              <div className="space-y-4">
                {latestSupplement.requiredMaterials.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-yellow-600" />
                      需补材料
                    </h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                      {latestSupplement.requiredMaterials.map((m, i) => {
                        const isSubmitted = latestSupplement.submittedMaterials.includes(m)
                        return (
                          <div key={i} className="flex items-center gap-2">
                            {isSubmitted ? (
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                            )}
                            <span className={`text-sm ${isSubmitted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{m}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {latestSupplement.submittedMaterials.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      已补材料
                      {latestSupplement.submittedBy && (
                        <span className="text-xs font-normal text-gray-500 ml-1">（提交人：{latestSupplement.submittedBy} · {latestSupplement.submittedAt}）</span>
                      )}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {latestSupplement.submittedMaterials.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {liveMatter.summary && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-600" />
                  办理摘要
                  <span className="text-xs font-normal text-gray-500 ml-1">（经办人：{liveMatter.summary.handler} · {liveMatter.summary.generatedAt}）</span>
                </h4>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">{liveMatter.summary.content}</p>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">办理进度</h4>
              <ProgressTimeline steps={getTimelineSteps(liveMatter)} />
            </div>

            {['待受理', '审核中', '待补充材料'].includes(liveMatter.status) && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button onClick={handleAdvance} className="btn-primary">推进办理</button>
                <button onClick={handleSupplement} className="btn-outline">补充材料</button>
                <button onClick={handleReject} className="btn-danger">驳回申请</button>
              </div>
            )}
            {liveMatter.status === '已通过' && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button onClick={handleComplete} className="btn-primary">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  办结
                </button>
                <button onClick={handleSupplement} className="btn-outline">补充材料</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={showRegister}
        onClose={() => { setShowRegister(false); resetForm() }}
        title="登记事项"
        footer={
          <>
            <button onClick={() => { setShowRegister(false); resetForm() }} className="btn-outline">取消</button>
            <button onClick={handleSubmitRegister} className="btn-primary">提交登记</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">事项类型 <span className="text-red-500">*</span></label>
              <select value={formType} onChange={(e) => setFormType(e.target.value as MatterType)} className="select">
                <option value="">请选择类型</option>
                {matterTypeList.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">申请人 <span className="text-red-500">*</span></label>
              <input type="text" value={formApplicant} onChange={(e) => setFormApplicant(e.target.value)} className="input" placeholder="请输入申请人姓名" />
            </div>
            <div>
              <label className="label">联系电话</label>
              <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="input" placeholder="请输入联系电话" />
            </div>
            <div>
              <label className="label">所属村组 <span className="text-red-500">*</span></label>
              <select value={formGroupId} onChange={(e) => setFormGroupId(e.target.value)} className="select">
                <option value="">请选择村组</option>
                {villageGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">预计办结日期</label>
              <input type="date" value={formExpectedDate} onChange={(e) => setFormExpectedDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">经办人</label>
              <input type="text" value={formHandler} onChange={(e) => setFormHandler(e.target.value)} className="input" placeholder="请输入经办人姓名" />
            </div>
          </div>
          <div>
            <label className="label">申请说明 <span className="text-red-500">*</span></label>
            <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="input min-h-[100px]" placeholder="请输入事项说明" />
          </div>
          <div>
            <label className="label">材料清单</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={materialInput}
                onChange={(e) => setMaterialInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                className="input flex-1"
                placeholder="输入材料名称后按回车添加"
              />
              <button type="button" onClick={addMaterial} className="btn-secondary">添加</button>
            </div>
            {formMaterials.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formMaterials.map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-1.5 text-sm">
                    {m}
                    <button type="button" onClick={() => removeMaterial(i)} className="text-gray-500 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={showSupplementModal}
        onClose={() => { setShowSupplementModal(false); resetSupplementForm() }}
        title="补充材料"
        footer={
          <>
            <button onClick={() => { setShowSupplementModal(false); resetSupplementForm() }} className="btn-outline">取消</button>
            <button onClick={handleSubmitSupplement} className="btn-primary">提交</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">需要补充的材料</label>
            <textarea
              value={supplementRequired}
              onChange={(e) => setSupplementRequired(e.target.value)}
              className="input min-h-[100px]"
              placeholder="每行一项，如：&#10;身份证复印件&#10;户口本复印件&#10;收入证明"
            />
            <p className="text-xs text-gray-500 mt-1">每行填写一项需要补充的材料</p>
          </div>
          <div>
            <label className="label">已提交的材料</label>
            <textarea
              value={supplementSubmitted}
              onChange={(e) => setSupplementSubmitted(e.target.value)}
              className="input min-h-[100px]"
              placeholder="每行一项，如：&#10;身份证复印件"
            />
            <p className="text-xs text-gray-500 mt-1">每行填写一项已提交的材料</p>
          </div>
          <div>
            <label className="label">提交人</label>
            <input
              type="text"
              value={supplementSubmittedBy}
              onChange={(e) => setSupplementSubmittedBy(e.target.value)}
              className="input"
              placeholder="请输入提交人姓名"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={showCompleteModal}
        onClose={() => { setShowCompleteModal(false); setCompleteSummary('') }}
        title="办结事项"
        footer={
          <>
            <button onClick={() => { setShowCompleteModal(false); setCompleteSummary('') }} className="btn-outline">取消</button>
            <button onClick={handleSubmitComplete} className="btn-primary">确认办结</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">办理摘要 <span className="text-red-500">*</span></label>
            <textarea
              value={completeSummary}
              onChange={(e) => setCompleteSummary(e.target.value)}
              className="input min-h-[150px]"
              placeholder="请填写办理摘要，说明事项办理情况、处理结果等..."
            />
          </div>
          {liveMatter && (
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-lg p-4">
              <div><span className="text-gray-500">事项类型</span><p className="font-medium text-gray-900 mt-0.5">{liveMatter.type}</p></div>
              <div><span className="text-gray-500">申请人</span><p className="font-medium text-gray-900 mt-0.5">{liveMatter.applicant}</p></div>
              <div><span className="text-gray-500">事项编号</span><p className="font-medium text-gray-900 mt-0.5">{liveMatter.matterNo}</p></div>
              <div><span className="text-gray-500">经办人</span><p className="font-medium text-gray-900 mt-0.5">{liveMatter.handler}</p></div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
