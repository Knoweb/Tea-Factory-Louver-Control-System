"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Leaf, LogOut, Thermometer, Droplets, Wind, Activity, Plus, LayoutDashboard, CheckCircle2, XCircle, Settings, Menu, Trash2 } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"

const firebaseConfig = {
  databaseURL: "https://tea-withering-system-4d483-default-rtdb.firebaseio.com",
}

const INITIAL_TROUGHS = Array.from({ length: 10 }, (_, i) => `trough_${i + 1}`)

export default function Dashboard() {
  const { signOut } = useAuth()
  
  const [troughIds, setTroughIds] = useState<string[]>(INITIAL_TROUGHS)
  const [troughStatuses, setTroughStatuses] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newTroughName, setNewTroughName] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load custom troughs
  useEffect(() => {
    const saved = localStorage.getItem('customTroughs')
    if (saved) {
      try {
        setTroughIds(JSON.parse(saved))
      } catch(e) {}
    }
  }, [])
  
  const handleRemoveTrough = useCallback((idToRemove: string) => {
    if (confirm(`Are you sure you want to remove ${idToRemove.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}?`)) {
      setTroughIds(prev => {
        const updated = prev.filter(id => id !== idToRemove)
        localStorage.setItem('customTroughs', JSON.stringify(updated))
        return updated
      })
      
      // Cleanup status state
      setTroughStatuses(prev => {
        const newStatuses = { ...prev }
        delete newStatuses[idToRemove]
        return newStatuses
      })
    }
  }, [])

  const handleAddTrough = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTroughName.trim()) return
    
    const formattedId = newTroughName.trim().toLowerCase().replace(/\s+/g, '_')
    if (!troughIds.includes(formattedId)) {
      const updated = [...troughIds, formattedId]
      setTroughIds(updated)
      localStorage.setItem('customTroughs', JSON.stringify(updated))
    }
    setNewTroughName("")
    setIsAddModalOpen(false)
  }

  const handleStatusUpdate = useCallback((id: string, hasData: boolean) => {
    setTroughStatuses(prev => {
      if (prev[id] === hasData) return prev
      return { ...prev, [id]: hasData }
    })
  }, [])

  const visibleTroughs = troughIds.filter(id => {
    if (filter === 'all') return true
    if (filter === 'active') return troughStatuses[id] === true
    if (filter === 'inactive') return troughStatuses[id] === false
    return true
  })

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#f4f7f6]">
      {/* Background  */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'url("/bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(12px)',
          transform: 'scale(1.05)'
        }}
      ></div>
      <div className="fixed inset-0 z-0 bg-white/75 xl:bg-white/85 pointer-events-none"></div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white/95 backdrop-blur-xl border-r border-[#009688]/20 z-50 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-2xl md:shadow-none`}>
        <div className="h-20 border-b border-[#009688]/10 flex items-center px-6 bg-white/50 shrink-0">
           <Image
              src="/sanota-logo.jpg"
              alt="SANOTA Logo"
              width={140}
              height={45}
              className="h-10 w-auto mix-blend-multiply"
            />
        </div>
        
        <div className="flex-1 overflow-y-auto py-8 px-5 space-y-2">
          <p className="px-3 text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Views</p>
          
          <button 
            onClick={() => { setFilter('all'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold ${filter === 'all' ? 'bg-[#009688] text-white shadow-md shadow-[#009688]/20' : 'text-gray-600 hover:bg-[#009688]/10'}`}
          >
            <LayoutDashboard className="h-5 w-5" />
            All Troughs
            <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs ${filter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {troughIds.length}
            </span>
          </button>
          
          <button 
            onClick={() => { setFilter('active'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold ${filter === 'active' ? 'bg-[#009688] text-white shadow-md shadow-[#009688]/20' : 'text-gray-600 hover:bg-[#009688]/10'}`}
          >
            <CheckCircle2 className="h-5 w-5" />
            Active Troughs
            <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs ${filter === 'active' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {Object.values(troughStatuses).filter(v => v).length}
            </span>
          </button>

          <button 
            onClick={() => { setFilter('inactive'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold ${filter === 'inactive' ? 'bg-[#009688] text-white shadow-md shadow-[#009688]/20' : 'text-gray-600 hover:bg-[#009688]/10'}`}
          >
            <XCircle className="h-5 w-5" />
            Inactive Troughs
            <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs ${filter === 'inactive' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {Object.values(troughStatuses).filter(v => typeof v === 'boolean' && !v).length}
            </span>
          </button>

          <div className="pt-8">
            <p className="px-3 text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Management</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[#009688] bg-[#009688]/5 hover:bg-[#009688]/15 transition-all font-semibold border border-dashed border-[#009688]/40"
            >
              <Plus className="h-5 w-5" />
              Add New Trough
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-all font-semibold mt-2">
              <Settings className="h-5 w-5" />
              System Settings
            </button>
          </div>
        </div>

        <div className="p-5 border-t border-[#009688]/10 bg-white/50">
           <Button variant="outline" onClick={signOut} className="w-full text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300 justify-start h-12 font-bold shadow-sm">
            <LogOut className="h-5 w-5 mr-3" /> Logout session
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden z-10 relative">
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-[#009688]/10 flex items-center px-6 md:px-10 justify-between shrink-0 mb-2">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-600 hover:bg-white hover:shadow-sm rounded-lg border border-transparent hover:border-gray-200 transition-all">
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-[#009688]">
                {filter === 'all' ? 'Dashboard Overview' : filter === 'active' ? 'Active Diagnostic Feeds' : 'Offline Nodes'}
              </h1>
              <p className="text-sm text-gray-500 font-medium hidden sm:block">Monitor & Automate tea withering infrastructure</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {visibleTroughs.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 bg-white/60 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-300 shadow-sm">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <Leaf className="h-10 w-10 text-[#009688]/40" />
                </div>
                <p className="text-xl font-bold text-gray-700">No troughs found</p>
                <p className="text-base text-gray-500 mt-2">Adjust your filters or add a new louver node.</p>
                {filter !== 'all' && (
                  <Button onClick={() => setFilter('all')} variant="outline" className="mt-6 border-[#009688] text-[#009688] hover:bg-[#009688]/10">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              visibleTroughs.map((troughId) => (
                <TroughCard 
                  key={troughId} 
                  troughId={troughId} 
                  onStatusUpdate={handleStatusUpdate}
                  onRemove={handleRemoveTrough}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Add Trough Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
            <div className="bg-[#009688] p-8 text-white relative">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Leaf className="h-20 w-20" />
              </div>
              <h3 className="text-2xl font-bold relative z-10">Add Trough</h3>
              <p className="text-teal-100 text-sm mt-2 relative z-10">Register a new louver control node</p>
            </div>
            <form onSubmit={handleAddTrough} className="p-8">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Trough Identifier
              </label>
              <Input
                autoFocus
                placeholder="e.g. Trough 11"
                value={newTroughName}
                onChange={(e) => setNewTroughName(e.target.value)}
                className="mb-8 h-14 text-base border-gray-300 focus-visible:ring-[#009688] focus-visible:border-[#009688]"
              />
              <div className="flex gap-4 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-12 px-6 font-bold border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-[#009688] hover:bg-[#007a6e] text-white h-12 px-8 shadow-lg shadow-[#009688]/30 font-bold"
                  disabled={!newTroughName.trim()}
                >
                  <Plus className="h-5 w-5 mr-2" /> Add Node
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function TroughCard({ 
  troughId, 
  onStatusUpdate,
  onRemove
}: { 
  troughId: string, 
  onStatusUpdate: (id: string, hasData: boolean) => void,
  onRemove: (id: string) => void
}) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const response = await fetch(`${firebaseConfig.databaseURL}/troughs/${troughId}/readings.json?orderBy="$key"&limitToLast=1`)
        if (response.ok) {
          const result = await response.json()
          if (result && result !== null) {
            const key = Object.keys(result)[0]
            setData(result[key])
            onStatusUpdate(troughId, true)
          } else {
            setData(null) 
            onStatusUpdate(troughId, false)
          }
        }
      } catch (err) {
        onStatusUpdate(troughId, false)
      } finally {
        setLoading(false)
      }
    }

    fetchLatest()
    const interval = setInterval(fetchLatest, 15000)
    return () => clearInterval(interval)
  }, [troughId, onStatusUpdate])

  const name = troughId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <Link href={`/trough/${troughId}`} className="block h-full cursor-pointer group">
      <Card className="hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 border-white/60 bg-white/80 backdrop-blur-xl h-full shadow-lg">
        <CardHeader className="pb-4 border-b border-[#009688]/10 bg-gradient-to-br from-[#009688]/5 to-transparent rounded-t-xl">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-extrabold text-gray-800 flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <Leaf className="h-5 w-5 text-[#009688] group-hover:scale-110 transition-transform" />
              </div>
              {name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={data ? "bg-[#009688]/10 text-[#009688] border-[#009688]/30 font-bold px-3 py-1" : "bg-gray-100 text-gray-500 border-gray-200 font-semibold px-3 py-1"}>
                {loading ? "Syncing..." : data ? "Online" : "Offline"}
              </Badge>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onRemove(troughId)
                }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all ml-1"
                title="Remove Trough"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-y-8 gap-x-4">
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-500 flex items-center gap-1.5 font-bold tracking-widest uppercase mb-1"><Thermometer className="h-4 w-4 text-gray-400"/> Temp</span>
              <span className="text-3xl font-black text-gray-800">
                {data?.dryTempF ? Number(data.dryTempF).toFixed(1) : data?.dryTemp ? Number(data.dryTemp).toFixed(1) : "--"}°
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-500 flex items-center gap-1.5 font-bold tracking-widest uppercase mb-1"><Droplets className="h-4 w-4 text-blue-400"/> Humidity</span>
              <span className="text-3xl font-black text-gray-800">
                {data?.humidity ? Number(data.humidity).toFixed(1) : data?.rh ? Number(data.rh).toFixed(1) : "--"}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-500 flex items-center gap-1.5 font-bold tracking-widest uppercase mb-1"><Activity className="h-4 w-4 text-orange-400"/> Depr</span>
              <span className="text-3xl font-black text-gray-800">
                {data?.depression ? Number(data.depression).toFixed(1) : data?.diffF ? Number(data.diffF).toFixed(1) : "--"}°
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-[#009688] flex items-center gap-1.5 font-bold tracking-widest uppercase mb-1"><Wind className="h-4 w-4"/> Louver</span>
              <span className="text-3xl font-black text-[#009688]">
                {data?.louverPercent ? `${data.louverPercent}%` : data?.louverStatus || "--"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
