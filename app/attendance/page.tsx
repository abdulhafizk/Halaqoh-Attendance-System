"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, ArrowLeft, CheckCircle, Save } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Navbar } from "@/components/navbar"
import { supabase, type Ustadz } from "@/lib/supabase-client"

interface AttendanceRecord {
  id: string
  ustadzId: string
  ustadzName: string
  date: string
  sabaq: boolean
  sabqi: boolean
  manzil: boolean
  notes: string
}

export default function AttendancePage() {
  const { user, hasPermission, isLoading } = useAuth()

  const [ustadzList, setUstadzList] = useState<Ustadz[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [selectedUstadz, setSelectedUstadz] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [attendance, setAttendance] = useState({
    sabaq: false,
    sabqi: false,
    manzil: false,
  })
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (user && hasPermission("manage_attendance")) {
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
        const ustadzData = JSON.parse(localStorage.getItem("ustadzData") || "[]")
        const attendanceData = JSON.parse(localStorage.getItem("attendanceData") || "[]")
        setUstadzList(ustadzData)
        setAttendanceRecords(attendanceData)
      } else {
        // Load data from Supabase for real users
        try {
          const { data: ustadzData } = await supabase
            .from("ustadz")
            .select("*")
            .order("created_at", { ascending: false })
          const { data: attendanceData } = await supabase
            .from("attendance")
            .select(`
              *,
              ustadz:ustadz_id (
                name,
                halaqoh
              )
            `)
            .order("created_at", { ascending: false })

          setUstadzList(ustadzData || [])

          // Transform attendance data to match interface
          const transformedAttendance =
            attendanceData?.map((record) => ({
              id: record.id,
              ustadzId: record.ustadz_id,
              ustadzName: record.ustadz?.name || "",
              date: record.date,
              sabaq: record.sabaq,
              sabqi: record.sabqi,
              manzil: record.manzil,
              notes: record.notes || "",
            })) || []

          setAttendanceRecords(transformedAttendance)
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
    const attendanceChannel = supabase
      .channel("attendance_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, (payload) => {
        console.log("Attendance real-time update:", payload)
        loadAttendanceData()
      })
      .subscribe()

    const ustadzChannel = supabase
      .channel("ustadz_changes_attendance")
      .on("postgres_changes", { event: "*", schema: "public", table: "ustadz" }, (payload) => {
        console.log("Ustadz real-time update:", payload)
        loadUstadzData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(attendanceChannel)
      supabase.removeChannel(ustadzChannel)
    }
  }, [])

  const loadAttendanceData = async () => {
    const isDemoUser = user?.id?.startsWith("demo-")
    if (!isDemoUser) {
      try {
        const { data } = await supabase
          .from("attendance")
          .select(`
            *,
            ustadz:ustadz_id (
              name,
              halaqoh
            )
          `)
          .order("created_at", { ascending: false })

        const transformedAttendance =
          data?.map((record) => ({
            id: record.id,
            ustadzId: record.ustadz_id,
            ustadzName: record.ustadz?.name || "",
            date: record.date,
            sabaq: record.sabaq,
            sabqi: record.sabqi,
            manzil: record.manzil,
            notes: record.notes || "",
          })) || []

        setAttendanceRecords(transformedAttendance)
      } catch (error) {
        console.error("Error loading attendance:", error)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!hasAccess) {
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

  const handleSubmitAttendance = async () => {
    if (!selectedUstadz) return

    setIsSaving(true)

    try {
      const isDemoUser = user?.id?.startsWith("demo-")

      if (isDemoUser) {
        // Handle demo user with localStorage
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const ustadz = ustadzList.find((u) => u.id === selectedUstadz)
        if (!ustadz) return

        const newRecord: AttendanceRecord = {
          id: `demo-${Date.now()}`,
          ustadzId: selectedUstadz,
          ustadzName: ustadz.name,
          date: selectedDate,
          sabaq: attendance.sabaq,
          sabqi: attendance.sabqi,
          manzil: attendance.manzil,
          notes,
        }

        const updatedRecords = [...attendanceRecords, newRecord]
        setAttendanceRecords(updatedRecords)
        localStorage.setItem("attendanceData", JSON.stringify(updatedRecords))
      } else {
        // Handle real Supabase user
        const { error } = await supabase.from("attendance").insert([
          {
            ustadz_id: selectedUstadz,
            date: selectedDate,
            sabaq: attendance.sabaq,
            sabqi: attendance.sabqi,
            manzil: attendance.manzil,
            notes: notes,
          },
        ])

        if (error) {
          console.error("Error inserting attendance:", error)
          alert("Gagal menyimpan absensi: " + error.message)
          return
        }

        // Data will be automatically updated via real-time subscription
      }

      // Reset form
      setSelectedUstadz("")
      setAttendance({ sabaq: false, sabqi: false, manzil: false })
      setNotes("")

      alert("Absensi berhasil disimpan!")
    } catch (error) {
      console.error("Error submitting attendance:", error)
      alert("Terjadi kesalahan")
    } finally {
      setIsSaving(false)
    }
  }

  const getTodayAttendance = () => {
    const today = new Date().toDateString()
    return attendanceRecords.filter((record) => new Date(record.date).toDateString() === today)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Navbar />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-4 hover:bg-white/50 rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            </Link>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Calendar className="h-8 w-8" />
                Absensi Ustadz
              </h1>
              <p className="text-emerald-100">Catat kehadiran Ustadz untuk Sabaq, Sabqi, dan Manzil</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Absensi */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Form Absensi
                </CardTitle>
                <CardDescription className="text-emerald-100">Isi absensi Ustadz untuk hari ini</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ustadz" className="text-sm font-semibold text-gray-700">
                    Pilih Ustadz
                  </Label>
                  <Select value={selectedUstadz} onValueChange={setSelectedUstadz}>
                    <SelectTrigger className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue placeholder="Pilih Ustadz" />
                    </SelectTrigger>
                    <SelectContent>
                      {ustadzList.map((ustadz) => (
                        <SelectItem key={ustadz.id} value={ustadz.id}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <User className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <div className="font-medium">{ustadz.name}</div>
                              <div className="text-xs text-gray-500">{ustadz.halaqoh}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-semibold text-gray-700">
                    Tanggal
                  </Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-gray-700">Waktu Kehadiran</Label>
                  <div className="space-y-3">
                    {[
                      { key: "sabaq", label: "Sabaq (Hafalan Baru)", color: "emerald" },
                      { key: "sabqi", label: "Sabqi (Muraja'ah Dekat)", color: "blue" },
                      { key: "manzil", label: "Manzil (Muraja'ah Jauh)", color: "purple" },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <input
                          type="checkbox"
                          id={item.key}
                          checked={attendance[item.key as keyof typeof attendance]}
                          onChange={(e) => setAttendance((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                          className={`w-5 h-5 text-${item.color}-600 bg-gray-100 border-gray-300 rounded focus:ring-${item.color}-500 focus:ring-2`}
                        />
                        <Label htmlFor={item.key} className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                          {item.label}
                        </Label>
                        {attendance[item.key as keyof typeof attendance] && (
                          <CheckCircle className={`h-5 w-5 text-${item.color}-600`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                    Catatan (Opsional)
                  </Label>
                  <Input
                    placeholder="Tambahkan catatan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <Button
                  onClick={handleSubmitAttendance}
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={!selectedUstadz || isSaving}
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Simpan Absensi
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Absensi Hari Ini */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Absensi Hari Ini
                </CardTitle>
                <CardDescription className="text-blue-100">Daftar Ustadz yang sudah absen hari ini</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {getTodayAttendance().length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Belum ada absensi hari ini</p>
                    </div>
                  ) : (
                    getTodayAttendance().map((record) => (
                      <div
                        key={record.id}
                        className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">{record.ustadzName}</span>
                              <p className="text-sm text-gray-500">
                                {new Date(record.date).toLocaleDateString("id-ID")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap mb-3">
                          {record.sabaq && (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Sabaq</Badge>
                          )}
                          {record.sabqi && <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Sabqi</Badge>}
                          {record.manzil && (
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Manzil</Badge>
                          )}
                        </div>
                        {record.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">{record.notes}</p>
                        )}
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
