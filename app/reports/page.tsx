"use client"

import { useState, useEffect } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, ArrowLeft, Calendar, BookOpen, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { AnimatedCard } from "@/components/animated-card"
import { AnimatedButton } from "@/components/animated-button"
import { FadeIn } from "@/components/fade-in"
import { StaggerContainer, StaggerItem } from "@/components/stagger-container"
import { motion } from "framer-motion"

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

interface MemorizationRecord {
  id: string
  santriId: string
  santriName: string
  halaqoh: string
  date: string
  surah: string
  ayahFrom: number
  ayahTo: number
  quality: "Baik" | "Cukup" | "Kurang"
  notes: string
}

export default function ReportsPage() {
  const { user, hasPermission, isLoading } = useAuth()
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [memorizationRecords, setMemorizationRecords] = useState<MemorizationRecord[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && hasPermission("view_reports")) {
      loadReportsData()
    }
  }, [user, hasPermission])

  const loadReportsData = async () => {
    setLoading(true)
    try {
      const isDemoUser = user?.id?.startsWith("demo-")

      if (isDemoUser) {
        // Load from localStorage for demo users
        const attendanceData = JSON.parse(localStorage.getItem("attendanceData") || "[]")
        const memorizationData = JSON.parse(localStorage.getItem("memorizationData") || "[]")

        setAttendanceRecords(attendanceData)
        setMemorizationRecords(memorizationData)
      } else {
        // Load from Supabase for real users
        const [attendanceResponse, memorizationResponse] = await Promise.all([
          supabase
            .from("attendance")
            .select(`
              *,
              ustadz:ustadz_id (
                name,
                halaqoh
              )
            `)
            .order("created_at", { ascending: false }),
          supabase
            .from("memorization")
            .select(`
              *,
              santri:santri_id (
                name,
                halaqoh
              )
            `)
            .order("created_at", { ascending: false }),
        ])

        if (attendanceResponse.error) {
          console.error("Error loading attendance:", attendanceResponse.error)
        } else {
          // Transform attendance data
          const transformedAttendance: AttendanceRecord[] =
            attendanceResponse.data?.map((record) => ({
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
        }

        if (memorizationResponse.error) {
          console.error("Error loading memorization:", memorizationResponse.error)
        } else {
          // Transform memorization data
          const transformedMemorization: MemorizationRecord[] =
            memorizationResponse.data?.map((record) => ({
              id: record.id,
              santriId: record.santri_id,
              santriName: record.santri?.name || "",
              halaqoh: record.santri?.halaqoh || "",
              date: record.date,
              surah: record.surah,
              ayahFrom: record.ayah_from,
              ayahTo: record.ayah_to,
              quality: record.quality as "Baik" | "Cukup" | "Kurang",
              notes: record.notes || "",
            })) || []

          setMemorizationRecords(transformedMemorization)
        }
      }
    } catch (error) {
      console.error("Error loading reports data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data laporan...</p>
        </motion.div>
      </div>
    )
  }

  if (!user || !hasPermission("view_reports")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </div>
    )
  }

  const getMonthlyAttendance = () => {
    return attendanceRecords.filter((record) => {
      const recordDate = new Date(record.date)
      return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear
    })
  }

  const getMonthlyMemorization = () => {
    return memorizationRecords.filter((record) => {
      const recordDate = new Date(record.date)
      return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear
    })
  }

  const getAttendanceStats = () => {
    const monthlyData = getMonthlyAttendance()
    const totalRecords = monthlyData.length
    const sabaqCount = monthlyData.filter((r) => r.sabaq).length
    const sabqiCount = monthlyData.filter((r) => r.sabqi).length
    const manzilCount = monthlyData.filter((r) => r.manzil).length

    return { totalRecords, sabaqCount, sabqiCount, manzilCount }
  }

  const getMemorizationStats = () => {
    const monthlyData = getMonthlyMemorization()
    const totalRecords = monthlyData.length
    const baikCount = monthlyData.filter((r) => r.quality === "Baik").length
    const cukupCount = monthlyData.filter((r) => r.quality === "Cukup").length
    const kurangCount = monthlyData.filter((r) => r.quality === "Kurang").length

    return { totalRecords, baikCount, cukupCount, kurangCount }
  }

  const getUniqueUstadz = () => {
    const monthlyData = getMonthlyAttendance()
    const uniqueUstadz = new Set(monthlyData.map((r) => r.ustadzName))
    return Array.from(uniqueUstadz)
  }

  const getUniqueSantri = () => {
    const monthlyData = getMonthlyMemorization()
    const uniqueSantri = new Set(monthlyData.map((r) => r.santriName))
    return Array.from(uniqueSantri)
  }

  const exportToCSV = () => {
    const attendanceData = getMonthlyAttendance()
    const memorizationData = getMonthlyMemorization()

    let csvContent = "data:text/csv;charset=utf-8,"

    // Attendance Report
    csvContent += "LAPORAN ABSENSI USTADZ\n"
    csvContent += "Tanggal,Nama Ustadz,Sabaq,Sabqi,Manzil,Catatan\n"

    attendanceData.forEach((record) => {
      csvContent += `${record.date},${record.ustadzName},${record.sabaq ? "Ya" : "Tidak"},${record.sabqi ? "Ya" : "Tidak"},${record.manzil ? "Ya" : "Tidak"},"${record.notes}"\n`
    })

    csvContent += "\n\nLAPORAN HAFALAN SANTRI\n"
    csvContent += "Tanggal,Nama Santri,Halaqoh,Surah,Ayat Dari,Ayat Sampai,Kualitas,Catatan\n"

    memorizationData.forEach((record) => {
      csvContent += `${record.date},${record.santriName},${record.halaqoh},${record.surah},${record.ayahFrom},${record.ayahTo},${record.quality},"${record.notes}"\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `laporan_${selectedMonth + 1}_${selectedYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]

  const attendanceStats = getAttendanceStats()
  const memorizationStats = getMemorizationStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
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
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <FileText className="h-8 w-8" />
                  Laporan Bulanan
                </h1>
                <p className="text-purple-100">Rekap kehadiran Ustadz dan hafalan santri</p>
              </div>
            </div>
          </FadeIn>

          {/* Filter */}
          <FadeIn delay={0.2}>
            <AnimatedCard className="mb-8 border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Filter Laporan
                </CardTitle>
                <CardDescription className="text-indigo-100">Pilih periode laporan yang ingin dilihat</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Bulan</label>
                    <Select
                      value={selectedMonth.toString()}
                      onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
                    >
                      <SelectTrigger className="w-40 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Tahun</label>
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                    >
                      <SelectTrigger className="w-32 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2023, 2024, 2025].map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {hasPermission("export_data") && (
                    <AnimatedButton
                      onClick={exportToCSV}
                      className="h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </AnimatedButton>
                  )}
                </div>
              </CardContent>
            </AnimatedCard>
          </FadeIn>

          {/* Statistics Cards */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: "Total Absensi",
                value: attendanceStats.totalRecords,
                subtitle: `${getUniqueUstadz().length} Ustadz aktif`,
                icon: Calendar,
                gradient: "from-blue-500 to-indigo-600",
              },
              {
                title: "Total Hafalan",
                value: memorizationStats.totalRecords,
                subtitle: `${getUniqueSantri().length} Santri aktif`,
                icon: BookOpen,
                gradient: "from-green-500 to-emerald-600",
              },
              {
                title: "Kualitas Baik",
                value: memorizationStats.baikCount,
                subtitle: `${
                  memorizationStats.totalRecords > 0
                    ? Math.round((memorizationStats.baikCount / memorizationStats.totalRecords) * 100)
                    : 0
                }% dari total`,
                icon: TrendingUp,
                gradient: "from-emerald-500 to-teal-600",
              },
              {
                title: "Kehadiran Sabaq",
                value: attendanceStats.sabaqCount,
                subtitle: `${
                  attendanceStats.totalRecords > 0
                    ? Math.round((attendanceStats.sabaqCount / attendanceStats.totalRecords) * 100)
                    : 0
                }% dari total`,
                icon: Users,
                gradient: "from-purple-500 to-pink-600",
              },
            ].map((stat, index) => (
              <StaggerItem key={index}>
                <AnimatedCard className="border-0 shadow-lg overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${stat.gradient}`}></div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                        <motion.p
                          className="text-3xl font-bold text-gray-900"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 200 }}
                        >
                          {stat.value}
                        </motion.p>
                        <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                      </div>
                      <motion.div
                        className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <stat.icon className="h-6 w-6 text-white" />
                      </motion.div>
                    </div>
                  </CardContent>
                </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Laporan Absensi */}
            <FadeIn delay={0.4}>
              <AnimatedCard className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Laporan Absensi Ustadz
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    {months[selectedMonth]} {selectedYear}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Sabaq", count: attendanceStats.sabaqCount, color: "blue" },
                        { label: "Sabqi", count: attendanceStats.sabqiCount, color: "green" },
                        { label: "Manzil", count: attendanceStats.manzilCount, color: "purple" },
                      ].map((item, index) => (
                        <motion.div
                          key={item.label}
                          className={`bg-${item.color}-50 p-4 rounded-xl text-center`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.6 + index * 0.1, type: "spring", stiffness: 200 }}
                        >
                          <div className={`text-2xl font-bold text-${item.color}-600`}>{item.count}</div>
                          <div className={`text-sm text-${item.color}-600`}>{item.label}</div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Daftar Ustadz Aktif:</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {getUniqueUstadz().length === 0 ? (
                          <p className="text-gray-500 text-center py-4">Tidak ada data ustadz</p>
                        ) : (
                          getUniqueUstadz().map((ustadz, index) => (
                            <motion.div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.8 + index * 0.05 }}
                            >
                              <span className="font-medium">{ustadz}</span>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {getMonthlyAttendance().filter((r) => r.ustadzName === ustadz).length} hari
                              </Badge>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>
            </FadeIn>

            {/* Laporan Hafalan */}
            <FadeIn delay={0.5}>
              <AnimatedCard className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Laporan Hafalan Santri
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    {months[selectedMonth]} {selectedYear}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Baik", count: memorizationStats.baikCount, color: "green" },
                        { label: "Cukup", count: memorizationStats.cukupCount, color: "yellow" },
                        { label: "Kurang", count: memorizationStats.kurangCount, color: "red" },
                      ].map((item, index) => (
                        <motion.div
                          key={item.label}
                          className={`bg-${item.color}-50 p-4 rounded-xl text-center`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.7 + index * 0.1, type: "spring", stiffness: 200 }}
                        >
                          <div className={`text-2xl font-bold text-${item.color}-600`}>{item.count}</div>
                          <div className={`text-sm text-${item.color}-600`}>{item.label}</div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Daftar Santri Aktif:</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {getUniqueSantri().length === 0 ? (
                          <p className="text-gray-500 text-center py-4">Tidak ada data santri</p>
                        ) : (
                          getUniqueSantri().map((santri, index) => (
                            <motion.div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.9 + index * 0.05 }}
                            >
                              <span className="font-medium">{santri}</span>
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {getMonthlyMemorization().filter((r) => r.santriName === santri).length} sesi
                              </Badge>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
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
