import { useState, useMemo } from 'react'
import { Search, Plus, Sprout, Beef, Download, TrendingUp, Calendar, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Table, { TableColumn } from '../components/Table'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { useStore } from '../store/StoreContext'
import { villageGroups } from '../data/mockData'
import type { Crop, Livestock } from '../types'

const cropStatusColors: Record<string, string> = {
  '种植中': 'primary',
  '生长中': 'info',
  '待收获': 'warning',
  '已收获': 'default',
  '已上市': 'success',
}

const livestockStatusColors: Record<string, string> = {
  '养殖中': 'primary',
  '待出栏': 'warning',
  '已出栏': 'default',
  '已上市': 'success',
}

type TabType = 'crop' | 'livestock'

export default function Industry() {
  const { crops, livestocks, addCrop, addLivestock } = useStore()
  const [activeTab, setActiveTab] = useState<TabType>('crop')
  const [searchText, setSearchText] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const pageSize = 8

  const formatNow = () => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  }

  const [cropForm, setCropForm] = useState({
    name: '',
    variety: '',
    scale: '',
    unit: '亩',
    householdName: '',
    householdId: '',
    groupId: '',
    plantDate: '',
    harvestDate: '',
    marketDate: '',
    expectedYield: '',
    price: '',
    status: '种植中' as Crop['status'],
  })

  const [livestockForm, setLivestockForm] = useState({
    name: '',
    species: '',
    count: '',
    householdName: '',
    householdId: '',
    groupId: '',
    breedDate: '',
    marketDate: '',
    expectedWeight: '',
    price: '',
    status: '养殖中' as Livestock['status'],
  })

  const filteredCrops = useMemo(() => {
    return crops.filter(c => {
      if (searchText && !c.name.includes(searchText) && !c.householdName.includes(searchText) && !c.variety.includes(searchText)) return false
      if (selectedGroup && c.groupId !== selectedGroup) return false
      if (selectedStatus && c.status !== selectedStatus) return false
      return true
    })
  }, [crops, searchText, selectedGroup, selectedStatus])

  const filteredLivestocks = useMemo(() => {
    return livestocks.filter(l => {
      if (searchText && !l.name.includes(searchText) && !l.householdName.includes(searchText) && !l.species.includes(searchText)) return false
      if (selectedGroup && l.groupId !== selectedGroup) return false
      if (selectedStatus && l.status !== selectedStatus) return false
      return true
    })
  }, [livestocks, searchText, selectedGroup, selectedStatus])

  const currentData = activeTab === 'crop' ? filteredCrops : filteredLivestocks
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return currentData.slice(start, start + pageSize)
  }, [currentData, currentPage])

  const categoryData = useMemo(() => [
    { name: '水稻', value: crops.filter(c => c.name === '水稻').reduce((s, c) => s + c.scale, 0), color: '#22c55e' },
    { name: '玉米', value: crops.filter(c => c.name === '玉米').reduce((s, c) => s + c.scale, 0), color: '#f59e0b' },
    { name: '小麦', value: crops.filter(c => c.name === '小麦').reduce((s, c) => s + c.scale, 0), color: '#eab308' },
    { name: '柑橘', value: crops.filter(c => c.name === '柑橘').reduce((s, c) => s + c.scale, 0), color: '#f97316' },
    { name: '蔬菜', value: crops.filter(c => c.name === '蔬菜').reduce((s, c) => s + c.scale, 0), color: '#84cc16' },
  ], [crops])

  const monthlyData = [
    { month: '1月', 种植: 35, 养殖: 20 },
    { month: '2月', 种植: 42, 养殖: 25 },
    { month: '3月', 种植: 58, 养殖: 32 },
    { month: '4月', 种植: 72, 养殖: 38 },
    { month: '5月', 种植: 65, 养殖: 45 },
    { month: '6月', 种植: 48, 养殖: 52 },
  ]

  const totalStats = useMemo(() => ({
    totalCropScale: crops.reduce((s, c) => s + c.scale, 0).toFixed(1),
    totalLivestockCount: livestocks.reduce((s, l) => s + l.count, 0),
    totalValue: (
      crops.filter(c => c.status === '已上市').reduce((s, c) => s + c.expectedYield * c.price, 0) +
      livestocks.filter(l => l.status === '已上市' || l.status === '已出栏').reduce((s, l) => s + l.count * l.expectedWeight * l.price, 0)
    ).toLocaleString(),
    toMarketCount: crops.filter(c => c.status === '待收获').length + livestocks.filter(l => l.status === '待出栏').length,
  }), [crops, livestocks])

  const cropColumns: TableColumn<Crop>[] = [
    {
      key: 'name',
      title: '作物名称',
      width: '100px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Sprout className="w-4 h-4 text-green-600" />
          </div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    { key: 'variety', title: '品种', width: '100px' },
    {
      key: 'scale',
      title: '种植规模',
      width: '100px',
      render: (row) => <span className="font-medium">{row.scale} {row.unit}</span>,
    },
    { key: 'householdName', title: '种植户', width: '100px' },
    { key: 'plantDate', title: '播种日期', width: '110px' },
    { key: 'harvestDate', title: '预计收获', width: '110px' },
    {
      key: 'marketDate',
      title: '预计上市',
      width: '110px',
      render: (row) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {row.marketDate}
        </div>
      ),
    },
    {
      key: 'expectedYield',
      title: '预计产量',
      width: '100px',
      render: (row) => <span>{row.expectedYield} kg</span>,
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (row) => <Badge variant={cropStatusColors[row.status] as any} size="md">{row.status}</Badge>,
    },
  ]

  const livestockColumns: TableColumn<Livestock>[] = [
    {
      key: 'name',
      title: '畜禽名称',
      width: '100px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <Beef className="w-4 h-4 text-orange-600" />
          </div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    { key: 'species', title: '品种', width: '100px' },
    {
      key: 'count',
      title: '养殖数量',
      width: '100px',
      render: (row) => <span className="font-medium">{row.count} 头/只</span>,
    },
    { key: 'householdName', title: '养殖户', width: '100px' },
    { key: 'breedDate', title: '入栏日期', width: '110px' },
    {
      key: 'marketDate',
      title: '预计上市',
      width: '110px',
      render: (row) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {row.marketDate}
        </div>
      ),
    },
    {
      key: 'expectedWeight',
      title: '预计重量',
      width: '100px',
      render: (row) => <span>{row.expectedWeight} kg</span>,
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (row) => <Badge variant={livestockStatusColors[row.status] as any} size="md">{row.status}</Badge>,
    },
  ]

  const handleExport = () => {
    const headers = activeTab === 'crop'
      ? ['作物名称', '品种', '规模', '单位', '种植户', '播种日期', '预计上市', '预计产量(kg)', '状态']
      : ['畜禽名称', '品种', '数量', '养殖户', '入栏日期', '预计上市', '预计重量(kg)', '状态']
    const rows = currentData.map((r: any) => activeTab === 'crop'
      ? [r.name, r.variety, r.scale, r.unit, r.householdName, r.plantDate, r.marketDate, r.expectedYield, r.status]
      : [r.name, r.species, r.count, r.householdName, r.breedDate, r.marketDate, r.expectedWeight, r.status]
    )
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab === 'crop' ? '种植台账' : '养殖台账'}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetCropForm = () => {
    setCropForm({
      name: '',
      variety: '',
      scale: '',
      unit: '亩',
      householdName: '',
      householdId: '',
      groupId: '',
      plantDate: '',
      harvestDate: '',
      marketDate: '',
      expectedYield: '',
      price: '',
      status: '种植中',
    })
  }

  const resetLivestockForm = () => {
    setLivestockForm({
      name: '',
      species: '',
      count: '',
      householdName: '',
      householdId: '',
      groupId: '',
      breedDate: '',
      marketDate: '',
      expectedWeight: '',
      price: '',
      status: '养殖中',
    })
  }

  const resetForm = () => {
    if (activeTab === 'crop') {
      resetCropForm()
    } else {
      resetLivestockForm()
    }
  }

  const handleSubmit = () => {
    if (activeTab === 'crop') {
      if (!cropForm.name || !cropForm.scale || !cropForm.householdName || !cropForm.groupId) {
        alert('请填写必填项')
        return
      }
      const group = villageGroups.find(g => g.id === cropForm.groupId)
      const newCrop: Crop = {
        id: `c${Date.now()}`,
        name: cropForm.name,
        category: '种植',
        variety: cropForm.variety,
        scale: Number(cropForm.scale) || 0,
        unit: cropForm.unit,
        plantDate: cropForm.plantDate || formatNow(),
        harvestDate: cropForm.harvestDate || '',
        marketDate: cropForm.marketDate || '',
        expectedYield: Number(cropForm.expectedYield) || 0,
        price: Number(cropForm.price) || 0,
        status: cropForm.status,
        householdId: cropForm.householdId,
        householdName: cropForm.householdName,
        groupId: cropForm.groupId,
      }
      addCrop(newCrop)
    } else {
      if (!livestockForm.name || !livestockForm.count || !livestockForm.householdName || !livestockForm.groupId) {
        alert('请填写必填项')
        return
      }
      const newLivestock: Livestock = {
        id: `l${Date.now()}`,
        name: livestockForm.name,
        category: '养殖',
        species: livestockForm.species,
        count: Number(livestockForm.count) || 0,
        breedDate: livestockForm.breedDate || formatNow(),
        marketDate: livestockForm.marketDate || '',
        expectedWeight: Number(livestockForm.expectedWeight) || 0,
        price: Number(livestockForm.price) || 0,
        status: livestockForm.status,
        householdId: livestockForm.householdId,
        householdName: livestockForm.householdName,
        groupId: livestockForm.groupId,
      }
      addLivestock(newLivestock)
    }
    resetForm()
    setShowAdd(false)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">产业台账</h1>
          <p className="text-gray-500 mt-1">种养殖产业登记与跟踪管理</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="btn-outline inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出数据
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {activeTab === 'crop' ? '录入种植' : '录入养殖'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">种植总面积</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{totalStats.totalCropScale} 亩</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Sprout className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">养殖总数</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{totalStats.totalLivestockCount} 头/只</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Beef className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已上市产值</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">¥{totalStats.totalValue}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待上市</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{totalStats.toMarketCount} 项</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="作物种植分布" className="lg:col-span-1">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v} 亩`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-1.5 mt-2">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-sm font-medium ml-auto">{item.value} 亩</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="月度产业规模趋势" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="种植" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                <Line type="monotone" dataKey="养殖" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex gap-1 border-b border-gray-200 mb-4">
          <button
            onClick={() => { setActiveTab('crop'); setCurrentPage(1) }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'crop' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sprout className="w-4 h-4" />
            种植台账 ({crops.length})
          </button>
          <button
            onClick={() => { setActiveTab('livestock'); setCurrentPage(1) }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'livestock' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Beef className="w-4 h-4" />
            养殖台账 ({livestocks.length})
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <label className="label">搜索</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="名称、品种、农户..."
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
              {villageGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="min-w-[130px]">
            <label className="label">状态</label>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1) }}
              className="select"
            >
              <option value="">全部状态</option>
              {activeTab === 'crop'
                ? ['种植中', '生长中', '待收获', '已收获', '已上市'].map(s => <option key={s} value={s}>{s}</option>)
                : ['养殖中', '待出栏', '已出栏', '已上市'].map(s => <option key={s} value={s}>{s}</option>)
              }
            </select>
          </div>
          <button
            onClick={() => { setSearchText(''); setSelectedGroup(''); setSelectedStatus(''); setCurrentPage(1) }}
            className="btn-secondary"
          >
            重置
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <Table
            columns={(activeTab === 'crop' ? cropColumns : livestockColumns) as any}
            data={paginatedData as any}
            rowKey={(r) => (r as any).id}
          />
          <Pagination
            current={currentPage}
            total={currentData.length}
            pageSize={pageSize}
            onChange={setCurrentPage}
          />
        </div>
      </Card>

      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); resetForm() }}
        title={activeTab === 'crop' ? '录入种植信息' : '录入养殖信息'}
        footer={
          <>
            <button onClick={() => { setShowAdd(false); resetForm() }} className="btn-outline">取消</button>
            <button onClick={handleSubmit} className="btn-primary">保存</button>
          </>
        }
        width="max-w-3xl"
      >
        <div className="space-y-4">
          {activeTab === 'crop' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">作物名称 <span className="text-red-500">*</span></label>
                <select value={cropForm.name} onChange={(e) => setCropForm({ ...cropForm, name: e.target.value })} className="select">
                  <option value="">请选择</option>
                  <option>水稻</option><option>玉米</option><option>小麦</option>
                  <option>柑橘</option><option>蔬菜</option>
                </select>
              </div>
              <div>
                <label className="label">品种</label>
                <input type="text" value={cropForm.variety} onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })} className="input" placeholder="请输入品种" />
              </div>
              <div>
                <label className="label">种植规模 <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input type="number" value={cropForm.scale} onChange={(e) => setCropForm({ ...cropForm, scale: e.target.value })} className="input" placeholder="数量" />
                  <select value={cropForm.unit} onChange={(e) => setCropForm({ ...cropForm, unit: e.target.value })} className="select w-24"><option>亩</option></select>
                </div>
              </div>
              <div>
                <label className="label">村组 <span className="text-red-500">*</span></label>
                <select value={cropForm.groupId} onChange={(e) => setCropForm({ ...cropForm, groupId: e.target.value })} className="select">
                  <option value="">请选择村组</option>
                  {villageGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">种植户 <span className="text-red-500">*</span></label>
                <input type="text" value={cropForm.householdName} onChange={(e) => setCropForm({ ...cropForm, householdName: e.target.value })} className="input" placeholder="请输入种植户姓名" />
              </div>
              <div>
                <label className="label">播种日期</label>
                <input type="date" value={cropForm.plantDate} onChange={(e) => setCropForm({ ...cropForm, plantDate: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">预计收获日期</label>
                <input type="date" value={cropForm.harvestDate} onChange={(e) => setCropForm({ ...cropForm, harvestDate: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">预计上市日期</label>
                <input type="date" value={cropForm.marketDate} onChange={(e) => setCropForm({ ...cropForm, marketDate: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">预计产量(kg)</label>
                <input type="number" value={cropForm.expectedYield} onChange={(e) => setCropForm({ ...cropForm, expectedYield: e.target.value })} className="input" placeholder="请输入预计产量" />
              </div>
              <div>
                <label className="label">单价(元/kg)</label>
                <input type="number" value={cropForm.price} onChange={(e) => setCropForm({ ...cropForm, price: e.target.value })} className="input" placeholder="请输入预计单价" />
              </div>
              <div>
                <label className="label">状态</label>
                <select value={cropForm.status} onChange={(e) => setCropForm({ ...cropForm, status: e.target.value as Crop['status'] })} className="select">
                  <option>种植中</option><option>生长中</option><option>待收获</option>
                  <option>已收获</option><option>已上市</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">畜禽名称 <span className="text-red-500">*</span></label>
                <select value={livestockForm.name} onChange={(e) => setLivestockForm({ ...livestockForm, name: e.target.value })} className="select">
                  <option value="">请选择</option>
                  <option>生猪</option><option>土鸡</option><option>山羊</option>
                  <option>肉牛</option>
                </select>
              </div>
              <div>
                <label className="label">品种</label>
                <input type="text" value={livestockForm.species} onChange={(e) => setLivestockForm({ ...livestockForm, species: e.target.value })} className="input" placeholder="请输入品种" />
              </div>
              <div>
                <label className="label">养殖数量 <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input type="number" value={livestockForm.count} onChange={(e) => setLivestockForm({ ...livestockForm, count: e.target.value })} className="input" placeholder="数量" />
                  <select className="select w-24"><option>头/只</option></select>
                </div>
              </div>
              <div>
                <label className="label">村组 <span className="text-red-500">*</span></label>
                <select value={livestockForm.groupId} onChange={(e) => setLivestockForm({ ...livestockForm, groupId: e.target.value })} className="select">
                  <option value="">请选择村组</option>
                  {villageGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">养殖户 <span className="text-red-500">*</span></label>
                <input type="text" value={livestockForm.householdName} onChange={(e) => setLivestockForm({ ...livestockForm, householdName: e.target.value })} className="input" placeholder="请输入养殖户姓名" />
              </div>
              <div>
                <label className="label">入栏日期</label>
                <input type="date" value={livestockForm.breedDate} onChange={(e) => setLivestockForm({ ...livestockForm, breedDate: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">预计上市日期</label>
                <input type="date" value={livestockForm.marketDate} onChange={(e) => setLivestockForm({ ...livestockForm, marketDate: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">预计重量(kg/只)</label>
                <input type="number" value={livestockForm.expectedWeight} onChange={(e) => setLivestockForm({ ...livestockForm, expectedWeight: e.target.value })} className="input" placeholder="请输入预计重量" />
              </div>
              <div>
                <label className="label">单价(元/kg)</label>
                <input type="number" value={livestockForm.price} onChange={(e) => setLivestockForm({ ...livestockForm, price: e.target.value })} className="input" placeholder="请输入预计单价" />
              </div>
              <div className="col-span-2">
                <label className="label">状态</label>
                <select value={livestockForm.status} onChange={(e) => setLivestockForm({ ...livestockForm, status: e.target.value as Livestock['status'] })} className="select">
                  <option>养殖中</option><option>待出栏</option><option>已出栏</option><option>已上市</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
