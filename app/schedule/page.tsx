"use client"

import { useState, useEffect } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Clock, Plus, Edit, Trash2, ArrowLeft, MapPin } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { AnimatedCard } from "@/components/animated-card"
import { AnimatedButton } from "@/components/animated-button"
import { FadeIn } from "@/components/fade-in"
import { StaggerContainer, StaggerItem } from "@/components/stagger-container"
import { motion } from "framer-motion"

interface Schedule {
  id: string
  halaqoh: string
  day: string
  sabaqTime: string
  sabqiTime: string
  manzilTime: string
  location: string
  notes: string
}

interface Ustadz {
  id: string
  name: string
  halaqoh: string
}

export default function SchedulePage() {
  const { user, hasPermission, isLoading } = useAuth()

  const [scheduleList, setScheduleList] = useState<Schedule[]>([])
  const [ustadzList, setUstadzList] = useState<Ustadz[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    halaqoh: "",
    day: "",
    sabaqTime: "",
    sabqiTime: "",
    manzilTime: "",
    location: "",
    notes: "",
  })

  useEffect(() => {
    if (user && hasPermission("manage_schedule")) {
      loadData()
    }
  }, [user, hasPermission])

  const loadData = async () => {
    try {
      const isDemoUser = user?.id?.startsWith("demo-")

      if (isDemoUser) {
        // Load from localStorage for demo users
        const scheduleData = JSON.parse(localStorage.getItem("scheduleData") || "[]")
        const ustadzData = JSON.parse(localStorage.getItem("ustadzData") || "[]")

        setScheduleList(scheduleData)
        setUstadzList(ustadzData)
      } else {
        // Load from Supabase for real users
        const [scheduleResponse, ustadzResponse] = await Promise.all([
          supabase.from("schedule").select("*").order("created_at", { ascending: false }),
          supabase.from("ustadz").select("*").order("created_at", { ascending: false }),
        ])

        if (scheduleResponse.error) {
          console.error("Error loading schedule:", scheduleResponse.error)
          setError("Gagal memuat data jadwal")
        } else {
          // Transform schedule data
          const transformedSchedule: Schedule[] =
            scheduleResponse.data?.map((record) => ({
              id: record.id,
              halaqoh: record.halaqoh,
              day: record.day,
              sabaqTime: record.sabaq_time || "",
              sabqiTime: record.sabqi_time || "",
              manzilTime: record.manzil_time || "",
              location: record.location || "",
              notes: record.notes || "",
            })) || []

          setScheduleList(transformedSchedule)
        }

        if (ustadzResponse.error) {
          console.error("Error loading ustadz:", ustadzResponse.error)
        } else {
          setUstadzList(ustadzResponse.data || [])
        }
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Terjadi kesalahan saat memuat data")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data jadwal...</p>
        </motion.div>
      </div>
    )
  }

  if (!user || !hasPermission("manage_schedule")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!formData.halaqoh || !formData.day) {
      setError("Halaqoh dan Hari wajib diisi!")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const isDemoUser = user?.id?.startsWith("demo-")

      if (isDemoUser) {
        // Handle demo user with localStorage
        let updatedList: Schedule[]

        if (isEditing) {
          updatedList = scheduleList.map((schedule) =>
            schedule.id === editingId ? { ...schedule, ...formData } : schedule,
          )
        } else {
          const newSchedule: Schedule = {
            id: `demo-${Date.now()}`,
            ...formData,
          }
          updatedList = [...scheduleList, newSchedule]
        }

        setScheduleList(updatedList)
        localStorage.setItem("scheduleData", JSON.stringify(updatedList))

        setSuccess(isEditing ? "Jadwal berhasil diperbarui!" : "Jadwal baru berhasil ditambahkan!")
      } else {
        // Handle real Supabase user
        if (isEditing) {
          const { error } = await supabase
            .from("schedule")
            .update({
              halaqoh: formData.halaqoh,
              day: formData.day,
              sabaq_time: formData.sabaqTime,
              sabqi_time: formData.sabqiTime,
              manzil_time: formData.manzilTime,
              location: formData.location,
              notes: formData.notes,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editingId)

          if (error) {
            console.error("Error updating schedule:", error)
            setError("Gagal memperbarui jadwal: " + error.message)
            return
          }

          setSuccess("Jadwal berhasil diperbarui!")
        } else {
          const { error } = await supabase.from("schedule").insert([
            {
              halaqoh: formData.halaqoh,
              day: formData.day,
              sabaq_time: formData.sabaqTime,
              sabqi_time: formData.sabqiTime,
              manzil_time: formData.manzilTime,
              location: formData.location,
              notes: formData.notes,
            },
          ])

          if (error) {
            console.error("Error inserting schedule:", error)
            setError("Gagal menambahkan jadwal: " + error.message)
            return
          }

          setSuccess("Jadwal baru berhasil ditambahkan!")
        }

        // Reload data
        await loadData()
      }

      // Reset form
      setFormData({ halaqoh: "", day: "", sabaqTime: "", sabqiTime: "", manzilTime: "", location: "", notes: "" })
      setIsEditing(false)
      setEditingId("")
    } catch (error) {
      console.error("Error submitting schedule:", error)
      setError("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (schedule: Schedule) => {
    setFormData({
      halaqoh: schedule.halaqoh,
      day: schedule.day,
      sabaqTime: schedule.sabaqTime,
      sabqiTime: schedule.sabqiTime,
      manzilTime: schedule.manzilTime,
      location: schedule.location,
      notes: schedule.notes,
    })
    setIsEditing(true)
    setEditingId(schedule.id)
    setError("")
    setSuccess("")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) return

    try {
      const isDemoUser = user?.id?.startsWith("demo-")

      if (isDemoUser) {
        // Handle demo user with localStorage
        const updatedList = scheduleList.filter((schedule) => schedule.id !== id)
        setScheduleList(updatedList)
        localStorage.setItem("scheduleData", JSON.stringify(updatedList))
        setSuccess("Jadwal berhasil dihapus!")
      } else {
        // Handle real Supabase user
        const { error } = await supabase.from("schedule").delete().eq("id", id)

        if (error) {
          console.error("Error deleting schedule:", error)
          setError("Gagal menghapus jadwal: " + error.message)
          return
        }

        setSuccess("Jadwal berhasil dihapus!")
        await loadData()
      }
    } catch (error) {
      console.error("Error deleting schedule:", error)
      setError("Terjadi kesalahan saat menghapus jadwal")
    }
  }

  const handleCancel = () => {
    setFormData({ halaqoh: "", day: "", sabaqTime: "", sabqiTime: "", manzilTime: "", location: "", notes: "" })
    setIsEditing(false)
    setEditingId("")
    setError("")
    setSuccess("")
  }

  const getAvailableHalaqoh = () => {
    const halaqohList = ustadzList.map((ustadz) => ustadz.halaqoh)
    return [...new Set(halaqohList)]
  }

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

  const getScheduleByDay = (day: string) => {
    return scheduleList.filter((schedule) => schedule.day === day)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
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
              <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Calendar className="h-8 w-8" />
                  Jadwal Halaqoh
                </h1>
                <p className="text-red-100">Atur jadwal dan waktu pelaksanaan Halaqoh</p>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Input/Edit */}
            <FadeIn delay={0.2}>
              <AnimatedCard className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    {isEditing ? "Edit Jadwal" : "Tambah Jadwal Baru"}
                  </CardTitle>
                  <CardDescription className="text-red-100">
                    {isEditing ? "Perbarui jadwal Halaqoh" : "Buat jadwal Halaqoh baru"}
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
                    <Label htmlFor="halaqoh" className="text-sm font-semibold text-gray-700">
                      Halaqoh *
                    </Label>
                    <Select
                      value={formData.halaqoh}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, halaqoh: value }))}
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500">
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
                    <Label htmlFor="day" className="text-sm font-semibold text-gray-700">
                      Hari *
                    </Label>
                    <Select
                      value={formData.day}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, day: value }))}
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500">
                        <SelectValue placeholder="Pilih Hari" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sabaqTime" className="text-sm font-semibold text-gray-700">
                        Waktu Sabaq
                      </Label>
                      <Input
                        type="time"
                        value={formData.sabaqTime}
                        onChange={(e) => setFormData((prev) => ({ ...prev, sabaqTime: e.target.value }))}
                        className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sabqiTime" className="text-sm font-semibold text-gray-700">
                        Waktu Sabqi
                      </Label>
                      <Input
                        type="time"
                        value={formData.sabqiTime}
                        onChange={(e) => setFormData((prev) => ({ ...prev, sabqiTime: e.target.value }))}
                        className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manzilTime" className="text-sm font-semibold text-gray-700">
                        Waktu Manzil
                      </Label>
                      <Input
                        type="time"
                        value={formData.manzilTime}
                        onChange={(e) => setFormData((prev) => ({ ...prev, manzilTime: e.target.value }))}
                        className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-semibold text-gray-700">
                      Lokasi
                    </Label>
                    <Input
                      placeholder="Contoh: Masjid Al-Ikhlas"
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                      Catatan
                    </Label>
                    <Input
                      placeholder="Catatan tambahan"
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <AnimatedButton
                      onClick={handleSubmit}
                      className="flex-1 h-12 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-xl"
                      disabled={!formData.halaqoh || !formData.day || loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {isEditing ? "Memperbarui..." : "Menyimpan..."}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          {isEditing ? "Perbarui" : "Tambah"} Jadwal
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

            {/* Daftar Jadwal */}
            <FadeIn delay={0.3}>
              <AnimatedCard className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Daftar Jadwal ({scheduleList.length})
                  </CardTitle>
                  <CardDescription className="text-indigo-100">Semua jadwal Halaqoh</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {scheduleList.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Belum ada jadwal</p>
                      </div>
                    ) : (
                      scheduleList.map((schedule, index) => (
                        <motion.div
                          key={schedule.id}
                          className="border rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <h3 className="font-semibold text-lg text-gray-900">{schedule.halaqoh}</h3>
                                <Badge variant="secondary" className="bg-red-100 text-red-800">
                                  {schedule.day}
                                </Badge>
                              </div>

                              <div className="space-y-2 text-sm">
                                {schedule.sabaqTime && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="h-3 w-3" />
                                    <span>Sabaq: {schedule.sabaqTime}</span>
                                  </div>
                                )}
                                {schedule.sabqiTime && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="h-3 w-3" />
                                    <span>Sabqi: {schedule.sabqiTime}</span>
                                  </div>
                                )}
                                {schedule.manzilTime && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="h-3 w-3" />
                                    <span>Manzil: {schedule.manzilTime}</span>
                                  </div>
                                )}
                                {schedule.location && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="h-3 w-3" />
                                    <span>{schedule.location}</span>
                                  </div>
                                )}
                                {schedule.notes && (
                                  <p className="text-gray-600 bg-gray-50 p-2 rounded-lg">
                                    <span className="font-medium">Catatan:</span> {schedule.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(schedule)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(schedule.id)}
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

          {/* Jadwal Mingguan */}
          <FadeIn delay={0.4}>
            <AnimatedCard className="mt-8 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Jadwal Mingguan
                </CardTitle>
                <CardDescription>Ringkasan jadwal Halaqoh per hari</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                  {days.map((day, dayIndex) => (
                    <StaggerItem key={day}>
                      <div className="border-2 border-gray-100 rounded-xl p-4 hover:border-red-200 transition-colors">
                        <h3 className="font-semibold text-lg mb-3 text-center text-gray-900">{day}</h3>
                        <div className="space-y-2">
                          {getScheduleByDay(day).length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-4">Tidak ada jadwal</p>
                          ) : (
                            getScheduleByDay(day).map((schedule, index) => (
                              <motion.div
                                key={schedule.id}
                                className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-3 border border-red-100"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: dayIndex * 0.1 + index * 0.05 }}
                              >
                                <p className="font-medium text-sm text-gray-900 mb-1">{schedule.halaqoh}</p>
                                {schedule.sabaqTime && (
                                  <p className="text-xs text-gray-600">Sabaq: {schedule.sabaqTime}</p>
                                )}
                                {schedule.sabqiTime && (
                                  <p className="text-xs text-gray-600">Sabqi: {schedule.sabqiTime}</p>
                                )}
                                {schedule.manzilTime && (
                                  <p className="text-xs text-gray-600">Manzil: {schedule.manzilTime}</p>
                                )}
                              </motion.div>
                            ))
                          )}
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </CardContent>
            </AnimatedCard>
          </FadeIn>
        </div>
      </div>
    </div>
  )
}
