import { useState, useMemo } from 'react'
import { Search, Filter, Download, Plus, User, Home, Landmark, Heart, ChevronRight, X, AlertCircle } from 'lucide-react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Table, { TableColumn } from '../components/Table'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { households, villageGroups } from '../data/mockData'
import type { Household } from '../types'

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
  const [searchText, setSearchText] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [onlyAbnormal, setOnlyAbnormal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null)
  const [detailTab, setDetailTab] = useState<'members' | 'house' | 'land' | 'aid'>('members')
  const pageSize = 10

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
  }, [searchText, selectedGroup, selectedType, onlyAbnormal])

  const paginatedHouseholds = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredHouseholds.slice(start, start + pageSize)
  }, [filteredHouseholds, currentPage])

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
          <button className="btn-primary inline-flex items-center gap-2">
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
        open={!!selectedHousehold}
        onClose={() => setSelectedHousehold(null)}
        title={selectedHousehold ? `${selectedHousehold.householder} 家庭档案` : ''}
        width="max-w-4xl"
      >
        {selectedHousehold && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-primary-50 to-green-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-7 h-7 text-primary-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900">{selectedHousehold.householder}</h3>
                    <Badge variant={familyTypeColors[selectedHousehold.familyType] as any} size="md">
                      {selectedHousehold.familyType}
                    </Badge>
                    {selectedHousehold.isAbnormal && (
                      <Badge variant="danger" size="md">异常</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedHousehold.groupName} · {selectedHousehold.address}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    户号: {selectedHousehold.householdCode} · 电话: {selectedHousehold.phone} · 建档日期: {selectedHousehold.registerDate}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">家庭人口</p>
                <p className="text-3xl font-bold text-primary-600">{selectedHousehold.familyMembers.length}</p>
              </div>
            </div>

            {selectedHousehold.isAbnormal && selectedHousehold.abnormalReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">异常说明</p>
                  <p className="text-sm text-red-700 mt-0.5">{selectedHousehold.abnormalReason}</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedHousehold.familyMembers.map((member) => (
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

            {detailTab === 'house' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">地址</p>
                  <p className="font-medium text-gray-900 mt-1">{selectedHousehold.houseInfo.address}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">建筑面积</p>
                  <p className="font-medium text-gray-900 mt-1">{selectedHousehold.houseInfo.area} 平方米</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">房屋结构</p>
                  <p className="font-medium text-gray-900 mt-1">{selectedHousehold.houseInfo.structure}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">建成年份</p>
                  <p className="font-medium text-gray-900 mt-1">{selectedHousehold.houseInfo.buildYear} 年</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">房屋状况</p>
                  <p className="mt-1">
                    <Badge variant={houseConditionColors[selectedHousehold.houseInfo.condition] as any} size="md">
                      {selectedHousehold.houseInfo.condition}
                    </Badge>
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">产权证</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {selectedHousehold.houseInfo.hasPropertyCert ? '已办理' : '未办理'}
                  </p>
                </div>
              </div>
            )}

            {detailTab === 'land' && (
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
                    {selectedHousehold.farmlands.map((f) => (
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
                    {selectedHousehold.farmlands.reduce((s, f) => s + f.area, 0).toFixed(1)}
                  </span> 亩
                </div>
              </div>
            )}

            {detailTab === 'aid' && (
              selectedHousehold.aidInfos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>暂无帮扶信息</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedHousehold.aidInfos.map((aid) => (
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
      </Modal>
    </div>
  )
}
