"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, Edit, Trash2, ArrowLeft, Upload } from "lucide-react"
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
    kelas: "",
    age: "",
    parentName: "",
    phone: "",
    address: "",
  })
  const [dataLoaded, setDataLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  const [importing, setImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: santriData } = await supabase.from("santri").select("*").order("created_at", { ascending: false })
        const { data: ustadzData } = await supabase.from("ustadz").select("*").order("created_at", { ascending: false })

        setSantriList(santriData || [])
        setUstadzList(ustadzData || [])
      } catch (error) {
        console.error("Error loading data:", error)
      }
      setDataLoaded(true)
    }

    if (user) {
      loadData()
    }
  }, [user])

  // Real-time subscriptions
  useEffect(() => {
    const santriChannel = supabase
      .channel("santri_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "santri",
        },
        (payload) => {
          console.log("Real-time santri update:", payload.eventType)
          loadSantriData()
        },
      )
      .subscribe()

    const ustadzChannel = supabase
      .channel("ustadz_realtime_santri")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ustadz",
        },
        (payload) => {
          console.log("Real-time ustadz update for santri:", payload.eventType)
          loadUstadzData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(santriChannel)
      supabase.removeChannel(ustadzChannel)
    }
  }, [])

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
    if (!formData.name || !formData.kelas) {
      alert("Nama dan Kelas wajib diisi!")
      return
    }

    setLoading(true)

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("santri")
          .update({
            name: formData.name,
            kelas: formData.kelas,
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
            kelas: formData.kelas,
            age: formData.age,
            parent_name: formData.parentName,
            phone: formData.phone,
            address: formData.address,
          },
        ])

        if (error) throw error
      }

      // Reset form
      setFormData({ name: "", kelas: "", age: "", parentName: "", phone: "", address: "" })
      setIsEditing(false)
      setEditingId("")

      alert(isEditing ? "Data Santri berhasil diperbarui!" : "Santri baru berhasil ditambahkan!")
    } catch (error) {
      console.error("Error:", error)
      alert("Terjadi kesalahan saat menyimpan data")
    }

    setLoading(false)
  }

  const handleEdit = (santri: Santri) => {
    setFormData({
      name: santri.name,
      kelas: santri.kelas,
      age: santri.age || "",
      parentName: santri.parent_name || "",
      phone: santri.phone || "",
      address: santri.address || "",
    })
    setIsEditing(true)
    setEditingId(santri.id)
  }

  const handleDelete = async (id: string) => {
    // ask for confirmation
    if (
      !confirm("Apakah Anda yakin ingin menghapus data Santri ini? Semua data hafalan yang terkait juga akan dihapus.")
    ) {
      return
    }

    try {
      // 1) delete all memorization rows first
      const { error: memError } = await supabase.from("memorization").delete().eq("santri_id", id)

      if (memError) {
        console.error("Error deleting memorization:", memError)
        alert("Gagal menghapus data hafalan: " + memError.message)
        return
      }

      // 2) delete the santri record
      const { error: santriError } = await supabase.from("santri").delete().eq("id", id)

      if (santriError) {
        console.error("Error deleting santri:", santriError)
        alert("Gagal menghapus data santri: " + santriError.message)
        return
      }

      alert("Data Santri dan hafalan terkait berhasil dihapus!")
    } catch (err) {
      console.error("Unexpected error deleting santri:", err)
      alert("Terjadi kesalahan")
    }
  }

  const handleCancel = () => {
    setFormData({ name: "", kelas: "", age: "", parentName: "", phone: "", address: "" })
    setIsEditing(false)
    setEditingId("")
  }

  const handleImport = async () => {
    if (!importFile) {
      alert("Silakan pilih file CSV terlebih dahulu!")
      return
    }

    setImporting(true)

    try {
      const text = await importFile.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        alert("File CSV harus memiliki header dan minimal 1 data!")
        return
      }

      // Parse CSV
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
      const requiredHeaders = ["nama", "kelas"]

      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))
      if (missingHeaders.length > 0) {
        alert(`Header yang diperlukan: ${requiredHeaders.join(", ")}\nHeader yang hilang: ${missingHeaders.join(", ")}`)
        return
      }

      const importedData = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim())
        if (values.length < headers.length) continue

        const rowData: any = {}
        headers.forEach((header, index) => {
          rowData[header] = values[index] || ""
        })

        importedData.push({
          name: rowData.nama,
          kelas: rowData.kelas,
          age: rowData.usia || rowData.age || "",
          parent_name: rowData.nama_orangtua || rowData.parent_name || "",
          phone: rowData.telepon || rowData.phone || "",
          address: rowData.alamat || rowData.address || "",
        })
      }

      const { error } = await supabase.from("santri").insert(importedData)

      if (error) {
        console.error("Error importing santri:", error)
        alert("Gagal mengimpor data: " + error.message)
        return
      }

      alert(`Berhasil mengimpor ${importedData.length} data Santri!`)
      setImportFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error importing:", error)
      alert("Gagal mengimpor data. Pastikan format CSV benar.")
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,nama,kelas,usia,nama_orangtua,telepon,alamat\nAhmad Santri,Kelas A,12 tahun,Bapak Ahmad,08123456789,Jl. Contoh No. 1\nBudi Santri,Kelas B,13 tahun,Bapak Budi,08987654321,Jl. Contoh No. 2"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "template_santri.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getAvailableKelas = () => {
    const kelasList = ustadzList.map((ustadz) => ustadz.kelas)
    return [...new Set(kelasList)]
  }

  const getSantriByKelas = (kelas: string) => {
    return santriList.filter((santri) => santri.kelas === kelas)
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
            <p className="text-gray-600">Kelola data santri dan penempatan kelas</p>
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
                  {isEditing ? "Perbarui data Santri" : "Tambahkan Santri baru ke kelas"}
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
                  <Label htmlFor="kelas">Kelas *</Label>
                  <Select
                    value={formData.kelas}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, kelas: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableKelas().map((kelas) => (
                        <SelectItem key={kelas} value={kelas}>
                          {kelas}
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
                    disabled={!formData.name || !formData.kelas || loading}
                  >
                    {loading ? "Menyimpan..." : isEditing ? "Perbarui" : "Tambah"} Santri
                  </Button>
                  {isEditing && (
                    <Button onClick={handleCancel} variant="outline" className="flex-1 bg-transparent">
                      Batal
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Import Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Data Santri
                </CardTitle>
                <CardDescription>Import data Santri dari file CSV</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csvFile">File CSV</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-sm text-gray-500">Format: nama, kelas, usia, nama_orangtua, telepon, alamat</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleImport}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={!importFile || importing}
                  >
                    {importing ? "Mengimpor..." : "Import Data"}
                  </Button>
                  <Button onClick={downloadTemplate} variant="outline" className="flex-1 bg-transparent">
                    Download Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Daftar Santri */}
            <Card className="lg:col-span-2">
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
                              {santri.kelas}
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

          {/* Santri per Kelas */}
          {getAvailableKelas().length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Santri per Kelas</CardTitle>
                <CardDescription>Distribusi santri di setiap kelas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getAvailableKelas().map((kelas) => (
                    <div key={kelas} className="border rounded-lg p-4">
                      <h3 className="font-medium text-lg mb-2">{kelas}</h3>
                      <Badge variant="outline" className="mb-3">
                        {getSantriByKelas(kelas).length} Santri
                      </Badge>
                      <div className="space-y-1">
                        {getSantriByKelas(kelas).map((santri) => (
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
