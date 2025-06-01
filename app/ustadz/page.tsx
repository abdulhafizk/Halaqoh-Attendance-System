"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Plus, Edit, Trash2, ArrowLeft } from "lucide-react"
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
    halaqoh: "",
    phone: "",
    address: "",
  })
  const [loading, setLoading] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (user && hasPermission("manage_ustadz")) {
      setHasAccess(true)
    } else {
      setHasAccess(false)
    }
  }, [user, hasPermission])

  useEffect(() => {
    loadUstadz()
  }, [])

  // Set up real-time subscription
  useEffect(() => {
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
  }, [])

  const loadUstadz = async () => {
    try {
      const isDemoUser = user?.id?.startsWith("demo-")

      if (isDemoUser) {
        // Load from localStorage for demo users
        const ustadzData = JSON.parse(localStorage.getItem("ustadzData") || "[]")
        setUstadzList(ustadzData)
      } else {
        // Load from Supabase for real users
        const { data, error } = await supabase.from("ustadz").select("*").order("created_at", { ascending: false })

        if (error) {
          console.error("Error loading ustadz:", error)
          return
        }

        setUstadzList(data || [])
      }
    } catch (error) {
      console.error("Error loading ustadz:", error)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.halaqoh) {
      alert("Nama dan Halaqoh wajib diisi!")
      return
    }

    setLoading(true)

    try {
      const isDemoUser = user?.id?.startsWith("demo-")

      if (isDemoUser) {
        // Handle demo user with localStorage
        let updatedList: Ustadz[]

        if (isEditing) {
          updatedList = ustadzList.map((ustadz) =>
            ustadz.id === editingId
              ? {
                  ...ustadz,
                  name: formData.name,
                  halaqoh: formData.halaqoh,
                  phone: formData.phone,
                  address: formData.address,
                  updated_at: new Date().toISOString(),
                }
              : ustadz,
          )
        } else {
          const newUstadz: Ustadz = {
            id: `demo-${Date.now()}`,
            name: formData.name,
            halaqoh: formData.halaqoh,
            phone: formData.phone || "",
            address: formData.address || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          updatedList = [...ustadzList, newUstadz]
        }

        setUstadzList(updatedList)
        localStorage.setItem("ustadzData", JSON.stringify(updatedList))

        alert(isEditing ? "Data Ustadz berhasil diperbarui!" : "Ustadz baru berhasil ditambahkan!")
      } else {
        // Handle real Supabase user
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
            alert("Gagal memperbarui data ustadz: " + error.message)
            return
          }

          alert("Data Ustadz berhasil diperbarui!")
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
            alert("Gagal menambahkan ustadz baru: " + error.message)
            return
          }

          alert("Ustadz baru berhasil ditambahkan!")
        }

        // Data will be automatically updated via real-time subscription
      }

      // Reset form
      setFormData({ name: "", halaqoh: "", phone: "", address: "" })
      setIsEditing(false)
      setEditingId("")
    } catch (error) {
      console.error("Error submitting ustadz:", error)
      alert("Terjadi kesalahan")
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
  }

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data Ustadz ini?")) {
      try {
        const isDemoUser = user?.id?.startsWith("demo-")

        if (isDemoUser) {
          // Handle demo user with localStorage
          const updatedList = ustadzList.filter((ustadz) => ustadz.id !== id)
          setUstadzList(updatedList)
          localStorage.setItem("ustadzData", JSON.stringify(updatedList))
          alert("Data Ustadz berhasil dihapus!")
        } else {
          // Handle real Supabase user
          const { error } = await supabase.from("ustadz").delete().eq("id", id)

          if (error) {
            console.error("Error deleting ustadz:", error)
            alert("Gagal menghapus data ustadz: " + error.message)
            return
          }

          alert("Data Ustadz berhasil dihapus!")
          // Data will be automatically updated via real-time subscription
        }
      } catch (error) {
        console.error("Error deleting ustadz:", error)
        alert("Terjadi kesalahan")
      }
    }
  }

  const handleCancel = () => {
    setFormData({ name: "", halaqoh: "", phone: "", address: "" })
    setIsEditing(false)
    setEditingId("")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
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
            <p className="text-gray-600">Kelola data Ustadz pengampu Halaqoh</p>
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
                  {isEditing ? "Perbarui data Ustadz" : "Tambahkan Ustadz pengampu Halaqoh baru"}
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
                  <Label htmlFor="halaqoh">Halaqoh *</Label>
                  <Input
                    placeholder="Contoh: Halaqoh A, Halaqoh B"
                    value={formData.halaqoh}
                    onChange={(e) => setFormData((prev) => ({ ...prev, halaqoh: e.target.value }))}
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
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    disabled={!formData.name || !formData.halaqoh || loading}
                  >
                    {loading ? "Menyimpan..." : isEditing ? "Perbarui" : "Tambah"} Ustadz
                  </Button>
                  {isEditing && (
                    <Button onClick={handleCancel} variant="outline" className="flex-1">
                      Batal
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Daftar Ustadz */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Daftar Ustadz ({ustadzList.length})
                </CardTitle>
                <CardDescription>Semua Ustadz yang terdaftar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {ustadzList.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Belum ada data Ustadz</p>
                  ) : (
                    ustadzList.map((ustadz) => (
                      <div key={ustadz.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg">{ustadz.name}</h3>
                            <Badge variant="secondary" className="mb-2">
                              {ustadz.halaqoh}
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
        </div>
      </div>
    </div>
  )
}
