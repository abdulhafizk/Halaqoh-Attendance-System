"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, Edit, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Navbar } from "@/components/navbar"
import { supabase, type Santri, type Ustadz } from "@/lib/supabase-client"

export default function SantriPage() {
  const { user, hasPermission, isLoading } = useAuth()
  const [santriList, setSantriList] = useState<Santri[]>([])
  const [ustadzList, setUstadzList] = useState<Ustadz[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    halaqoh: "",
    age: "",
    parentName: "",
    phone: "",
    address: "",
  })
  const [dataLoaded, setDataLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const isDemoUser = user?.id?.startsWith("demo-")

      if (isDemoUser) {
        // Load data from localStorage for demo users
        const santriData = JSON.parse(localStorage.getItem("santriData") || "[]")
        const ustadzData = JSON.parse(localStorage.getItem("ustadzData") || "[]")
        setSantriList(santriData)
        setUstadzList(ustadzData)
      } else {
        // Load data from Supabase for real users
        try {
          const { data: santriData } = await supabase
            .from("santri")
            .select("*")
            .order("created_at", { ascending: false })
          const { data: ustadzData } = await supabase
            .from("ustadz")
            .select("*")
            .order("created_at", { ascending: false })

          setSantriList(santriData || [])
          setUstadzList(ustadzData || [])
        } catch (error) {
          console.error("Error loading data:", error)
        }
      }
      setDataLoaded(true)
    }

    if (user) {
      loadData()
    }
  }, [user])

  // Set up real-time subscriptions
  useEffect(() => {
    const santriChannel = supabase
      .channel("santri_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "santri" }, (payload) => {
        console.log("Santri real-time update:", payload)
        loadSantriData()
      })
      .subscribe()

    const ustadzChannel = supabase
      .channel("ustadz_changes_santri")
      .on("postgres_changes", { event: "*", schema: "public", table: "ustadz" }, (payload) => {
        console.log("Ustadz real-time update:", payload)
        loadUstadzData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(santriChannel)
      supabase.removeChannel(ustadzChannel)
    }
  }, [])

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

  const loadUstadzData = async () => {
    const isDemoUser = user?.id?.startsWith("demo-")
    if (!isDemoUser) {
      try {
        const { data } = await supabase.from("ustadz").select("*").order("created_at", { ascending: false })
        setUstadzList(data || [])
      } catch (error) {
        console.error("Error loading ustadz:", error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (!user || !hasPermission("manage_santri")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.halaqoh) {
      alert("Nama dan Halaqoh wajib diisi!")
      return
    }

    setLoading(true)

    const isDemoUser = user?.id?.startsWith("demo-")

    if (isDemoUser) {
      // Handle demo user with localStorage
      let updatedList: Santri[]

      if (isEditing) {
        updatedList = santriList.map((santri) => (santri.id === editingId ? { ...santri, ...formData } : santri))
      } else {
        const newSantri: Santri = {
          id: `demo-${Date.now()}`,
          name: formData.name,
          halaqoh: formData.halaqoh,
          age: formData.age,
          parent_name: formData.parentName,
          phone: formData.phone,
          address: formData.address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        updatedList = [...santriList, newSantri]
      }

      setSantriList(updatedList)
      localStorage.setItem("santriData", JSON.stringify(updatedList))

      // Reset form
      setFormData({ name: "", halaqoh: "", age: "", parentName: "", phone: "", address: "" })
      setIsEditing(false)
      setEditingId("")

      alert(isEditing ? "Data Santri berhasil diperbarui!" : "Santri baru berhasil ditambahkan!")
    } else {
      // Handle real Supabase user
      try {
        if (isEditing) {
          const { error } = await supabase
            .from("santri")
            .update({
              name: formData.name,
              halaqoh: formData.halaqoh,
              age: formData.age,
              parent_name: formData.parentName,
              phone: formData.phone,
              address: formData.address,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editingId)

          if (error) throw error
        } else {
          const { error } = await supabase.from("santri").insert([
            {
              name: formData.name,
              halaqoh: formData.halaqoh,
              age: formData.age,
              parent_name: formData.parentName,
              phone: formData.phone,
              address: formData.address,
            },
          ])

          if (error) throw error
        }

        // Reset form
        setFormData({ name: "", halaqoh: "", age: "", parentName: "", phone: "", address: "" })
        setIsEditing(false)
        setEditingId("")

        alert(isEditing ? "Data Santri berhasil diperbarui!" : "Santri baru berhasil ditambahkan!")
        // Data will be automatically updated via real-time subscription
      } catch (error) {
        console.error("Error:", error)
        alert("Terjadi kesalahan saat menyimpan data")
      }
    }

    setLoading(false)
  }

  const handleEdit = (santri: Santri) => {
    setFormData({
      name: santri.name,
      halaqoh: santri.halaqoh,
      age: santri.age || "",
      parentName: santri.parent_name || "",
      phone: santri.phone || "",
      address: santri.address || "",
    })
    setIsEditing(true)
    setEditingId(santri.id)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data Santri ini?")) {
      const isDemoUser = user?.id?.startsWith("demo-")

      if (isDemoUser) {
        const updatedList = santriList.filter((santri) => santri.id !== id)
        setSantriList(updatedList)
        localStorage.setItem("santriData", JSON.stringify(updatedList))
        alert("Data Santri berhasil dihapus!")
      } else {
        try {
          const { error } = await supabase.from("santri").delete().eq("id", id)

          if (error) {
            console.error("Error deleting santri:", error)
            alert("Gagal menghapus data santri: " + error.message)
            return
          }

          alert("Data Santri berhasil dihapus!")
          // Data will be automatically updated via real-time subscription
        } catch (error) {
          console.error("Error deleting santri:", error)
          alert("Terjadi kesalahan")
        }
      }
    }
  }

  const handleCancel = () => {
    setFormData({ name: "", halaqoh: "", age: "", parentName: "", phone: "", address: "" })
    setIsEditing(false)
    setEditingId("")
  }

  const getAvailableHalaqoh = () => {
    const halaqohList = ustadzList.map((ustadz) => ustadz.halaqoh)
    return [...new Set(halaqohList)]
  }

  const getSantriByHalaqoh = (halaqoh: string) => {
    return santriList.filter((santri) => santri.halaqoh === halaqoh)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Santri</h1>
            <p className="text-gray-600">Kelola data santri dan penempatan Halaqoh</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Input/Edit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {isEditing ? "Edit Santri" : "Tambah Santri Baru"}
                </CardTitle>
                <CardDescription>
                  {isEditing ? "Perbarui data Santri" : "Tambahkan Santri baru ke Halaqoh"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Santri *</Label>
                  <Input
                    placeholder="Masukkan nama lengkap"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="halaqoh">Halaqoh *</Label>
                  <Select
                    value={formData.halaqoh}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, halaqoh: value }))}
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
                  <Label htmlFor="age">Usia</Label>
                  <Input
                    placeholder="Contoh: 12 tahun"
                    value={formData.age}
                    onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentName">Nama Orang Tua</Label>
                  <Input
                    placeholder="Nama ayah/ibu"
                    value={formData.parentName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, parentName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">No. Telepon</Label>
                  <Input
                    placeholder="Contoh: 08123456789"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input
                    placeholder="Alamat lengkap"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                    disabled={!formData.name || !formData.halaqoh || loading}
                  >
                    {loading ? "Menyimpan..." : isEditing ? "Perbarui" : "Tambah"} Santri
                  </Button>
                  {isEditing && (
                    <Button onClick={handleCancel} variant="outline" className="flex-1">
                      Batal
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Daftar Santri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Daftar Santri ({santriList.length})
                </CardTitle>
                <CardDescription>Semua Santri yang terdaftar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {santriList.length === 0 && dataLoaded ? (
                    <p className="text-gray-500 text-center py-4">Belum ada data Santri</p>
                  ) : !dataLoaded ? (
                    <p className="text-gray-500 text-center py-4">Loading data...</p>
                  ) : (
                    santriList.map((santri) => (
                      <div key={santri.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg">{santri.name}</h3>
                            <Badge variant="secondary" className="mb-2">
                              {santri.halaqoh}
                            </Badge>
                            {santri.age && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Usia:</span> {santri.age}
                              </p>
                            )}
                            {santri.parent_name && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Orang Tua:</span> {santri.parent_name}
                              </p>
                            )}
                            {santri.phone && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Telepon:</span> {santri.phone}
                              </p>
                            )}
                            {santri.address && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Alamat:</span> {santri.address}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(santri)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(santri.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Santri per Halaqoh */}
          {getAvailableHalaqoh().length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Santri per Halaqoh</CardTitle>
                <CardDescription>Distribusi santri di setiap Halaqoh</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getAvailableHalaqoh().map((halaqoh) => (
                    <div key={halaqoh} className="border rounded-lg p-4">
                      <h3 className="font-medium text-lg mb-2">{halaqoh}</h3>
                      <Badge variant="outline" className="mb-3">
                        {getSantriByHalaqoh(halaqoh).length} Santri
                      </Badge>
                      <div className="space-y-1">
                        {getSantriByHalaqoh(halaqoh).map((santri) => (
                          <p key={santri.id} className="text-sm text-gray-600">
                            • {santri.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
