"use client"

import { useState, useEffect, useRef } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, ArrowLeft, Calendar, BookOpen, Users, Save, FileDown, Filter, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Navbar } from "@/components/navbar"
import { supabase } from "@/lib/supabase"
import { AnimatedCard } from "@/components/animated-card"
import { AnimatedButton } from "@/components/animated-button"
import { FadeIn } from "@/components/fade-in"
import { StaggerContainer, StaggerItem } from "@/components/stagger-container"
import { motion } from "framer-motion"

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

interface SantriRecap {
  santriId: string
  santriName: string
  halaqoh: string
  totalSetoranBulan: number
  totalHafalanBulan: number
  averageQuality: number
  qualityDistribution: {
    baik: number
    cukup: number
    kurang: number
  }
  notes: string
}

interface HalaqohSummary {
  halaqoh: string
  totalSantri: number
  totalSetoran: number
  totalHafalan: number
  averageQuality: number
  activeSantri: number
}

export default function MemorizationRecapPage() {
  const { user, hasPermission, isLoading } = useAuth()
  const [memorizationRecords, setMemorizationRecords] = useState<MemorizationRecord[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedHalaqoh, setSelectedHalaqoh] = useState("all")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user && hasPermission("view_reports")) {
      loadMemorizationData()
    }
  }, [user, hasPermission, selectedMonth, selectedYear])

  const loadMemorizationData = async () => {
    setLoading(true)
    try {
      const isDemoUser = user?.id?.startsWith("demo-")

      if (isDemoUser) {
        // Load from localStorage for demo users
        const memorizationData = JSON.parse(localStorage.getItem("memorizationData") || "[]")
        setMemorizationRecords(memorizationData)
      } else {
        // Load from Supabase for real users
        const { data, error } = await supabase
          .from("memorization")
          .select(`
            *,
            santri:santri_id (
              name,
              halaqoh
            )
          `)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error loading memorization:", error)
          setError("Gagal memuat data hafalan")
          return
        }

        // Transform memorization data
        const transformedMemorization: MemorizationRecord[] =
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
      }
    } catch (error) {
      console.error("Error loading memorization data:", error)
      setError("Terjadi kesalahan saat memuat data")
    } finally {
      setLoading(false)
    }
  }

  const getFilteredRecords = () => {
    return memorizationRecords.filter((record) => {
      const recordDate = new Date(record.date)
      const monthMatch = recordDate.getMonth() === selectedMonth
      const yearMatch = recordDate.getFullYear() === selectedYear
      const halaqohMatch = selectedHalaqoh === "all" || record.halaqoh === selectedHalaqoh

      return monthMatch && yearMatch && halaqohMatch
    })
  }

  const getAvailableHalaqoh = () => {
    const halaqohList = memorizationRecords.map((record) => record.halaqoh)
    return [...new Set(halaqohList)].filter(Boolean)
  }

  const getSantriRecap = (): SantriRecap[] => {
    const filteredRecords = getFilteredRecords()
    const santriMap = new Map<string, MemorizationRecord[]>()

    // Group records by santri
    filteredRecords.forEach((record) => {
      if (!santriMap.has(record.santriId)) {
        santriMap.set(record.santriId, [])
      }
      santriMap.get(record.santriId)!.push(record)
    })

    // Calculate recap for each santri
    return Array.from(santriMap.entries())
      .map(([santriId, records]) => {
        const totalSetoranBulan = records.reduce((sum, record) => sum + record.totalSetoran, 0)
        const totalHafalanBulan = records.reduce((sum, record) => sum + record.totalHafalan, 0)

        const qualityDistribution = {
          baik: records.filter((r) => r.quality === "Baik").length,
          cukup: records.filter((r) => r.quality === "Cukup").length,
          kurang: records.filter((r) => r.quality === "Kurang").length,
        }

        const qualityScore =
          qualityDistribution.baik * 3 + qualityDistribution.cukup * 2 + qualityDistribution.kurang * 1
        const averageQuality = records.length > 0 ? qualityScore / records.length : 0

        const lastRecord = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

        return {
          santriId,
          santriName: lastRecord.santriName,
          halaqoh: lastRecord.halaqoh,
          totalSetoranBulan,
          totalHafalanBulan,
          averageQuality,
          qualityDistribution,
          notes:
            records
              .map((r) => r.notes)
              .filter(Boolean)
              .join("; ") || "",
        }
      })
      .sort((a, b) => a.santriName.localeCompare(b.santriName))
  }

  const getHalaqohSummary = (): HalaqohSummary[] => {
    const santriRecap = getSantriRecap()
    const halaqohMap = new Map<string, SantriRecap[]>()

    // Group by halaqoh
    santriRecap.forEach((santri) => {
      if (!halaqohMap.has(santri.halaqoh)) {
        halaqohMap.set(santri.halaqoh, [])
      }
      halaqohMap.get(santri.halaqoh)!.push(santri)
    })

    return Array.from(halaqohMap.entries())
      .map(([halaqoh, santriList]) => {
        const totalSantri = santriList.length
        const totalSetoran = santriList.reduce((sum, santri) => sum + santri.totalSetoranBulan, 0)
        const totalHafalan = santriList.reduce((sum, santri) => sum + santri.totalHafalanBulan, 0)
        const averageQuality = santriList.reduce((sum, santri) => sum + santri.averageQuality, 0) / totalSantri
        const activeSantri = santriList.filter((santri) => santri.totalSetoranBulan > 0).length

        return {
          halaqoh,
          totalSantri,
          totalSetoran,
          totalHafalan,
          averageQuality,
          activeSantri,
        }
      })
      .sort((a, b) => a.halaqoh.localeCompare(b.halaqoh))
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      // Simulate saving process
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Here you could save the recap data to database or generate a report
      const recapData = {
        month: selectedMonth,
        year: selectedYear,
        halaqoh: selectedHalaqoh,
        santriRecap: getSantriRecap(),
        halaqohSummary: getHalaqohSummary(),
        generatedAt: new Date().toISOString(),
        generatedBy: user?.username,
      }

      // Save to localStorage for demo
      const savedReports = JSON.parse(localStorage.getItem("savedReports") || "[]")
      savedReports.push({
        id: Date.now().toString(),
        ...recapData,
      })
      localStorage.setItem("savedReports", JSON.stringify(savedReports))

      setSuccess("Rekap hafalan berhasil disimpan!")
    } catch (error) {
      console.error("Error saving recap:", error)
      setError("Gagal menyimpan rekap hafalan")
    } finally {
      setSaving(false)
    }
  }

  const exportToPDF = () => {
    // Create PDF content
    const printContent = tableRef.current?.innerHTML || ""
    const printWindow = window.open("", "_blank")

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Rekap Hafalan ${months[selectedMonth]} ${selectedYear}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .header { text-align: center; margin-bottom: 30px; }
              .summary { margin: 20px 0; padding: 15px; background-color: #f9f9f9; }
              @media print { 
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>REKAP HAFALAN SANTRI</h1>
              <h2>${months[selectedMonth].toUpperCase()} ${selectedYear}</h2>
              ${selectedHalaqoh !== "all" ? `<h3>HALAQOH: ${selectedHalaqoh}</h3>` : ""}
            </div>
            ${printContent}
            <div style="margin-top: 30px; text-align: right; font-size: 12px;">
              <p>Digenerate pada: ${new Date().toLocaleDateString("id-ID")}</p>
              <p>Oleh: ${user?.username}</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const exportToWord = () => {
    const santriRecap = getSantriRecap()
    const halaqohSummary = getHalaqohSummary()

    let wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head>
          <meta charset='utf-8'>
          <title>Rekap Hafalan ${months[selectedMonth]} ${selectedYear}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .header { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>REKAP HAFALAN SANTRI</h1>
            <h2>${months[selectedMonth].toUpperCase()} ${selectedYear}</h2>
            ${selectedHalaqoh !== "all" ? `<h3>HALAQOH: ${selectedHalaqoh}</h3>` : ""}
          </div>
          
          <h3>RINGKASAN PER HALAQOH</h3>
          <table>
            <tr>
              <th>Halaqoh</th>
              <th>Total Santri</th>
              <th>Santri Aktif</th>
              <th>Total Setoran</th>
              <th>Total Hafalan</th>
              <th>Rata-rata Kualitas</th>
            </tr>
    `

    halaqohSummary.forEach((summary) => {
      wordContent += `
        <tr>
          <td>${summary.halaqoh}</td>
          <td>${summary.totalSantri}</td>
          <td>${summary.activeSantri}</td>
          <td>${summary.totalSetoran}</td>
          <td>${summary.totalHafalan}</td>
          <td>${summary.averageQuality.toFixed(1)}/3.0</td>
        </tr>
      `
    })

    wordContent += `
          </table>
          
          <h3>DETAIL PER SANTRI</h3>
          <table>
            <tr>
              <th>No</th>
              <th>Nama Santri</th>
              <th>Total Setoran Selama 1 Bulan</th>
              <th>Total Hafalan</th>
              <th>Kualitas Hafalan</th>
              <th>Catatan</th>
            </tr>
    `

    santriRecap.forEach((santri, index) => {
      wordContent += `
        <tr>
          <td>${index + 1}</td>
          <td>${santri.santriName}</td>
          <td>${santri.totalSetoranBulan}</td>
          <td>${santri.totalHafalanBulan} ayat</td>
          <td>${santri.averageQuality.toFixed(1)}/3.0</td>
          <td>${santri.notes || "-"}</td>
        </tr>
      `
    })

    wordContent += `
          </table>
          <br><br>
          <p style="text-align: right;">
            Digenerate pada: ${new Date().toLocaleDateString("id-ID")}<br>
            Oleh: ${user?.username}
          </p>
        </body>
      </html>
    `

    const blob = new Blob([wordContent], { type: "application/msword" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Rekap_Hafalan_${months[selectedMonth]}_${selectedYear}.doc`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getQualityColor = (quality: number) => {
    if (quality >= 2.5) return "text-green-600 bg-green-50"
    if (quality >= 2.0) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data rekap hafalan...</p>
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

  const santriRecap = getSantriRecap()
  const halaqohSummary = getHalaqohSummary()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <BookOpen className="h-8 w-8" />
                  Rekap Hafalan Bulanan
                </h1>
                <p className="text-blue-100">Laporan komprehensif hafalan santri per halaqoh</p>
              </div>
            </div>
          </FadeIn>

          {/* Filter Controls */}
          <FadeIn delay={0.2}>
            <AnimatedCard className="mb-8 border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Rekap
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Pilih periode dan halaqoh untuk rekap hafalan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50 mb-4">
                    <AlertDescription className="text-green-700">{success}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Bulan</label>
                    <Select
                      value={selectedMonth.toString()}
                      onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
                    >
                      <SelectTrigger className="w-40 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
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
                      <SelectTrigger className="w-32 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
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

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Halaqoh</label>
                    <Select value={selectedHalaqoh} onValueChange={setSelectedHalaqoh}>
                      <SelectTrigger className="w-48 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Halaqoh</SelectItem>
                        {getAvailableHalaqoh().map((halaqoh) => (
                          <SelectItem key={halaqoh} value={halaqoh}>
                            {halaqoh}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <AnimatedButton
                      onClick={exportToPDF}
                      className="h-12 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={exportToWord}
                      className="h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Word
                    </AnimatedButton>
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>
          </FadeIn>

          {/* Summary Cards */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: "Total Santri",
                value: santriRecap.length,
                subtitle: "Santri terdaftar",
                icon: Users,
                gradient: "from-blue-500 to-indigo-600",
              },
              {
                title: "Total Setoran",
                value: santriRecap.reduce((sum, santri) => sum + santri.totalSetoranBulan, 0),
                subtitle: "Setoran bulan ini",
                icon: Calendar,
                gradient: "from-green-500 to-emerald-600",
              },
              {
                title: "Total Hafalan",
                value: santriRecap.reduce((sum, santri) => sum + santri.totalHafalanBulan, 0),
                subtitle: "Ayat dihafal",
                icon: BookOpen,
                gradient: "from-purple-500 to-pink-600",
              },
              {
                title: "Rata-rata Kualitas",
                value:
                  santriRecap.length > 0
                    ? (
                        santriRecap.reduce((sum, santri) => sum + santri.averageQuality, 0) / santriRecap.length
                      ).toFixed(1)
                    : "0.0",
                subtitle: "Dari 3.0",
                icon: TrendingUp,
                gradient: "from-orange-500 to-red-600",
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

          {/* Main Recap Table */}
          <FadeIn delay={0.5}>
            <AnimatedCard className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  REKAP HAFALAN {months[selectedMonth].toUpperCase()} {selectedYear}
                  {selectedHalaqoh !== "all" && (
                    <Badge className="bg-white/20 text-white ml-2">{selectedHalaqoh}</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Detail hafalan per santri dengan format yang disederhanakan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div ref={tableRef} className="overflow-x-auto">
                  {santriRecap.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Tidak ada data hafalan untuk periode ini</p>
                      <p className="text-gray-400">Silakan pilih periode atau halaqoh yang berbeda</p>
                    </div>
                  ) : (
                    <table className="w-full border-collapse bg-white">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                          <th className="border border-gray-300 px-4 py-4 text-center font-bold">No</th>
                          <th className="border border-gray-300 px-6 py-4 text-left font-bold">Nama Santri</th>
                          <th className="border border-gray-300 px-4 py-4 text-center font-bold">
                            Total Setoran Selama 1 Bulan
                          </th>
                          <th className="border border-gray-300 px-4 py-4 text-center font-bold">Total Hafalan</th>
                          <th className="border border-gray-300 px-4 py-4 text-center font-bold">Kualitas Hafalan</th>
                          <th className="border border-gray-300 px-6 py-4 text-left font-bold">Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {santriRecap.map((santri, index) => (
                          <motion.tr
                            key={santri.santriId}
                            className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <td className="border border-gray-300 px-4 py-4 text-center font-medium">{index + 1}</td>
                            <td className="border border-gray-300 px-6 py-4 font-semibold text-gray-900">
                              {santri.santriName}
                            </td>
                            <td className="border border-gray-300 px-4 py-4 text-center font-bold text-blue-600">
                              {santri.totalSetoranBulan}
                            </td>
                            <td className="border border-gray-300 px-4 py-4 text-center font-bold text-green-600">
                              {santri.totalHafalanBulan} ayat
                            </td>
                            <td className="border border-gray-300 px-4 py-4 text-center">
                              <span
                                className={`px-3 py-1 rounded-lg font-bold ${getQualityColor(santri.averageQuality)}`}
                              >
                                {santri.averageQuality.toFixed(1)}/3.0
                              </span>
                            </td>
                            <td className="border border-gray-300 px-6 py-4 text-sm text-gray-600">
                              {santri.notes || "-"}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Save Button */}
                {santriRecap.length > 0 && (
                  <div className="mt-8 flex justify-center">
                    <AnimatedButton
                      onClick={handleSave}
                      className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg"
                      disabled={saving}
                    >
                      {saving ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Menyimpan Rekap...
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Save className="h-5 w-5" />
                          Simpan Rekap Hafalan
                        </div>
                      )}
                    </AnimatedButton>
                  </div>
                )}
              </CardContent>
            </AnimatedCard>
          </FadeIn>
        </div>
      </div>
    </div>
  )
}
