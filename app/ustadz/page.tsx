"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Edit, Trash2, ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Navbar } from "@/components/navbar"
import { supabase, type Ustadz } from "@/lib/supabase-client"

export default function UstadzPage() {
  const { user, hasPermission, isLoading } = useAuth()
  const [ustadzList, setUstadzList] = useState<Ustadz[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    kelas: "",
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
        const { data: ustadzData } = await supabase.from("ustadz").select("*").order("created_at", { ascending: false })
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
    const ustadzChannel = supabase
      .channel("ustadz_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ustadz",
        },
        (payload) => {
          console.log("Real-time ustadz update:", payload.eventType)
          loadUstadzData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ustadzChannel)
    }
  }, [])

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !hasPermission("manage_ustadz")) {
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
          .from("ustadz")
          .update({
            name: formData.name,
            kelas: formData.kelas,
            phone: formData.phone,
            address: formData.address,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId)

        if (error) throw error
      } else {
        const { error } = await supabase.from("ustadz").insert([
          {
            name: formData.name,
            kelas: formData.kelas,
            phone: formData.phone,
            address: formData.address,
          },
        ])

        if (error) throw error
      }

      // Reset form
      setFormData({ name: "", kelas: "", phone: "", address: "" })
      setIsEditing(false)
      setEditingId("")

      alert(isEditing ? "Data Ustadz berhasil diperbarui!" : "Ustadz baru berhasil ditambahkan!")
    } catch (error) {
      console.error("Error:", error)
      alert("Terjadi kesalahan saat menyimpan data")
    }

    setLoading(false)
  }

  const handleEdit = (ustadz: Ustadz) => {
    setFormData({
      name: ustadz.name,
      kelas: ustadz.kelas,
      phone: ustadz.phone || "",
      address: ustadz.address || "",
    })
    setIsEditing(true)
    setEditingId(ustadz.id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Menghapus Ustadz ini juga akan menghapus seluruh data kehadiran terkait. Lanjutkan?")) {
      return
    }

    try {
      // 1. delete all attendance rows that reference this ustadz
      const { error: attendanceError } = await supabase.from("attendance").delete().eq("ustadz_id", id)

      if (attendanceError) {
        console.error("Error deleting attendance:", attendanceError)
        alert("Gagal menghapus data kehadiran terkait: " + attendanceError.message)
        return
      }

      // 2. delete the ustadz record itself
      const { error: ustadzError } = await supabase.from("ustadz").delete().eq("id", id)

      if (ustadzError) {
        console.error("Error deleting ustadz:", ustadzError)
        alert("Gagal menghapus data ustadz: " + ustadzError.message)
        return
      }

      alert("Data Ustadz dan kehadiran terkait berhasil dihapus!")
    } catch (error) {
      console.error("Unexpected error:", error)
      alert("Terjadi kesalahan saat menghapus data")
    }
  }

  const handleCancel = () => {
    setFormData({ name: "", kelas: "", phone: "", address: "" })
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
          phone: rowData.telepon || rowData.phone || "",
          address: rowData.alamat || rowData.address || "",
        })
      }

      const { error } = await supabase.from("ustadz").insert(importedData)

      if (error) {
        console.error("Error importing ustadz:", error)
        alert("Gagal mengimpor data: " + error.message)
        return
      }

      alert(`Berhasil mengimpor ${importedData.length} data Ustadz!`)
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
      "data:text/csv;charset=utf-8,nama,kelas,telepon,alamat\nUstadz Ahmad,Kelas A,08123456789,Jl. Contoh No. 1\nUstadz Budi,Kelas B,08987654321,Jl. Contoh No. 2"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "template_ustadz.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getUstadzByKelas = (kelas: string) => {
    return ustadzList.filter((ustadz) => ustadz.kelas === kelas)
  }

  const getAvailableKelas = () => {
    const kelasList = ustadzList.map((ustadz) => ustadz.kelas)
    return [...new Set(kelasList)]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Ustadz</h1>
            <p className="text-gray-600">Kelola data ustadz dan penempatan kelas</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Input/Edit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {isEditing ? "Edit Ustadz" : "Tambah Ustadz Baru"}
                </CardTitle>
                <CardDescription>
                  {isEditing ? "Perbarui data Ustadz" : "Tambahkan Ustadz baru ke kelas"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Ustadz *</Label>
                  <Input
                    placeholder="Masukkan nama lengkap"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kelas">Kelas *</Label>
                  <Input
                    placeholder="Contoh: Kelas A"
                    value={formData.kelas}
                    onChange={(e) => setFormData((prev) => ({ ...prev, kelas: e.target.value }))}
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={!formData.name || !formData.kelas || loading}
                  >
                    {loading ? "Menyimpan..." : isEditing ? "Perbarui" : "Tambah"} Ustadz
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
                  Import Data Ustadz
                </CardTitle>
                <CardDescription>Import data Ustadz dari file CSV</CardDescription>
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
                  <p className="text-sm text-gray-500">Format: nama, kelas, telepon, alamat</p>
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

            {/* Daftar Ustadz */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Daftar Ustadz ({ustadzList.length})
                </CardTitle>
                <CardDescription>Semua Ustadz yang terdaftar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {ustadzList.length === 0 && dataLoaded ? (
                    <p className="text-gray-500 text-center py-4">Belum ada data Ustadz</p>
                  ) : !dataLoaded ? (
                    <p className="text-gray-500 text-center py-4">Loading data...</p>
                  ) : (
                    ustadzList.map((ustadz) => (
                      <div key={ustadz.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg">{ustadz.name}</h3>
                            <Badge variant="secondary" className="mb-2">
                              {ustadz.kelas}
                            </Badge>
                            {ustadz.phone && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Telepon:</span> {ustadz.phone}
                              </p>
                            )}
                            {ustadz.address && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Alamat:</span> {ustadz.address}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(ustadz)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(ustadz.id)}
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

          {/* Ustadz per Kelas */}
          {getAvailableKelas().length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Ustadz per Kelas</CardTitle>
                <CardDescription>Distribusi ustadz di setiap kelas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getAvailableKelas().map((kelas) => (
                    <div key={kelas} className="border rounded-lg p-4">
                      <h3 className="font-medium text-lg mb-2">{kelas}</h3>
                      <Badge variant="outline" className="mb-3">
                        {getUstadzByKelas(kelas).length} Ustadz
                      </Badge>
                      <div className="space-y-1">
                        {getUstadzByKelas(kelas).map((ustadz) => (
                          <p key={ustadz.id} className="text-sm text-gray-600">
                            • {ustadz.name}
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
