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
import { supabase, type Santri, type Memorization, type Ustadz } from "@/lib/supabase-client"

export default function MemorizationPage() {
  const { user, hasPermission, isLoading } = useAuth()
  const [santriList, setSantriList] = useState<Santri[]>([])
  const [ustadzList, setUstadzList] = useState<Ustadz[]>([])
  const [memorizationRecords, setMemorizationRecords] = useState<Memorization[]>([])
  const [selectedKelas, setSelectedKelas] = useState("")
  const [selectedSantri, setSelectedSantri] = useState("")
  const [formData, setFormData] = useState({
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
      try {
        const { data: santriData } = await supabase.from("santri").select("*").order("created_at", { ascending: false })
        const { data: ustadzData } = await supabase.from("ustadz").select("*").order("created_at", { ascending: false })
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
        setUstadzList(ustadzData || [])
        setMemorizationRecords(memorizationData || [])
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    if (user) {
      loadData()
    }
  }, [user])

  // Real-time subscriptions
  useEffect(() => {
    const memorizationChannel = supabase
      .channel("memorization_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "memorization",
        },
        (payload) => {
          console.log("Real-time memorization update:", payload.eventType)
          loadMemorizationData()
        },
      )
      .subscribe()

    const santriChannel = supabase
      .channel("santri_realtime_memorization")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "santri",
        },
        (payload) => {
          console.log("Real-time santri update for memorization:", payload.eventType)
          loadSantriData()
        },
      )
      .subscribe()

    const ustadzChannel = supabase
      .channel("ustadz_realtime_memorization")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ustadz",
        },
        (payload) => {
          console.log("Real-time ustadz update for memorization:", payload.eventType)
          loadUstadzData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(memorizationChannel)
      supabase.removeChannel(santriChannel)
      supabase.removeChannel(ustadzChannel)
    }
  }, [])

  const loadMemorizationData = async () => {
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

      setMemorizationRecords(data || [])
    } catch (error) {
      console.error("Error loading memorization:", error)
    }
  }

  const loadSantriData = async () => {
    try {
      const { data } = await supabase.from("santri").select("*").order("created_at", { ascending: false })
      setSantriList(data || [])
    } catch (error) {
      console.error("Error loading santri:", error)
    }
  }

  const loadUstadzData = async () => {
    try {
      const { data } = await supabase.from("ustadz").select("*").order("created_at", { ascending: false })
      setUstadzList(data || [])
    } catch (error) {
      console.error("Error loading ustadz:", error)
    }
  }

  // Get available classes from ustadz data
  const getAvailableKelas = () => {
    const kelasList = ustadzList.map((ustadz) => ustadz.halaqoh)
    return [...new Set(kelasList)].filter(Boolean) // Remove duplicates and empty values
  }

  const getSantriByKelas = (kelas: string) => {
    return santriList.filter((santri) => santri.halaqoh === kelas)
  }

  const handleSubmitMemorization = async () => {
    if (!selectedSantri || !formData.totalHafalan || !formData.quality) {
      alert("Mohon lengkapi semua field yang wajib!")
      return
    }

    setLoading(true)

    try {
      // --- convert Juz (can be decimal) to an integer value (tenths) ---
      const juz = Number.parseFloat(formData.totalHafalan)
      if (Number.isNaN(juz)) {
        alert("Total hafalan harus berupa angka.")
        setLoading(false)
        return
      }
      const storedValue = Math.round(juz * 10) // e.g. 7.5 -> 75

      const { error } = await supabase.from("memorization").insert([
        {
          santri_id: selectedSantri,
          date: new Date().toISOString().split("T")[0], // Auto set to today
          surah: "Total Hafalan", // Default value
          ayah_from: 0, // Default value
          ayah_to: storedValue,
          quality: formData.quality,
          notes: formData.notes,
        },
      ])

      if (error) {
        console.error("Error inserting memorization:", error)
        alert("Gagal menyimpan data hafalan: " + error.message)
        return
      }

      // Reset form
      setSelectedKelas("")
      setSelectedSantri("")
      setFormData({
        totalHafalan: "",
        quality: "",
        notes: "",
      })

      alert("Data hafalan berhasil disimpan!")
    } catch (error) {
      console.error("Error submitting memorization:", error)
      alert("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
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
            <p className="text-gray-600">Kelola dan rekap hafalan santri di setiap kelas</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Input Hafalan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Input Hafalan Santri
                </CardTitle>
                <CardDescription>Catat progress hafalan santri dalam Juz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kelas">Pilih Kelas *</Label>
                  <Select
                    value={selectedKelas}
                    onValueChange={(value) => {
                      setSelectedKelas(value)
                      setSelectedSantri("") // Reset santri selection when kelas changes
                    }}
                    disabled={getAvailableKelas().length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={getAvailableKelas().length ? "Pilih Kelas" : "Belum ada kelas"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableKelas().map((kelas) => (
                        <SelectItem key={kelas} value={kelas}>
                          {kelas}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getAvailableKelas().length === 0 && (
                    <p className="text-sm text-amber-600">
                      Silakan tambahkan data Ustadz terlebih dahulu untuk membuat kelas
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="santri">Pilih Santri *</Label>
                  <Select
                    value={selectedSantri}
                    onValueChange={setSelectedSantri}
                    disabled={!selectedKelas || getSantriByKelas(selectedKelas).length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !selectedKelas
                            ? "Pilih Kelas terlebih dahulu"
                            : getSantriByKelas(selectedKelas).length === 0
                              ? "Belum ada santri di kelas ini"
                              : "Pilih Santri"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {getSantriByKelas(selectedKelas).map((santri) => (
                        <SelectItem key={santri.id} value={santri.id}>
                          {santri.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedKelas && getSantriByKelas(selectedKelas).length === 0 && (
                    <p className="text-sm text-amber-600">
                      Belum ada santri di kelas {selectedKelas}. Silakan tambahkan santri terlebih dahulu.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalHafalan">Total Hafalan (Juz) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    placeholder="Contoh: 2.5"
                    value={formData.totalHafalan}
                    onChange={(e) => setFormData((prev) => ({ ...prev, totalHafalan: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">
                    Masukkan jumlah Juz yang telah dihafal (bisa desimal, contoh: 2.5)
                  </p>
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
                  disabled={!selectedSantri || !formData.totalHafalan || !formData.quality || loading}
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
                            <span className="font-medium">{record.santri?.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(record.date).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">Total Hafalan:</span> {(record.ayah_to / 10).toFixed(1)} Juz
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Kelas:</span> {record.santri?.halaqoh}
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
