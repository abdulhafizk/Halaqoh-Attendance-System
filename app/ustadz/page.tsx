"use client"

import { useState, useEffect, useRef } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Plus, Edit, Trash2, ArrowLeft, Upload, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Navbar } from "@/components/navbar"
import { supabase, type Ustadz } from "@/lib/supabase-client"
import { AnimatedCard } from "@/components/animated-card"
import { AnimatedButton } from "@/components/animated-button"
import { FadeIn } from "@/components/fade-in"
import { StaggerContainer, StaggerItem } from "@/components/stagger-container"
import { motion } from "framer-motion"

export default function UstadzPage() {
  const { user, hasPermission, isLoading } = useAuth()

  const [ustadzList, setUstadzList] = useState<Ustadz[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    halaqoh: "",
    phone: "",
    address: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isOnline, setIsOnline] = useState(true)

  const [importing, setImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    if (user && hasPermission("manage_ustadz")) {
      loadUstadz()
    }
  }, [user, hasPermission])

  // Set up real-time subscription for all users
  useEffect(() => {
    if (user && hasPermission("manage_ustadz")) {
      const channel = supabase
        .channel("ustadz_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "ustadz" }, (payload) => {
          console.log("Real-time update:", payload)
          loadUstadz() // Reload data when changes occur
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, hasPermission])

  const loadUstadz = async () => {
    try {
      const { data, error } = await supabase.from("ustadz").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading ustadz:", error)
        setError("Gagal memuat data ustadz: " + error.message)
        return
      }

      setUstadzList(data || [])
    } catch (error) {
      console.error("Error loading ustadz:", error)
      setError("Terjadi kesalahan saat memuat data")
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.halaqoh) {
      setError("Nama dan Halaqoh wajib diisi!")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("ustadz")
          .update({
            name: formData.name,
            halaqoh: formData.halaqoh,
            phone: formData.phone,
            address: formData.address,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId)

        if (error) {
          console.error("Error updating ustadz:", error)
          setError("Gagal memperbarui data ustadz: " + error.message)
          return
        }

        setSuccess("Data Ustadz berhasil diperbarui!")
      } else {
        const { error } = await supabase.from("ustadz").insert([
          {
            name: formData.name,
            halaqoh: formData.halaqoh,
            phone: formData.phone,
            address: formData.address,
          },
        ])

        if (error) {
          console.error("Error inserting ustadz:", error)
          setError("Gagal menambahkan ustadz baru: " + error.message)
          return
        }

        setSuccess("Ustadz baru berhasil ditambahkan!")
      }

      // Reset form
      setFormData({ name: "", halaqoh: "", phone: "", address: "" })
      setIsEditing(false)
      setEditingId("")

      // Data will be automatically updated via real-time subscription
    } catch (error) {
      console.error("Error submitting ustadz:", error)
      setError("Terjadi kesalahan saat menyimpan data")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (ustadz: Ustadz) => {
    setFormData({
      name: ustadz.name,
      halaqoh: ustadz.halaqoh,
      phone: ustadz.phone || "",
      address: ustadz.address || "",
    })
    setIsEditing(true)
    setEditingId(ustadz.id)
    setError("")
    setSuccess("")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data Ustadz ini?")) return

    try {
      const { error } = await supabase.from("ustadz").delete().eq("id", id)

      if (error) {
        console.error("Error deleting ustadz:", error)
        setError("Gagal menghapus data ustadz: " + error.message)
        return
      }

      setSuccess("Data Ustadz berhasil dihapus!")
      // Data will be automatically updated via real-time subscription
    } catch (error) {
      console.error("Error deleting ustadz:", error)
      setError("Terjadi kesalahan saat menghapus data")
    }
  }

  const handleCancel = () => {
    setFormData({ name: "", halaqoh: "", phone: "", address: "" })
    setIsEditing(false)
    setEditingId("")
    setError("")
    setSuccess("")
  }

  const handleImport = async () => {
    if (!importFile) {
      setError("Silakan pilih file CSV terlebih dahulu!")
      return
    }

    setImporting(true)
    setError("")
    setSuccess("")

    try {
      const text = await importFile.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        setError("File CSV harus memiliki header dan minimal 1 data!")
        return
      }

      // Parse CSV
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
      const requiredHeaders = ["nama", "halaqoh"]

      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))
      if (missingHeaders.length > 0) {
        setError(
          `Header yang diperlukan: ${requiredHeaders.join(", ")}\nHeader yang hilang: ${missingHeaders.join(", ")}`,
        )
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
          halaqoh: rowData.halaqoh,
          phone: rowData.telepon || rowData.phone || "",
          address: rowData.alamat || rowData.address || "",
        })
      }

      const { error } = await supabase.from("ustadz").insert(importedData)

      if (error) {
        console.error("Error importing ustadz:", error)
        setError("Gagal mengimpor data: " + error.message)
        return
      }

      setSuccess(`Berhasil mengimpor ${importedData.length} data Ustadz!`)
      setImportFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Data will be automatically updated via real-time subscription
    } catch (error) {
      console.error("Error importing:", error)
      setError("Gagal mengimpor data. Pastikan format CSV benar.")
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,nama,halaqoh,telepon,alamat\nUstadz Ahmad,Halaqoh A,08123456789,Jl. Contoh No. 1\nUstadz Budi,Halaqoh B,08987654321,Jl. Contoh No. 2"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "template_ustadz.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data ustadz...</p>
        </motion.div>
      </div>
    )
  }

  if (!user || !hasPermission("manage_ustadz")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <Navbar />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <FadeIn delay={0.1}>
            <div className="mb-8">
              <Link href="/">
                <Button variant="ghost" className="mb-4 hover:bg-white/50 rounded-xl">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke Dashboard
                </Button>
              </Link>
              <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                      <User className="h-8 w-8" />
                      Data Ustadz
                    </h1>
                    <p className="text-orange-100">Kelola data Ustadz pengampu Halaqoh</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOnline ? (
                      <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-lg">
                        <Wifi className="h-4 w-4" />
                        <span className="text-sm">Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-lg">
                        <WifiOff className="h-4 w-4" />
                        <span className="text-sm">Offline</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Statistics */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StaggerItem>
              <AnimatedCard className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Ustadz</p>
                      <motion.p
                        className="text-3xl font-bold text-gray-900"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                      >
                        {ustadzList.length}
                      </motion.p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>
            </StaggerItem>

            <StaggerItem>
              <AnimatedCard className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Halaqoh</p>
                      <motion.p
                        className="text-3xl font-bold text-gray-900"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                      >
                        {new Set(ustadzList.map((u) => u.halaqoh)).size}
                      </motion.p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>
            </StaggerItem>

            <StaggerItem>
              <AnimatedCard className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Status Sinkronisasi</p>
                      <p className="text-lg font-bold text-green-600">Real-time</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Wifi className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>
            </StaggerItem>
          </StaggerContainer>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Input/Edit */}
            <FadeIn delay={0.2}>
              <AnimatedCard className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    {isEditing ? "Edit Ustadz" : "Tambah Ustadz Baru"}
                  </CardTitle>
                  <CardDescription className="text-orange-100">
                    {isEditing ? "Perbarui data Ustadz" : "Tambahkan Ustadz pengampu Halaqoh baru"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-700">{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                      Nama Ustadz *
                    </Label>
                    <Input
                      placeholder="Masukkan nama lengkap"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="halaqoh" className="text-sm font-semibold text-gray-700">
                      Halaqoh *
                    </Label>
                    <Input
                      placeholder="Contoh: Halaqoh A, Halaqoh B"
                      value={formData.halaqoh}
                      onChange={(e) => setFormData((prev) => ({ ...prev, halaqoh: e.target.value }))}
                      className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                      No. Telepon
                    </Label>
                    <Input
                      placeholder="Contoh: 08123456789"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                      Alamat
                    </Label>
                    <Input
                      placeholder="Alamat lengkap"
                      value={formData.address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                      className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <AnimatedButton
                      onClick={handleSubmit}
                      className="flex-1 h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-xl"
                      disabled={!formData.name || !formData.halaqoh || loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {isEditing ? "Memperbarui..." : "Menyimpan..."}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          {isEditing ? "Perbarui" : "Tambah"} Ustadz
                        </div>
                      )}
                    </AnimatedButton>
                    {isEditing && (
                      <AnimatedButton onClick={handleCancel} variant="outline" className="flex-1 h-12 rounded-xl">
                        Batal
                      </AnimatedButton>
                    )}
                  </div>
                </CardContent>
              </AnimatedCard>
            </FadeIn>

            {/* Import Section */}
            <FadeIn delay={0.3}>
              <AnimatedCard className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import Data Ustadz
                  </CardTitle>
                  <CardDescription className="text-green-100">Import data Ustadz dari file CSV</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="csvFile" className="text-sm font-semibold text-gray-700">
                      File CSV
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-green-500"
                    />
                    <p className="text-sm text-gray-500">Format: nama, halaqoh, telepon, alamat</p>
                  </div>

                  <div className="flex gap-3">
                    <AnimatedButton
                      onClick={handleImport}
                      className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl"
                      disabled={!importFile || importing}
                    >
                      {importing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Mengimpor...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Import Data
                        </div>
                      )}
                    </AnimatedButton>
                    <AnimatedButton onClick={downloadTemplate} variant="outline" className="flex-1 h-12 rounded-xl">
                      Download Template
                    </AnimatedButton>
                  </div>
                </CardContent>
              </AnimatedCard>
            </FadeIn>

            {/* Daftar Ustadz */}
            <FadeIn delay={0.4}>
              <AnimatedCard className="lg:col-span-2 border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Daftar Ustadz ({ustadzList.length})
                  </CardTitle>
                  <CardDescription className="text-blue-100">Semua Ustadz yang terdaftar (Real-time)</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {ustadzList.length === 0 ? (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Belum ada data Ustadz</p>
                      </div>
                    ) : (
                      ustadzList.map((ustadz, index) => (
                        <motion.div
                          key={ustadz.id}
                          className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                  <User className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg text-gray-900">{ustadz.name}</h3>
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    {ustadz.halaqoh}
                                  </Badge>
                                </div>
                              </div>
                              {ustadz.phone && (
                                <p className="text-sm text-gray-600 mb-1">
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
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </AnimatedCard>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  )
}
