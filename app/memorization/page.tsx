"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { BookOpen, User, ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Navbar } from "@/components/navbar"
import { supabase, type Santri } from "@/lib/supabase-client"

interface MemorizationRecord {
  id: string
  santriId: string
  santriName: string
  halaqoh: string
  date: string
  totalSetoran: number
  totalHafalan: number
  quality: "Baik" | "Cukup" | "Kurang"
  notes: string
}

export default function MemorizationPage() {
  const { user, hasPermission, isLoading } = useAuth()
  const [santriList, setSantriList] = useState<Santri[]>([])
  const [memorizationRecords, setMemorizationRecords] = useState<MemorizationRecord[]>([])
  const [selectedHalaqoh, setSelectedHalaqoh] = useState("")
  const [selectedSantri, setSelectedSantri] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [formData, setFormData] = useState({
    totalSetoran: "",
    totalHafalan: "",
    quality: "",
    notes: "",
  })
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && hasPermission("manage_memorization")) {
      setHasAccess(true)
    } else {
      setHasAccess(false)
    }
  }, [user, hasPermission])

  useEffect(() => {
    const loadData = async () => {
      const isDemoUser = user?.id?.startsWith("demo-")

      if (isDemoUser) {
        // Load data from localStorage for demo users
        const santriData = JSON.parse(localStorage.getItem("santriData") || "[]")
        const memorizationData = JSON.parse(localStorage.getItem("memorizationData") || "[]")
        setSantriList(santriData)
        setMemorizationRecords(memorizationData)
      } else {
        // Load data from Supabase for real users
        try {
          const { data: santriData } = await supabase
            .from("santri")
            .select("*")
            .order("created_at", { ascending: false })
          const { data: memorizationData } = await supabase
            .from("memorization")
            .select(`
              *,
              santri:santri_id (
                name,
                halaqoh
              )
            `)
            .order("created_at", { ascending: false })

          setSantriList(santriData || [])

          // Transform memorization data to match new interface
          const transformedMemorization =
            memorizationData?.map((record) => ({
              id: record.id,
              santriId: record.santri_id,
              santriName: record.santri?.name || "",
              halaqoh: record.santri?.halaqoh || "",
              date: record.date,
              totalSetoran: record.total_setoran || 0,
              totalHafalan: record.total_hafalan || 0,
              quality: record.quality as "Baik" | "Cukup" | "Kurang",
              notes: record.notes || "",
            })) || []

          setMemorizationRecords(transformedMemorization)
        } catch (error) {
          console.error("Error loading data:", error)
        }
      }
    }

    if (user) {
      loadData()
    }
  }, [user])

  // Set up real-time subscriptions
  useEffect(() => {
    const memorizationChannel = supabase
      .channel("memorization_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "memorization" }, (payload) => {
        console.log("Memorization real-time update:", payload)
        loadMemorizationData()
      })
      .subscribe()

    const santriChannel = supabase
      .channel("santri_changes_memorization")
      .on("postgres_changes", { event: "*", schema: "public", table: "santri" }, (payload) => {
        console.log("Santri real-time update:", payload)
        loadSantriData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(memorizationChannel)
      supabase.removeChannel(santriChannel)
    }
  }, [])

  const loadMemorizationData = async () => {
    const isDemoUser = user?.id?.startsWith("demo-")
    if (!isDemoUser) {
      try {
        const { data } = await supabase
          .from("memorization")
          .select(`
            *,
            santri:santri_id (
              name,
              halaqoh
            )
          `)
          .order("created_at", { ascending: false })

        const transformedMemorization =
          data?.map((record) => ({
            id: record.id,
            santriId: record.santri_id,
            santriName: record.santri?.name || "",
            halaqoh: record.santri?.halaqoh || "",
            date: record.date,
            totalSetoran: record.total_setoran || 0,
            totalHafalan: record.total_hafalan || 0,
            quality: record.quality as "Baik" | "Cukup" | "Kurang",
            notes: record.notes || "",
          })) || []

        setMemorizationRecords(transformedMemorization)
      } catch (error) {
        console.error("Error loading memorization:", error)
      }
    }
  }

  const loadSantriData = async () => {
    const isDemoUser = user?.id?.startsWith("demo-")
    if (!isDemoUser) {
      try {
        const { data } = await supabase.from("santri").select("*").order("created_at", { ascending: false })
        setSantriList(data || [])
      } catch (error) {
        console.error("Error loading santri:", error)
      }
    }
  }

  const getAvailableHalaqoh = () => {
    const halaqohList = santriList.map((santri) => santri.halaqoh)
    return [...new Set(halaqohList)].filter(Boolean)
  }

  const getSantriByHalaqoh = (halaqoh: string) => {
    return santriList.filter((santri) => santri.halaqoh === halaqoh)
  }

  const handleSubmitMemorization = async () => {
    if (!selectedSantri || !formData.totalSetoran || !formData.totalHafalan || !formData.quality) {
      alert("Mohon lengkapi semua field yang wajib!")
      return
    }

    setLoading(true)

    const isDemoUser = user?.id?.startsWith("demo-")

    if (isDemoUser) {
      // Handle demo user with localStorage
      const santri = santriList.find((s) => s.id === selectedSantri)
      if (!santri) return

      const newRecord: MemorizationRecord = {
        id: `demo-${Date.now()}`,
        santriId: selectedSantri,
        santriName: santri.name,
        halaqoh: santri.halaqoh,
        date: selectedDate,
        totalSetoran: Number.parseInt(formData.totalSetoran),
        totalHafalan: Number.parseInt(formData.totalHafalan),
        quality: formData.quality as "Baik" | "Cukup" | "Kurang",
        notes: formData.notes,
      }

      const updatedRecords = [...memorizationRecords, newRecord]
      setMemorizationRecords(updatedRecords)
      localStorage.setItem("memorizationData", JSON.stringify(updatedRecords))
    } else {
      // Handle real Supabase user
      try {
        const { error } = await supabase.from("memorization").insert([
          {
            santri_id: selectedSantri,
            date: selectedDate,
            total_setoran: Number.parseInt(formData.totalSetoran),
            total_hafalan: Number.parseInt(formData.totalHafalan),
            quality: formData.quality,
            notes: formData.notes,
          },
        ])

        if (error) {
          console.error("Error inserting memorization:", error)
          alert("Gagal menyimpan data hafalan: " + error.message)
          return
        }

        // Data will be automatically updated via real-time subscription
      } catch (error) {
        console.error("Error submitting memorization:", error)
        alert("Terjadi kesalahan")
        return
      }
    }

    // Reset form
    setSelectedHalaqoh("")
    setSelectedSantri("")
    setFormData({
      totalSetoran: "",
      totalHafalan: "",
      quality: "",
      notes: "",
    })

    alert("Data hafalan berhasil disimpan!")
    setLoading(false)
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "Baik":
        return "bg-green-100 text-green-800"
      case "Cukup":
        return "bg-yellow-100 text-yellow-800"
      case "Kurang":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRecentRecords = () => {
    return memorizationRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Navbar />
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hafalan Santri</h1>
            <p className="text-gray-600">Kelola dan rekap hafalan santri di setiap Halaqoh</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Input Hafalan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Input Hafalan Santri
                </CardTitle>
                <CardDescription>Catat progress hafalan santri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="halaqoh">Pilih Halaqoh *</Label>
                  <Select
                    value={selectedHalaqoh}
                    onValueChange={(value) => {
                      setSelectedHalaqoh(value)
                      setSelectedSantri("") // Reset santri selection when halaqoh changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Halaqoh" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableHalaqoh().map((halaqoh) => (
                        <SelectItem key={halaqoh} value={halaqoh}>
                          {halaqoh}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="santri">Pilih Santri *</Label>
                  <Select value={selectedSantri} onValueChange={setSelectedSantri} disabled={!selectedHalaqoh}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedHalaqoh ? "Pilih Santri" : "Pilih Halaqoh terlebih dahulu"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getSantriByHalaqoh(selectedHalaqoh).map((santri) => (
                        <SelectItem key={santri.id} value={santri.id}>
                          {santri.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal</Label>
                  <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalSetoran">Total Setoran Bulan Ini *</Label>
                  <Input
                    type="number"
                    placeholder="Jumlah setoran"
                    value={formData.totalSetoran}
                    onChange={(e) => setFormData((prev) => ({ ...prev, totalSetoran: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalHafalan">Total Hafalan (Ayat) *</Label>
                  <Input
                    type="number"
                    placeholder="Total ayat yang dihafal"
                    value={formData.totalHafalan}
                    onChange={(e) => setFormData((prev) => ({ ...prev, totalHafalan: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality">Kualitas Hafalan *</Label>
                  <Select
                    value={formData.quality}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, quality: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kualitas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baik">Baik</SelectItem>
                      <SelectItem value="Cukup">Cukup</SelectItem>
                      <SelectItem value="Kurang">Kurang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    placeholder="Catatan tambahan tentang hafalan..."
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <Button
                  onClick={handleSubmitMemorization}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={
                    !selectedSantri || !formData.totalSetoran || !formData.totalHafalan || !formData.quality || loading
                  }
                >
                  {loading ? "Menyimpan..." : "Simpan Data Hafalan"}
                </Button>
              </CardContent>
            </Card>

            {/* Daftar Hafalan Terbaru */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Hafalan Terbaru
                </CardTitle>
                <CardDescription>10 data hafalan terbaru yang diinput</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getRecentRecords().length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Belum ada data hafalan</p>
                  ) : (
                    getRecentRecords().map((record) => (
                      <div key={record.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{record.santriName}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(record.date).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">Total Setoran:</span> {record.totalSetoran}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Total Hafalan:</span> {record.totalHafalan} ayat
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Halaqoh:</span> {record.halaqoh}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Kualitas:</span>
                            <Badge className={getQualityColor(record.quality)}>{record.quality}</Badge>
                          </div>
                          {record.notes && <p className="text-sm text-gray-600 mt-2">{record.notes}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
