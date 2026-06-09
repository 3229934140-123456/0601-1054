import { useState, useMemo } from 'react'
import { Search, Plus, Download, Bell, Eye, CheckCircle2, AlertTriangle, Send, FileText, Filter } from 'lucide-react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Table, { TableColumn } from '../components/Table'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { useStore } from '../store/StoreContext'
import { villageGroups } from '../data/mockData'
import type { Notice, NoticeReceipt } from '../types'

const noticeTypeColors: Record<string, string> = {
  '通知公告': 'primary',
  '政策宣传': 'info',
  '会议通知': 'default',
  '应急通知': 'danger',
}

type TabType = 'notices' | 'receipts' | 'abnormal'

export default function Notices() {
  const { notices, households, addNotice } = useStore()
  const [activeTab, setActiveTab] = useState<TabType>('notices')
  const [searchText, setSearchText] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [onlyImportant, setOnlyImportant] = useState(false)
  const [abnormalTypeFilter, setAbnormalTypeFilter] = useState('')
  const [abnormalLevelFilter, setAbnormalLevelFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [showPublish, setShowPublish] = useState(false)
  const pageSize = 6

  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formTargetGroups, setFormTargetGroups] = useState<string[]>([])
  const [formIsImportant, setFormIsImportant] = useState(false)
  const [formPublisher, setFormPublisher] = useState('村委会')

  const formatNow = () => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  }

  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      if (searchText && !n.title.includes(searchText) && !n.content.includes(searchText)) return false
      if (selectedType && n.type !== selectedType) return false
      if (onlyImportant && !n.isImportant) return false
      return true
    })
  }, [notices, searchText, selectedType, onlyImportant])

  const allReceipts = useMemo(() => {
    const receipts: (NoticeReceipt & { noticeTitle: string; noticeType: string; publishDate: string })[] = []
    notices.forEach(n => {
      n.receipts.forEach(r => {
        receipts.push({ ...r, noticeTitle: n.title, noticeType: n.type, publishDate: n.publishDate })
      })
    })
    return receipts
  }, [notices])

  const filteredReceipts = useMemo(() => {
    return allReceipts.filter(r => {
      if (searchText && !r.householdName.includes(searchText) && !r.noticeTitle.includes(searchText)) return false
      if (selectedType) {
        const notice = notices.find(n => n.id === r.noticeId)
        if (notice?.type !== selectedType) return false
      }
      return true
    })
  }, [allReceipts, notices, searchText, selectedType])

  const abnormalData = useMemo(() => {
    const result: { type: string; name: string; reason: string; relatedId: string; level: '严重' | '警告' | '提示' }[] = []
    households.filter(h => h.isAbnormal).forEach(h => {
      result.push({ type: '农户异常', name: h.householder, reason: h.abnormalReason || '', relatedId: h.id, level: '严重' })
    })
    notices.forEach(n => {
      const unread = n.totalCount - n.readCount
      if (unread > 50) {
        result.push({ type: '通知未读', name: n.title, reason: `尚有${unread}户未阅读`, relatedId: n.id, level: '警告' })
      }
    })
    return result
  }, [households, notices])

  const filteredAbnormalData = useMemo(() => {
    return abnormalData.filter(item => {
      if (searchText && !item.name.includes(searchText) && !item.reason.includes(searchText) && !item.type.includes(searchText)) {
        return false
      }
      if (abnormalTypeFilter && item.type !== abnormalTypeFilter) return false
      if (abnormalLevelFilter && item.level !== abnormalLevelFilter) return false
      return true
    })
  }, [abnormalData, searchText, abnormalTypeFilter, abnormalLevelFilter])

  const paginatedNotices = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredNotices.slice(start, start + pageSize)
  }, [filteredNotices, currentPage])

  const paginatedReceipts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredReceipts.slice(start, start + pageSize)
  }, [filteredReceipts, currentPage])

  const stats = useMemo(() => {
    const totalReceipts = allReceipts.length
    const confirmedReceipts = allReceipts.filter(r => r.confirmed).length
    return {
      totalNotices: notices.length,
      importantNotices: notices.filter(n => n.isImportant).length,
      totalReceipts,
      confirmedReceipts,
      receiptRate: totalReceipts > 0 ? ((confirmedReceipts / totalReceipts) * 100).toFixed(1) : '0',
    }
  }, [notices, allReceipts])

  const liveNotice = useMemo(() => {
    if (!selectedNotice) return null
    return notices.find(n => n.id === selectedNotice.id) || selectedNotice
  }, [selectedNotice, notices])

  const noticeColumns: TableColumn<Notice>[] = [
    {
      key: 'title',
      title: '标题',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{row.title}</p>
            {row.isImportant && <Badge variant="danger">重要</Badge>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{row.content}</p>
        </div>
      ),
    },
    {
      key: 'type',
      title: '类型',
      width: '100px',
      render: (row) => <Badge variant={noticeTypeColors[row.type] as any} size="md">{row.type}</Badge>,
    },
    { key: 'publisher', title: '发布人', width: '100px' },
    { key: 'publishDate', title: '发布日期', width: '110px' },
    {
      key: 'readCount',
      title: '阅读/回执',
      width: '120px',
      render: (row) => {
        const rate = ((row.readCount / row.totalCount) * 100).toFixed(0)
        const confirmed = row.receipts.filter(r => r.confirmed).length
        return (
          <div>
            <div className="flex items-center gap-1 text-sm">
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              <span>{row.readCount}/{row.totalCount} ({rate}%)</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              已回执 {confirmed} 户
            </div>
          </div>
        )
      },
    },
    {
      key: 'action',
      title: '操作',
      width: '100px',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedNotice(row) }}
          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          查看详情
        </button>
      ),
    },
  ]

  const receiptColumns: TableColumn<any>[] = [
    {
      key: 'noticeTitle',
      title: '通知标题',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.noticeTitle}</p>
          <p className="text-xs text-gray-500 mt-0.5">{row.publishDate}</p>
        </div>
      ),
    },
    { key: 'householdName', title: '农户', width: '100px', render: (r) => <span className="font-medium">{r.householdName}</span> },
    {
      key: 'isRead',
      title: '阅读状态',
      width: '100px',
      render: (row) => row.isRead
        ? <Badge variant="success"><Eye className="w-3 h-3 mr-1" />已阅读</Badge>
        : <Badge variant="warning">未阅读</Badge>,
    },
    { key: 'readDate', title: '阅读时间', width: '140px', render: (r) => r.readDate || '-' },
    {
      key: 'confirmed',
      title: '回执状态',
      width: '100px',
      render: (row) => row.confirmed
        ? <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" />已确认</Badge>
        : <Badge variant="default">未确认</Badge>,
    },
    { key: 'confirmDate', title: '确认时间', width: '140px', render: (r) => r.confirmDate || '-' },
  ]

  const abnormalColumns: TableColumn<any>[] = [
    {
      key: 'type',
      title: '异常类型',
      width: '120px',
      render: (row) => <Badge variant={row.level === '严重' ? 'danger' : row.level === '警告' ? 'warning' : 'info'} size="md">{row.type}</Badge>,
    },
    { key: 'name', title: '对象名称', width: '200px', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'reason', title: '异常原因' },
    {
      key: 'level',
      title: '级别',
      width: '80px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <AlertTriangle className={`w-4 h-4 ${row.level === '严重' ? 'text-red-500' : row.level === '警告' ? 'text-yellow-500' : 'text-blue-500'}`} />
          <span className={row.level === '严重' ? 'text-red-600 font-medium' : row.level === '警告' ? 'text-yellow-600 font-medium' : 'text-blue-600'}>{row.level}</span>
        </div>
      ),
    },
  ]

  const handleExportRoster = () => {
    const headers = ['通知标题', '农户姓名', '是否阅读', '阅读时间', '是否确认回执', '确认时间']
    const rows = filteredReceipts.map(r => [r.noticeTitle, r.householdName, r.isRead ? '是' : '否', r.readDate || '', r.confirmed ? '是' : '否', r.confirmDate || ''])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `通知阅读回执名册_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportStats = () => {
    const headers = ['指标', '数量']
    const rows = [
      ['通知总数', stats.totalNotices],
      ['重要通知', stats.importantNotices],
      ['总回执数', stats.totalReceipts],
      ['已确认回执', stats.confirmedReceipts],
      ['回执率', stats.receiptRate + '%'],
      ['异常数据数', abnormalData.length],
    ]
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `通知统计表_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportAbnormal = () => {
    const headers = ['异常类型', '对象名称', '异常原因', '级别']
    const rows = filteredAbnormalData.map(r => [r.type, r.name, r.reason, r.level])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `异常数据清单_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetForm = () => {
    setFormTitle('')
    setFormType('')
    setFormContent('')
    setFormTargetGroups([])
    setFormIsImportant(false)
    setFormPublisher('村委会')
  }

  const handleSubmitPublish = () => {
    if (!formTitle || !formType || !formContent) {
      alert('请填写必填项')
      return
    }
    if (formTargetGroups.length === 0) {
      alert('请选择发送范围')
      return
    }

    const targetHouseholds = households.filter(h => formTargetGroups.includes(h.groupId))
    const newNoticeId = `n${Date.now()}`
    const receipts: NoticeReceipt[] = targetHouseholds.map((h, i) => ({
      id: `r${Date.now()}${i}`,
      noticeId: newNoticeId,
      householdId: h.id,
      householdName: h.householder,
      isRead: false,
      confirmed: false,
    }))

    const newNotice: Notice = {
      id: newNoticeId,
      title: formTitle,
      content: formContent,
      type: formType as any,
      publishDate: formatNow(),
      publisher: formPublisher || '村委会',
      targetGroups: formTargetGroups,
      attachments: [],
      isImportant: formIsImportant,
      readCount: 0,
      totalCount: receipts.length,
      receipts,
    }

    addNotice(newNotice)
    resetForm()
    setShowPublish(false)
    setCurrentPage(1)
  }

  const toggleTargetGroup = (groupId: string) => {
    if (formTargetGroups.includes(groupId)) {
      setFormTargetGroups(formTargetGroups.filter(g => g !== groupId))
    } else {
      setFormTargetGroups([...formTargetGroups, groupId])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">通知统计</h1>
          <p className="text-gray-500 mt-1">村务通知发布、阅读回执与数据统计</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'receipts' && (
            <button onClick={handleExportRoster} className="btn-outline inline-flex items-center gap-2">
              <Download className="w-4 h-4" />
              导出回执名册
            </button>
          )}
          {activeTab === 'abnormal' && (
            <button onClick={handleExportAbnormal} className="btn-outline inline-flex items-center gap-2">
              <Download className="w-4 h-4" />
              导出异常清单
            </button>
          )}
          <button onClick={handleExportStats} className="btn-outline inline-flex items-center gap-2">
            <FileText className="w-4 h-4" />
            统计表
          </button>
          {activeTab === 'notices' && (
            <button onClick={() => setShowPublish(true)} className="btn-primary inline-flex items-center gap-2">
              <Send className="w-4 h-4" />
              发布通知
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">通知总数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalNotices}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">重要通知</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.importantNotices}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已确认回执</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.confirmedReceipts}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">回执率</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{stats.receiptRate}%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 border-b border-gray-200 -mb-4">
            {[
              { key: 'notices', label: '通知公告', icon: Bell },
              { key: 'receipts', label: '阅读回执', icon: CheckCircle2 },
              { key: 'abnormal', label: '异常数据', icon: AlertTriangle },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key as TabType); setCurrentPage(1) }}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.key === 'abnormal' && abnormalData.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{abnormalData.length}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <label className="label">搜索</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'notices' ? '通知标题、内容...' : activeTab === 'receipts' ? '通知标题、农户姓名...' : '搜索异常...'}
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1) }}
                className="input pl-9"
              />
            </div>
          </div>
          {activeTab !== 'abnormal' && (
            <div className="min-w-[140px]">
              <label className="label">类型</label>
              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1) }}
                className="select"
              >
                <option value="">全部类型</option>
                <option value="通知公告">通知公告</option>
                <option value="政策宣传">政策宣传</option>
                <option value="会议通知">会议通知</option>
                <option value="应急通知">应急通知</option>
              </select>
            </div>
          )}
          {activeTab === 'abnormal' && (
            <>
              <div className="min-w-[140px]">
                <label className="label">异常类型</label>
                <select
                  value={abnormalTypeFilter}
                  onChange={(e) => { setAbnormalTypeFilter(e.target.value); setCurrentPage(1) }}
                  className="select"
                >
                  <option value="">全部类型</option>
                  <option value="农户异常">农户异常</option>
                  <option value="通知未读">通知未读</option>
                </select>
              </div>
              <div className="min-w-[130px]">
                <label className="label">异常级别</label>
                <select
                  value={abnormalLevelFilter}
                  onChange={(e) => { setAbnormalLevelFilter(e.target.value); setCurrentPage(1) }}
                  className="select"
                >
                  <option value="">全部级别</option>
                  <option value="严重">严重</option>
                  <option value="警告">警告</option>
                  <option value="提示">提示</option>
                </select>
              </div>
            </>
          )}
          {activeTab === 'notices' && (
            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="important"
                checked={onlyImportant}
                onChange={(e) => { setOnlyImportant(e.target.checked); setCurrentPage(1) }}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <label htmlFor="important" className="text-sm text-gray-700">仅显示重要通知</label>
            </div>
          )}
          <button
            onClick={() => {
              setSearchText(''); setSelectedType(''); setOnlyImportant(false);
              setAbnormalTypeFilter(''); setAbnormalLevelFilter(''); setCurrentPage(1);
            }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            重置
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          {activeTab === 'notices' && (
            <>
              <Table
                columns={noticeColumns}
                data={paginatedNotices}
                rowKey={(r) => r.id}
                onRowClick={(row) => setSelectedNotice(row)}
              />
              <Pagination current={currentPage} total={filteredNotices.length} pageSize={pageSize} onChange={setCurrentPage} />
            </>
          )}
          {activeTab === 'receipts' && (
            <>
              <Table columns={receiptColumns} data={paginatedReceipts} rowKey={(r) => r.id} />
              <Pagination current={currentPage} total={filteredReceipts.length} pageSize={pageSize} onChange={setCurrentPage} />
            </>
          )}
          {activeTab === 'abnormal' && (
            <>
              <Table columns={abnormalColumns} data={filteredAbnormalData} rowKey={(r) => r.relatedId + r.type} />
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
                共 <span className="font-medium">{filteredAbnormalData.length}</span> 条异常数据
              </div>
            </>
          )}
        </div>
      </Card>

      <Modal
        open={!!liveNotice}
        onClose={() => setSelectedNotice(null)}
        title={liveNotice?.title || ''}
        width="max-w-3xl"
      >
        {liveNotice && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={noticeTypeColors[liveNotice.type] as any} size="md">{liveNotice.type}</Badge>
              {liveNotice.isImportant && <Badge variant="danger" size="md">重要</Badge>}
              <span className="text-sm text-gray-500">发布人: {liveNotice.publisher}</span>
              <span className="text-sm text-gray-500">发布时间: {liveNotice.publishDate}</span>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">发送范围</h4>
              <div className="flex flex-wrap gap-2">
                {liveNotice.targetGroups.map(gid => {
                  const g = villageGroups.find(v => v.id === gid)
                  return g ? <Badge key={gid} variant="info">{g.name}</Badge> : null
                })}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{liveNotice.content}</p>
            </div>

            {liveNotice.attachments.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">附件</h4>
                <div className="flex flex-wrap gap-2">
                  {liveNotice.attachments.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-lg px-3 py-2 text-sm">
                      <FileText className="w-4 h-4" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">阅读回执情况</h4>
                <div className="text-sm text-gray-500">
                  已阅读 {liveNotice.readCount}/{liveNotice.totalCount} 户 ·
                  已确认 {liveNotice.receipts.filter(r => r.confirmed).length}/{liveNotice.receipts.length} 户
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${(liveNotice.readCount / liveNotice.totalCount) * 100}%` }}
                />
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="table-th">农户姓名</th>
                      <th className="table-th">阅读状态</th>
                      <th className="table-th">阅读时间</th>
                      <th className="table-th">回执状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {liveNotice.receipts.map(r => (
                      <tr key={r.id}>
                        <td className="table-td font-medium">{r.householdName}</td>
                        <td className="table-td">
                          {r.isRead ? <Badge variant="success">已阅读</Badge> : <Badge variant="warning">未阅读</Badge>}
                        </td>
                        <td className="table-td text-gray-600">{r.readDate || '-'}</td>
                        <td className="table-td">
                          {r.confirmed ? <Badge variant="success">已确认</Badge> : <Badge variant="default">未确认</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showPublish}
        onClose={() => { setShowPublish(false); resetForm() }}
        title="发布通知"
        width="max-w-2xl"
        footer={
          <>
            <button onClick={() => { setShowPublish(false); resetForm() }} className="btn-outline">取消</button>
            <button onClick={handleSubmitPublish} className="btn-primary inline-flex items-center gap-2">
              <Send className="w-4 h-4" />
              发布
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">通知标题 <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input"
                placeholder="请输入通知标题"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="label">通知类型 <span className="text-red-500">*</span></label>
              <select
                className="select"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              >
                <option value="">请选择类型</option>
                <option>通知公告</option>
                <option>政策宣传</option>
                <option>会议通知</option>
                <option>应急通知</option>
              </select>
            </div>
            <div>
              <label className="label">发布人</label>
              <input
                type="text"
                className="input"
                placeholder="村委会"
                value={formPublisher}
                onChange={(e) => setFormPublisher(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="label">发送范围 <span className="text-red-500">*</span></label>
              <div className={`flex flex-wrap gap-2 rounded-lg p-2 ${formTargetGroups.length === 0 ? 'border-2 border-red-300 bg-red-50' : ''}`}>
                {villageGroups.map(g => (
                  <label
                    key={g.id}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                      formTargetGroups.includes(g.id)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formTargetGroups.includes(g.id)}
                      onChange={() => toggleTargetGroup(g.id)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    {g.name}
                  </label>
                ))}
              </div>
              {formTargetGroups.length === 0 && (
                <p className="text-xs text-red-500 mt-1">请选择至少一个发送范围</p>
              )}
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="importantNotice"
                checked={formIsImportant}
                onChange={(e) => setFormIsImportant(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded"
              />
              <label htmlFor="importantNotice" className="text-sm text-gray-700">标为重要通知</label>
            </div>
            <div className="col-span-2">
              <label className="label">通知内容 <span className="text-red-500">*</span></label>
              <textarea
                className="input min-h-[160px]"
                placeholder="请输入通知详细内容..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="label">上传附件</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer">
                <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">点击或拖拽文件到此处上传</p>
                <p className="text-xs text-gray-400 mt-1">支持 PDF、Word、Excel 等格式</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
