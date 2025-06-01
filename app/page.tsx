"use client"

import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar,
  Users,
  BookOpen,
  FileText,
  Clock,
  TrendingUp,
  Award,
  Target,
  UserPlus,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Navbar } from "@/components/navbar"
import { AnimatedCard } from "@/components/animated-card"
import { AnimatedButton } from "@/components/animated-button"
import { FadeIn } from "@/components/fade-in"
import { StaggerContainer, StaggerItem } from "@/components/stagger-container"
import { LoadingSpinner } from "@/components/loading-spinner"
import { motion } from "framer-motion"

export default function Dashboard() {
  const { user, hasPermission, isLoading } = useAuth()

  const [stats, setStats] = useState({
    totalUstadz: 0,
    totalSantri: 0,
    todayAttendance: 0,
    monthlyReports: 0,
  })

  useEffect(() => {
    // Load stats from localStorage
    const ustadzData = JSON.parse(localStorage.getItem("ustadzData") || "[]")
    const santriData = JSON.parse(localStorage.getItem("santriData") || "[]")
    const attendanceData = JSON.parse(localStorage.getItem("attendanceData") || "[]")

    const today = new Date().toDateString()
    const todayAttendance = attendanceData.filter(
      (record: any) => new Date(record.date).toDateString() === today,
    ).length

    setStats({
      totalUstadz: ustadzData.length,
      totalSantri: santriData.length,
      todayAttendance,
      monthlyReports: 1,
    })
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingSpinner size="lg" />
          <motion.p
            className="text-gray-600 font-medium mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Loading...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const menuItems = [
    {
      title: "Absensi Ustadz",
      description: "Catat kehadiran Ustadz untuk Sabaq, Sabqi, dan Manzil",
      icon: Calendar,
      href: "/attendance",
      permission: "manage_attendance",
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
    },
    {
      title: "Hafalan Santri",
      description: "Kelola dan rekap hafalan santri di setiap Halaqoh",
      icon: BookOpen,
      href: "/memorization",
      permission: "manage_memorization",
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
    },
    {
      title: "Rekap Hafalan",
      description: "Rekap hafalan bulanan per halaqoh dengan export PDF/Word",
      icon: BarChart3,
      href: "/memorization-recap",
      permission: "view_reports",
      gradient: "from-indigo-500 to-purple-600",
      bgGradient: "from-indigo-50 to-purple-50",
    },
    {
      title: "Laporan Bulanan",
      description: "Lihat rekap kehadiran dan hafalan santri",
      icon: FileText,
      href: "/reports",
      permission: "view_reports",
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50",
    },
    {
      title: "Data Ustadz",
      description: "Kelola data Ustadz pengampu Halaqoh",
      icon: Users,
      href: "/ustadz",
      permission: "manage_ustadz",
      gradient: "from-orange-500 to-red-600",
      bgGradient: "from-orange-50 to-red-50",
    },
    {
      title: "Data Santri",
      description: "Kelola data santri dan penempatan Halaqoh",
      icon: Target,
      href: "/santri",
      permission: "manage_santri",
      gradient: "from-teal-500 to-cyan-600",
      bgGradient: "from-teal-50 to-cyan-50",
    },
    {
      title: "Jadwal Halaqoh",
      description: "Atur jadwal dan waktu pelaksanaan Halaqoh",
      icon: Clock,
      href: "/schedule",
      permission: "manage_schedule",
      gradient: "from-rose-500 to-pink-600",
      bgGradient: "from-rose-50 to-pink-50",
    },
    {
      title: "Manajemen Pengguna",
      description: "Kelola akun pengguna dan hak akses sistem",
      icon: UserPlus,
      href: "/users",
      permission: "manage_users",
      gradient: "from-indigo-500 to-purple-600",
      bgGradient: "from-indigo-50 to-purple-50",
    },
  ]

  const statsCards = [
    {
      title: "Total Ustadz",
      value: stats.totalUstadz,
      icon: Users,
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
    },
    {
      title: "Total Santri",
      value: stats.totalSantri,
      icon: BookOpen,
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
    },
    {
      title: "Absensi Hari Ini",
      value: stats.todayAttendance,
      icon: Clock,
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50",
    },
    {
      title: "Laporan Bulan Ini",
      value: stats.monthlyReports,
      icon: TrendingUp,
      gradient: "from-orange-500 to-red-600",
      bgGradient: "from-orange-50 to-red-50",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <FadeIn delay={0.1}>
            <motion.div
              className="mb-8"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl overflow-hidden relative">
                <motion.div
                  className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
                <div className="flex items-center justify-between relative z-10">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <h1 className="text-4xl font-bold mb-2">Selamat Datang, {user.username}! 👋</h1>
                    <p className="text-emerald-100 text-lg">
                      Kelola sistem absensi dan hafalan dengan mudah dan efisien
                    </p>
                  </motion.div>
                  <motion.div
                    className="hidden md:block"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
                  >
                    <Award className="h-24 w-24 text-emerald-200" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </FadeIn>

          {/* Stats Cards */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <StaggerItem key={index}>
                <AnimatedCard delay={index * 0.1} className="border-0 shadow-lg overflow-hidden">
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

          {/* Main Menu */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => {
              if (!hasPermission(item.permission)) return null

              return (
                <StaggerItem key={index}>
                  <AnimatedCard delay={index * 0.1} className="group border-0 shadow-lg overflow-hidden">
                    <div className={`h-2 bg-gradient-to-r ${item.gradient}`}></div>
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-4">
                        <motion.div
                          className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center shadow-lg`}
                          whileHover={{ rotate: 10, scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <item.icon className="h-6 w-6 text-white" />
                        </motion.div>
                        <div>
                          <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                            {item.title}
                          </CardTitle>
                        </div>
                      </div>
                      <CardDescription className="text-gray-600 mt-2 leading-relaxed">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Link href={item.href}>
                        <AnimatedButton
                          className={`w-full bg-gradient-to-r ${item.gradient} hover:opacity-90 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl`}
                        >
                          Buka Menu
                        </AnimatedButton>
                      </Link>
                    </CardContent>
                  </AnimatedCard>
                </StaggerItem>
              )
            })}
          </StaggerContainer>

          {/* Quick Actions */}
          <FadeIn delay={0.8} className="mt-8">
            <AnimatedCard className="bg-white shadow-lg border border-gray-100">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <motion.div whileHover={{ rotate: 10 }} transition={{ type: "spring", stiffness: 300 }}>
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </motion.div>
                  Aksi Cepat
                </h3>
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4" staggerDelay={0.05}>
                  {[
                    {
                      href: "/attendance",
                      permission: "manage_attendance",
                      icon: Calendar,
                      label: "Absen Hari Ini",
                      color: "emerald",
                    },
                    {
                      href: "/memorization",
                      permission: "manage_memorization",
                      icon: BookOpen,
                      label: "Input Hafalan",
                      color: "blue",
                    },
                    {
                      href: "/memorization-recap",
                      permission: "view_reports",
                      icon: BarChart3,
                      label: "Rekap Hafalan",
                      color: "indigo",
                    },
                    {
                      href: "/reports",
                      permission: "view_reports",
                      icon: FileText,
                      label: "Lihat Laporan",
                      color: "purple",
                    },
                  ].map((action, index) => {
                    if (!hasPermission(action.permission)) return null

                    return (
                      <StaggerItem key={index}>
                        <Link href={action.href}>
                          <motion.div
                            className={`w-full h-16 flex flex-col gap-1 items-center justify-center border-2 border-${action.color}-200 rounded-xl hover:bg-${action.color}-50 hover:border-${action.color}-300 transition-all duration-200 cursor-pointer`}
                            whileHover={{ y: -2, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 400 }}>
                              <action.icon className={`h-5 w-5 text-${action.color}-600`} />
                            </motion.div>
                            <span className="text-sm font-medium">{action.label}</span>
                          </motion.div>
                        </Link>
                      </StaggerItem>
                    )
                  })}
                </StaggerContainer>
              </CardContent>
            </AnimatedCard>
          </FadeIn>
        </div>
      </div>
    </div>
  )
}
