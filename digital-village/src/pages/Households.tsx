import { useState, useMemo } from 'react'
import { Search, Filter, Download, Plus, User, Home, Landmark, Heart, ChevronRight, X, AlertCircle, Pencil, Trash2 } from 'lucide-react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Table, { TableColumn } from '../components/Table'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { useStore } from '../store/StoreContext'
import { villageGroups } from '../data/mockData'
import type { Household, FamilyMember, Farmland, AidInfo, HouseInfo } from '../types'

const familyTypeColors: Record<string, string> = {
  '普通户': 'default',
  '低保户': 'warning',
  '五保户': 'danger',
  '监测户': 'info',
  '脱贫户': 'primary',
}

const houseConditionColors: Record<string, string> = {
  '完好': 'success',
  '一般': 'default',
  '需维修': 'warning',
  '危房': 'danger',
}

const aidStatusColors: Record<string, string> = {
  '有效': 'success',
  '已过期': 'default',
  '待审核': 'warning',
}

export default function Households() {
  const { households, addHousehold, updateHousehold, updateHouseholdMembers, updateHouseholdHouse, updateHouseholdFarmlands, updateHouseholdAids } = useStore()
  const [searchText, setSearchText] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [onlyAbnormal, setOnlyAbnormal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null)
  const [detailTab, setDetailTab] = useState<'members' | 'house' | 'land' | 'aid'>('members')
  const pageSize = 10

  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    householder: '',
    phone: '',
    groupId: '',
    address: '',
    familyType: '普通户' as Household['familyType'],
  })

  const [editingTab, setEditingTab] = useState<'members' | 'house' | 'land' | 'aid' | null>(null)
  const [editMembers, setEditMembers] = useState<FamilyMember[]>([])
  const [editHouse, setEditHouse] = useState<HouseInfo | null>(null)
  const [editFarmlands, setEditFarmlands] = useState<Farmland[]>([])
  const [editAids, setEditAids] = useState<AidInfo[]>([])

  const formatNow = () => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  }

  const liveHousehold = useMemo(() => {
    if (!selectedHousehold) return null
    return households.find(h => h.id === selectedHousehold.id) || selectedHousehold
  }, [selectedHousehold, households])

  const filteredHouseholds = useMemo(() => {
    return households.filter(h => {
      if (searchText && !h.householder.includes(searchText) && !h.householdCode.includes(searchText) && !h.phone.includes(searchText)) {
        return false
      }
      if (selectedGroup && h.groupId !== selectedGroup) return false
      if (selectedType && h.familyType !== selectedType) return false
      if (onlyAbnormal && !h.isAbnormal) return false
      return true
    })
  }, [households, searchText, selectedGroup, selectedType, onlyAbnormal])

  const paginatedHouseholds = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredHouseholds.slice(start, start + pageSize)
  }, [filteredHouseholds, currentPage])

  const resetAddForm = () => {
    setAddForm({
      householder: '',
      phone: '',
      groupId: '',
      address: '',
      familyType: '普通户',
    })
  }

  const handleAddHousehold = () => {
    if (!addForm.householder || !addForm.groupId) {
      alert('请填写必填项（户主、村组）')
      return
    }
    const group = villageGroups.find(g => g.id === addForm.groupId)
    const newHousehold: Household = {
      id: `h${Date.now()}`,
      householdCode: `NH${formatNow().replace(/-/g, '')}${String(households.length + 1).padStart(3, '0')}`,
      groupId: addForm.groupId,
      groupName: group?.name || '',
      householder: addForm.householder,
      phone: addForm.phone,
      address: addForm.address,
      familyType: addForm.familyType,
      familyMembers: [],
      houseInfo: {
        id: `house${Date.now()}`,
        address: addForm.address,
        area: 0,
        structure: '',
        buildYear: new Date().getFullYear(),
        condition: '一般',
        hasPropertyCert: false,
      },
      farmlands: [],
      aidInfos: [],
      registerDate: formatNow(),
      isAbnormal: false,
    }
    addHousehold(newHousehold)
    resetAddForm()
    setShowAddModal(false)
    setCurrentPage(1)
  }

  const startEditMembers = () => {
    if (!liveHousehold) return
    setEditMembers(JSON.parse(JSON.stringify(liveHousehold.familyMembers)))
    setEditingTab('members')
  }

  const addMember = () => {
    setEditMembers([...editMembers, {
      id: `fm${Date.now()}`,
      name: '',
      relation: '本人',
      idCard: '',
      gender: '男',
      age: 0,
      phone: '',
      education: '',
      occupation: '',
      isMarried: false,
      healthStatus: '健康',
    }])
  }

  const updateMember = (idx: number, field: keyof FamilyMember, value: any) => {
    const updated = [...editMembers]
    updated[idx] = { ...updated[idx], [field]: value }
    setEditMembers(updated)
  }

  const removeMember = (idx: number) => {
    setEditMembers(editMembers.filter((_, i) => i !== idx))
  }

  const saveMembers = () => {
    if (!liveHousehold) return
    updateHouseholdMembers(liveHousehold.id, editMembers)
    setEditingTab(null)
  }

  const startEditHouse = () => {
    if (!liveHousehold) return
    setEditHouse(JSON.parse(JSON.stringify(liveHousehold.houseInfo)))
    setEditingTab('house')
  }

  const saveHouse = () => {
    if (!liveHousehold || !editHouse) return
    updateHouseholdHouse(liveHousehold.id, editHouse)
    setEditingTab(null)
  }

  const startEditFarmlands = () => {
    if (!liveHousehold) return
    setEditFarmlands(JSON.parse(JSON.stringify(liveHousehold.farmlands)))
    setEditingTab('land')
  }

  const addFarmland = () => {
    setEditFarmlands([...editFarmlands, {
      id: `fl${Date.now()}`,
      location: '',
      area: 0,
      type: '水田',
      quality: '二等',
      currentCrop: '',
      isContracted: false,
    }])
  }

  const updateFarmland = (idx: number, field: keyof Farmland, value: any) => {
    const updated = [...editFarmlands]
    updated[idx] = { ...updated[idx], [field]: value }
    setEditFarmlands(updated)
  }

  const removeFarmland = (idx: number) => {
    setEditFarmlands(editFarmlands.filter((_, i) => i !== idx))
  }

  const saveFarmlands = () => {
    if (!liveHousehold) return
    updateHouseholdFarmlands(liveHousehold.id, editFarmlands)
    setEditingTab(null)
  }

  const startEditAids = () => {
    if (!liveHousehold) return
    setEditAids(JSON.parse(JSON.stringify(liveHousehold.aidInfos)))
    setEditingTab('aid')
  }

  const addAid = () => {
    setEditAids([...editAids, {
      id: `aid${Date.now()}`,
      type: '低保',
      amount: 0,
      startDate: formatNow(),
      endDate: formatNow(),
      status: '有效',
      description: '',
    }])
  }

  const updateAid = (idx: number, field: keyof AidInfo, value: any) => {
    const updated = [...editAids]
    updated[idx] = { ...updated[idx], [field]: value }
    setEditAids(updated)
  }

  const removeAid = (idx: number) => {
    setEditAids(editAids.filter((_, i) => i !== idx))
  }

  const saveAids = () => {
    if (!liveHousehold) return
    updateHouseholdAids(liveHousehold.id, editAids)
    setEditingTab(null)
  }

  const cancelEdit = () => {
    setEditingTab(null)
    setEditMembers([])
    setEditHouse(null)
    setEditFarmlands([])
    setEditAids([])
  }

  const columns: TableColumn<Household>[] = [
    {
      key: 'householdCode',
      title: '户编号',
      width: '100px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-gray-700">{row.householdCode}</span>
          {row.isAbnormal && <AlertCircle className="w-4 h-4 text-red-500" />}
        </div>
      ),
    },
    {
      key: 'householder',
      title: '户主',
      width: '100px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <span className="font-medium">{row.householder}</span>
        </div>
      ),
    },
    {
      key: 'groupName',
      title: '村组',
      width: '120px',
    },
    {
      key: 'familyType',
      title: '家庭类型',
      width: '100px',
      render: (row) => <Badge variant={familyTypeColors[row.familyType] as any}>{row.familyType}</Badge>,
    },
    {
      key: 'memberCount',
      title: '人口数',
      width: '80px',
      render: (row) => <span className="font-medium">{row.familyMembers.length} 人</span>,
    },
    {
      key: 'landArea',
      title: '耕地(亩)',
      width: '100px',
      render: (row) => <span>{row.farmlands.reduce((sum, f) => sum + f.area, 0).toFixed(1)}</span>,
    },
    {
      key: 'phone',
      title: '联系电话',
      width: '140px',
    },
    {
      key: 'address',
      title: '住址',
    },
    {
      key: 'action',
      title: '操作',
      width: '100px',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setSelectedHousehold(row)
          }}
          className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1"
        >
          查看详情 <ChevronRight className="w-4 h-4" />
        </button>
      ),
    },
  ]

  const handleExport = () => {
    const headers = ['户编号', '户主', '村组', '家庭类型', '人口数', '联系电话', '住址', '是否异常']
    const rows = filteredHouseholds.map(h => [
      h.householdCode,
      h.householder,
      h.groupName,
      h.familyType,
      h.familyMembers.length,
      h.phone,
      h.address,
      h.isAbnormal ? '是' : '否',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `农户名册_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">农户档案</h1>
          <p className="text-gray-500 mt-1">共 {filteredHouseholds.length} 户农户档案</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="btn-outline inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出名册
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新增农户
          </button>
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
                placeholder="户编号、户主姓名、电话..."
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1) }}
                className="input pl-9"
              />
            </div>
          </div>
          <div className="min-w-[160px]">
            <label className="label">村组</label>
            <select
              value={selectedGroup}
              onChange={(e) => { setSelectedGroup(e.target.value); setCurrentPage(1) }}
              className="select"
            >
              <option value="">全部村组</option>
              {villageGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="label">家庭类型</label>
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1) }}
              className="select"
            >
              <option value="">全部类型</option>
              <option value="普通户">普通户</option>
              <option value="低保户">低保户</option>
              <option value="五保户">五保户</option>
              <option value="监测户">监测户</option>
              <option value="脱贫户">脱贫户</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              id="abnormal"
              checked={onlyAbnormal}
              onChange={(e) => { setOnlyAbnormal(e.target.checked); setCurrentPage(1) }}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="abnormal" className="text-sm text-gray-700">仅显示异常数据</label>
          </div>
          <button
            onClick={() => { setSearchText(''); setSelectedGroup(''); setSelectedType(''); setOnlyAbnormal(false); setCurrentPage(1) }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            重置筛选
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-0">
          <Table
            columns={columns}
            data={paginatedHouseholds}
            rowKey={(r) => r.id}
            onRowClick={(row) => setSelectedHousehold(row)}
          />
          <Pagination
            current={currentPage}
            total={filteredHouseholds.length}
            pageSize={pageSize}
            onChange={setCurrentPage}
          />
        </div>
      </Card>

      <Modal
        open={!!liveHousehold}
        onClose={() => { setSelectedHousehold(null); cancelEdit() }}
        title={liveHousehold ? `${liveHousehold.householder} 家庭档案` : ''}
        width="max-w-4xl"
      >
        {liveHousehold && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-primary-50 to-green-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-7 h-7 text-primary-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900">{liveHousehold.householder}</h3>
                    <Badge variant={familyTypeColors[liveHousehold.familyType] as any} size="md">
                      {liveHousehold.familyType}
                    </Badge>
                    {liveHousehold.isAbnormal && (
                      <Badge variant="danger" size="md">异常</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {liveHousehold.groupName} · {liveHousehold.address}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    户号: {liveHousehold.householdCode} · 电话: {liveHousehold.phone} · 建档日期: {liveHousehold.registerDate}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">家庭人口</p>
                <p className="text-3xl font-bold text-primary-600">{liveHousehold.familyMembers.length}</p>
              </div>
            </div>

            {liveHousehold.isAbnormal && liveHousehold.abnormalReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">异常说明</p>
                  <p className="text-sm text-red-700 mt-0.5">{liveHousehold.abnormalReason}</p>
                </div>
              </div>
            )}

            <div className="flex gap-1 border-b border-gray-200">
              {[
                { key: 'members', label: '家庭成员', icon: User },
                { key: 'house', label: '住房信息', icon: Home },
                { key: 'land', label: '耕地信息', icon: Landmark },
                { key: 'aid', label: '帮扶信息', icon: Heart },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setDetailTab(tab.key as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                      detailTab === tab.key
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {detailTab === 'members' && (
              <div>
                <div className="flex justify-end mb-3">
                  {editingTab !== 'members' ? (
                    <button onClick={startEditMembers} className="btn-primary inline-flex items-center gap-2">
                      <Pencil className="w-4 h-4" />
                      编辑
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={cancelEdit} className="btn-outline">取消</button>
                      <button onClick={saveMembers} className="btn-primary">保存</button>
                    </div>
                  )}
                </div>
                {editingTab === 'members' ? (
                  <div className="space-y-4">
                    {editMembers.map((member, idx) => (
                      <div key={member.id} className="border border-gray-200 rounded-lg p-4 relative">
                        <button
                          onClick={() => removeMember(idx)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div>
                            <label className="label">姓名</label>
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => updateMember(idx, 'name', e.target.value)}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">关系</label>
                            <input
                              type="text"
                              value={member.relation}
                              onChange={(e) => updateMember(idx, 'relation', e.target.value)}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">性别</label>
                            <select
                              value={member.gender}
                              onChange={(e) => updateMember(idx, 'gender', e.target.value)}
                              className="select"
                            >
                              <option value="男">男</option>
                              <option value="女">女</option>
                            </select>
                          </div>
                          <div>
                            <label className="label">年龄</label>
                            <input
                              type="number"
                              value={member.age}
                              onChange={(e) => updateMember(idx, 'age', Number(e.target.value))}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">身份证</label>
                            <input
                              type="text"
                              value={member.idCard}
                              onChange={(e) => updateMember(idx, 'idCard', e.target.value)}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">电话</label>
                            <input
                              type="text"
                              value={member.phone}
                              onChange={(e) => updateMember(idx, 'phone', e.target.value)}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">学历</label>
                            <input
                              type="text"
                              value={member.education}
                              onChange={(e) => updateMember(idx, 'education', e.target.value)}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">职业</label>
                            <input
                              type="text"
                              value={member.occupation}
                              onChange={(e) => updateMember(idx, 'occupation', e.target.value)}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">健康状况</label>
                            <input
                              type="text"
                              value={member.healthStatus}
                              onChange={(e) => updateMember(idx, 'healthStatus', e.target.value)}
                              className="input"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addMember} className="btn-secondary w-full inline-flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" />
                      添加成员
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {liveHousehold.familyMembers.map((member) => (
                      <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            member.gender === '男' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                          }`}>
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{member.name}</p>
                              <Badge variant="primary">{member.relation}</Badge>
                            </div>
                            <p className="text-xs text-gray-500">{member.gender} · {member.age}岁</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">身份证:</span>
                            <span className="ml-2 text-gray-700">{member.idCard}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">电话:</span>
                            <span className="ml-2 text-gray-700">{member.phone || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">学历:</span>
                            <span className="ml-2 text-gray-700">{member.education}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">职业:</span>
                            <span className="ml-2 text-gray-700">{member.occupation}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">健康状况:</span>
                            <span className="ml-2 text-gray-700">{member.healthStatus}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {detailTab === 'house' && (
              <div>
                <div className="flex justify-end mb-3">
                  {editingTab !== 'house' ? (
                    <button onClick={startEditHouse} className="btn-primary inline-flex items-center gap-2">
                      <Pencil className="w-4 h-4" />
                      编辑
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={cancelEdit} className="btn-outline">取消</button>
                      <button onClick={saveHouse} className="btn-primary">保存</button>
                    </div>
                  )}
                </div>
                {editingTab === 'house' && editHouse ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="label">地址</label>
                      <input
                        type="text"
                        value={editHouse.address}
                        onChange={(e) => setEditHouse({ ...editHouse, address: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">建筑面积(平方米)</label>
                      <input
                        type="number"
                        value={editHouse.area}
                        onChange={(e) => setEditHouse({ ...editHouse, area: Number(e.target.value) })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">房屋结构</label>
                      <input
                        type="text"
                        value={editHouse.structure}
                        onChange={(e) => setEditHouse({ ...editHouse, structure: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">建成年份</label>
                      <input
                        type="number"
                        value={editHouse.buildYear}
                        onChange={(e) => setEditHouse({ ...editHouse, buildYear: Number(e.target.value) })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">房屋状况</label>
                      <select
                        value={editHouse.condition}
                        onChange={(e) => setEditHouse({ ...editHouse, condition: e.target.value as HouseInfo['condition'] })}
                        className="select"
                      >
                        <option value="完好">完好</option>
                        <option value="一般">一般</option>
                        <option value="需维修">需维修</option>
                        <option value="危房">危房</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">产权证</label>
                      <select
                        value={editHouse.hasPropertyCert ? '是' : '否'}
                        onChange={(e) => setEditHouse({ ...editHouse, hasPropertyCert: e.target.value === '是' })}
                        className="select"
                      >
                        <option value="是">已办理</option>
                        <option value="否">未办理</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">地址</p>
                      <p className="font-medium text-gray-900 mt-1">{liveHousehold.houseInfo.address}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">建筑面积</p>
                      <p className="font-medium text-gray-900 mt-1">{liveHousehold.houseInfo.area} 平方米</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">房屋结构</p>
                      <p className="font-medium text-gray-900 mt-1">{liveHousehold.houseInfo.structure}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">建成年份</p>
                      <p className="font-medium text-gray-900 mt-1">{liveHousehold.houseInfo.buildYear} 年</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">房屋状况</p>
                      <p className="mt-1">
                        <Badge variant={houseConditionColors[liveHousehold.houseInfo.condition] as any} size="md">
                          {liveHousehold.houseInfo.condition}
                        </Badge>
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">产权证</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {liveHousehold.houseInfo.hasPropertyCert ? '已办理' : '未办理'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {detailTab === 'land' && (
              <div>
                <div className="flex justify-end mb-3">
                  {editingTab !== 'land' ? (
                    <button onClick={startEditFarmlands} className="btn-primary inline-flex items-center gap-2">
                      <Pencil className="w-4 h-4" />
                      编辑
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={cancelEdit} className="btn-outline">取消</button>
                      <button onClick={saveFarmlands} className="btn-primary">保存</button>
                    </div>
                  )}
                </div>
                {editingTab === 'land' ? (
                  <div className="space-y-4">
                    {editFarmlands.map((f, idx) => (
                      <div key={f.id} className="border border-gray-200 rounded-lg p-4 relative">
                        <button
                          onClick={() => removeFarmland(idx)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="label">地块位置</label>
                            <input
                              type="text"
                              value={f.location}
                              onChange={(e) => updateFarmland(idx, 'location', e.target.value)}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">面积(亩)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={f.area}
                              onChange={(e) => updateFarmland(idx, 'area', Number(e.target.value))}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">类型</label>
                            <select
                              value={f.type}
                              onChange={(e) => updateFarmland(idx, 'type', e.target.value)}
                              className="select"
                            >
                              <option value="水田">水田</option>
                              <option value="旱地">旱地</option>
                              <option value="林地">林地</option>
                              <option value="园地">园地</option>
                              <option value="其他">其他</option>
                            </select>
                          </div>
                          <div>
                            <label className="label">质量等级</label>
                            <select
                              value={f.quality}
                              onChange={(e) => updateFarmland(idx, 'quality', e.target.value)}
                              className="select"
                            >
                              <option value="一等">一等</option>
                              <option value="二等">二等</option>
                              <option value="三等">三等</option>
                            </select>
                          </div>
                          <div>
                            <label className="label">当前作物</label>
                            <input
                              type="text"
                              value={f.currentCrop}
                              onChange={(e) => updateFarmland(idx, 'currentCrop', e.target.value)}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">承包状态</label>
                            <select
                              value={f.isContracted ? '已确权' : '未确权'}
                              onChange={(e) => updateFarmland(idx, 'isContracted', e.target.value === '已确权')}
                              className="select"
                            >
                              <option value="已确权">已确权</option>
                              <option value="未确权">未确权</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addFarmland} className="btn-secondary w-full inline-flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" />
                      添加耕地
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="table-th">地块位置</th>
                            <th className="table-th">面积(亩)</th>
                            <th className="table-th">类型</th>
                            <th className="table-th">质量等级</th>
                            <th className="table-th">当前作物</th>
                            <th className="table-th">承包状态</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {liveHousehold.farmlands.map((f) => (
                            <tr key={f.id}>
                              <td className="table-td font-medium">{f.location}</td>
                              <td className="table-td">{f.area}</td>
                              <td className="table-td">{f.type}</td>
                              <td className="table-td">
                                <Badge variant={f.quality === '一等' ? 'success' : f.quality === '二等' ? 'default' : 'warning'}>
                                  {f.quality}
                                </Badge>
                              </td>
                              <td className="table-td">{f.currentCrop}</td>
                              <td className="table-td">
                                <Badge variant={f.isContracted ? 'success' : 'default'}>
                                  {f.isContracted ? '已确权' : '未确权'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="bg-gray-50 px-4 py-3 text-sm text-gray-600">
                        合计耕地: <span className="font-semibold text-gray-900">
                          {liveHousehold.farmlands.reduce((s, f) => s + f.area, 0).toFixed(1)}
                        </span> 亩
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {detailTab === 'aid' && (
              <div>
                <div className="flex justify-end mb-3">
                  {editingTab !== 'aid' ? (
                    <button onClick={startEditAids} className="btn-primary inline-flex items-center gap-2">
                      <Pencil className="w-4 h-4" />
                      编辑
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={cancelEdit} className="btn-outline">取消</button>
                      <button onClick={saveAids} className="btn-primary">保存</button>
                    </div>
                  )}
                </div>
                {editingTab === 'aid' ? (
                  <div className="space-y-4">
                    {editAids.map((aid, idx) => (
                      <div key={aid.id} className="border border-gray-200 rounded-lg p-4 relative">
                        <button
                          onClick={() => removeAid(idx)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div>
                            <label className="label">帮扶类型</label>
                            <select
                              value={aid.type}
                              onChange={(e) => updateAid(idx, 'type', e.target.value)}
                              className="select"
                            >
                              <option value="低保">低保</option>
                              <option value="五保">五保</option>
                              <option value="残疾人补贴">残疾人补贴</option>
                              <option value="临时救助">临时救助</option>
                              <option value="产业帮扶">产业帮扶</option>
                              <option value="教育帮扶">教育帮扶</option>
                              <option value="医疗帮扶">医疗帮扶</option>
                            </select>
                          </div>
                          <div>
                            <label className="label">金额(元)</label>
                            <input
                              type="number"
                              value={aid.amount}
                              onChange={(e) => updateAid(idx, 'amount', Number(e.target.value))}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">状态</label>
                            <select
                              value={aid.status}
                              onChange={(e) => updateAid(idx, 'status', e.target.value)}
                              className="select"
                            >
                              <option value="有效">有效</option>
                              <option value="已过期">已过期</option>
                              <option value="待审核">待审核</option>
                            </select>
                          </div>
                          <div>
                            <label className="label">开始日期</label>
                            <input
                              type="date"
                              value={aid.startDate}
                              onChange={(e) => updateAid(idx, 'startDate', e.target.value)}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">结束日期</label>
                            <input
                              type="date"
                              value={aid.endDate}
                              onChange={(e) => updateAid(idx, 'endDate', e.target.value)}
                              className="input"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="label">描述</label>
                            <input
                              type="text"
                              value={aid.description}
                              onChange={(e) => updateAid(idx, 'description', e.target.value)}
                              className="input"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addAid} className="btn-secondary w-full inline-flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" />
                      添加帮扶
                    </button>
                  </div>
                ) : (
                  liveHousehold.aidInfos.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>暂无帮扶信息</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {liveHousehold.aidInfos.map((aid) => (
                        <div key={aid.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{aid.type}</p>
                              <Badge variant={aidStatusColors[aid.status] as any}>{aid.status}</Badge>
                            </div>
                            <p className="text-xl font-bold text-primary-600">¥{aid.amount}</p>
                          </div>
                          <p className="text-sm text-gray-600">{aid.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            有效期: {aid.startDate} 至 {aid.endDate}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); resetAddForm() }}
        title="新增农户"
        footer={
          <>
            <button onClick={() => { setShowAddModal(false); resetAddForm() }} className="btn-outline">取消</button>
            <button onClick={handleAddHousehold} className="btn-primary">保存</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">户主 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={addForm.householder}
                onChange={(e) => setAddForm({ ...addForm, householder: e.target.value })}
                className="input"
                placeholder="请输入户主姓名"
              />
            </div>
            <div>
              <label className="label">联系电话</label>
              <input
                type="text"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                className="input"
                placeholder="请输入联系电话"
              />
            </div>
            <div>
              <label className="label">村组 <span className="text-red-500">*</span></label>
              <select
                value={addForm.groupId}
                onChange={(e) => setAddForm({ ...addForm, groupId: e.target.value })}
                className="select"
              >
                <option value="">请选择村组</option>
                {villageGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">家庭类型</label>
              <select
                value={addForm.familyType}
                onChange={(e) => setAddForm({ ...addForm, familyType: e.target.value as Household['familyType'] })}
                className="select"
              >
                <option value="普通户">普通户</option>
                <option value="低保户">低保户</option>
                <option value="五保户">五保户</option>
                <option value="监测户">监测户</option>
                <option value="脱贫户">脱贫户</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">住址</label>
              <input
                type="text"
                value={addForm.address}
                onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                className="input"
                placeholder="请输入详细住址"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
