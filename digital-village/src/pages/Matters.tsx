import { useState, useMemo } from 'react'
import { Search, Plus, FileText, User, Clock, ChevronRight, ClipboardList, Paperclip } from 'lucide-react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Table, { TableColumn } from '../components/Table'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import ProgressTimeline from '../components/ProgressTimeline'
import { matters, villageGroups } from '../data/mockData'
import type { Matter, MatterStatus, MatterType } from '../types'

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
  const [searchText, setSearchText] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const pageSize = 10

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
  }, [searchText, selectedType, selectedStatus, selectedGroup])

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
  }, [])

  const getTimelineSteps = (matter: Matter) => {
    const statusOrder: MatterStatus[] = ['待受理', '审核中', '待补充材料', '已通过', '已驳回', '已办结']
    const currentIndex = statusOrder.indexOf(matter.status)
    return matter.progress.map((p) => {
      const idx = statusOrder.indexOf(p.status)
      return {
        label: p.status,
        time: p.time,
        operator: p.operator,
        remark: p.remark,
        status: idx < currentIndex ? 'completed' as const : idx === currentIndex ? 'current' as const : 'pending' as const,
      }
    })
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
    {
      key: 'groupName',
      title: '村组',
      width: '120px',
    },
    {
      key: 'submitDate',
      title: '申请日期',
      width: '110px',
    },
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
    {
      key: 'handler',
      title: '经办人',
      width: '80px',
    },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      render: (row) => <Badge variant={matterStatusColors[row.status] as any} size="md">{row.status}</Badge>,
    },
    {
      key: 'action',
      title: '操作',
      width: '100px',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setSelectedMatter(row)
          }}
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
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1) }}
              className="select"
            >
              <option value="">全部类型</option>
              {matterTypeList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="min-w-[130px]">
            <label className="label">办理状态</label>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1) }}
              className="select"
            >
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
            <select
              value={selectedGroup}
              onChange={(e) => { setSelectedGroup(e.target.value); setCurrentPage(1) }}
              className="select"
            >
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
          <Table
            columns={columns}
            data={paginatedMatters}
            rowKey={(r) => r.id}
            onRowClick={(row) => setSelectedMatter(row)}
          />
          <Pagination
            current={currentPage}
            total={filteredMatters.length}
            pageSize={pageSize}
            onChange={setCurrentPage}
          />
        </div>
      </Card>

      <Modal
        open={!!selectedMatter}
        onClose={() => setSelectedMatter(null)}
        title={selectedMatter ? `事项详情 - ${selectedMatter.matterNo}` : ''}
        width="max-w-3xl"
      >
        {selectedMatter && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{selectedMatter.type}</h3>
                    <Badge variant={matterStatusColors[selectedMatter.status] as any} size="md">
                      {selectedMatter.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    申请编号: {selectedMatter.matterNo} · 申请日期: {selectedMatter.submitDate}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">申请人</span>
                  <p className="font-medium text-gray-900 mt-0.5">{selectedMatter.applicant}</p>
                </div>
                <div>
                  <span className="text-gray-500">联系电话</span>
                  <p className="font-medium text-gray-900 mt-0.5">{selectedMatter.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">所属村组</span>
                  <p className="font-medium text-gray-900 mt-0.5">{selectedMatter.groupName}</p>
                </div>
                <div>
                  <span className="text-gray-500">经办人</span>
                  <p className="font-medium text-gray-900 mt-0.5">{selectedMatter.handler}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">申请说明</h4>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-4 text-sm leading-relaxed">
                {selectedMatter.description}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">提交材料</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedMatter.materials.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{m}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">办理进度</h4>
              <ProgressTimeline steps={getTimelineSteps(selectedMatter)} />
            </div>

            {['待受理', '审核中', '待补充材料'].includes(selectedMatter.status) && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="btn-primary">推进办理</button>
                <button className="btn-outline">补充材料</button>
                <button className="btn-danger">驳回申请</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        title="登记事项"
        footer={
          <>
            <button onClick={() => setShowRegister(false)} className="btn-outline">取消</button>
            <button onClick={() => setShowRegister(false)} className="btn-primary">提交登记</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">事项类型 <span className="text-red-500">*</span></label>
              <select className="select">
                <option value="">请选择类型</option>
                {matterTypeList.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">申请人 <span className="text-red-500">*</span></label>
              <input type="text" className="input" placeholder="请输入申请人姓名" />
            </div>
            <div>
              <label className="label">联系电话</label>
              <input type="text" className="input" placeholder="请输入联系电话" />
            </div>
            <div>
              <label className="label">所属村组 <span className="text-red-500">*</span></label>
              <select className="select">
                <option value="">请选择村组</option>
                {villageGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">预计办结日期</label>
              <input type="date" className="input" />
            </div>
            <div>
              <label className="label">经办人</label>
              <input type="text" className="input" placeholder="请输入经办人姓名" />
            </div>
          </div>
          <div>
            <label className="label">申请说明 <span className="text-red-500">*</span></label>
            <textarea className="input min-h-[100px]" placeholder="请输入事项说明" />
          </div>
          <div>
            <label className="label">上传材料</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer">
              <Paperclip className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">点击或拖拽文件到此处上传</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
