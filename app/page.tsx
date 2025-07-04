"use client";

import { useState, useEffect } from "react";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  Calendar,
  BarChart3,
  UserCheck,
  GraduationCap,
  ArrowRight,
  TrendingUp,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { supabase } from "@/lib/supabase";
import { AnimatedCard } from "@/components/animated-card";
import { AnimatedButton } from "@/components/animated-button";
import { FadeIn } from "@/components/fade-in";
import { StaggerContainer, StaggerItem } from "@/components/stagger-container";
import { motion } from "framer-motion";

interface DashboardStats {
  totalUstadz: number;
  totalSantri: number;
  todayAttendance: number;
  thisWeekMemorization: number;
}

export default function Dashboard() {
  const { user, profile, hasPermission, isLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUstadz: 0,
    totalSantri: 0,
    todayAttendance: 0,
    thisWeekMemorization: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      setLoadingStats(true);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Get start of current week (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      const weekStart = monday.toISOString().split("T")[0];

      const [
        ustadzResponse,
        santriResponse,
        attendanceResponse,
        memorizationResponse,
      ] = await Promise.all([
        supabase.from("ustadz").select("id", { count: "exact" }),
        supabase.from("santri").select("id", { count: "exact" }),
        supabase
          .from("attendance")
          .select("id", { count: "exact" })
          .eq("date", today),
        supabase
          .from("memorization")
          .select("id", { count: "exact" })
          .gte("date", weekStart),
      ]);

      setStats({
        totalUstadz: ustadzResponse.count || 0,
        totalSantri: santriResponse.count || 0,
        todayAttendance: attendanceResponse.count || 0,
        thisWeekMemorization: memorizationResponse.count || 0,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

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
          <p className="text-gray-600 font-medium">Memuat dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Akses Ditolak
          </h1>
          <p className="text-gray-600 mb-4">
            Silakan login untuk mengakses dashboard.
          </p>
          <Link href="/login">
            <Button className="bg-red-600 hover:bg-red-700">Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: "Kehadiran",
      description: "Catat kehadiran ustadz dan aktivitas kelas",
      icon: UserCheck,
      href: "/attendance",
      color: "from-blue-500 to-blue-600",
      permission: "view_attendance",
      stats: `${stats.todayAttendance} hari ini`,
    },
    {
      title: "Data Ustadz",
      description: "Kelola data ustadz dan pengajar",
      icon: GraduationCap,
      href: "/ustadz",
      color: "from-green-500 to-green-600",
      permission: "manage_ustadz",
      stats: `${stats.totalUstadz} ustadz`,
    },
    {
      title: "Data Santri",
      description: "Kelola data santri dan peserta",
      icon: Users,
      href: "/santri",
      color: "from-purple-500 to-purple-600",
      permission: "manage_santri",
      stats: `${stats.totalSantri} santri`,
    },
    {
      title: "Hafalan",
      description: "Catat progress hafalan santri",
      icon: BookOpen,
      href: "/memorization",
      color: "from-orange-500 to-orange-600",
      permission: "manage_memorization",
      stats: `${stats.thisWeekMemorization} minggu ini`,
    },
    {
      title: "Target Hafalan",
      description: "Kelola target dan kategori warna hafalan",
      icon: Target,
      href: "/target-hafalan",
      color: "from-pink-500 to-rose-600",
      permission: "manage_users",
      stats: "Sistem target",
    },
    {
      title: "Rekap Hafalan",
      description: "Lihat rekap dan statistik hafalan",
      icon: BarChart3,
      href: "/memorization-recap",
      color: "from-indigo-500 to-indigo-600",
      permission: "view_reports",
      stats: "Laporan lengkap",
    },
    {
      title: "Laporan",
      description: "Laporan kehadiran dan progress",
      icon: TrendingUp,
      href: "/reports",
      color: "from-pink-500 to-pink-600",
      permission: "view_reports",
      stats: "Data analitik",
    },
    {
      title: "Pengguna",
      description: "Kelola akun pengguna sistem",
      icon: Users,
      href: "/users",
      color: "from-red-500 to-red-600",
      permission: "manage_users",
      stats: "Manajemen akses",
    },
  ];

  const availableMenuItems = menuItems.filter((item) =>
    hasPermission(item.permission)
  );

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "masul_tahfidz":
        return "Masul Tahfidz";
      case "tim_tahfidz":
        return "Tim Tahfidz";
      case "pengampu":
        return "Pengampu";

      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "masul_tahfidz":
        return "bg-blue-100 text-blue-800";
      case "tim_tahfidz":
        return "bg-green-100 text-green-800";
      case "pengampu":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
      <Navbar />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <FadeIn delay={0.1}>
            <div className="mb-8">
              <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      Selamat datang, {profile?.username || user.email}!
                    </h1>
                    <p className="text-red-100 text-lg">
                      Sistem Kehadiran Kelas Tahfidz
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={`${getRoleBadgeColor(
                        profile?.role || ""
                      )} text-sm px-3 py-1`}
                    >
                      {getRoleDisplayName(profile?.role || "")}
                    </Badge>
                    <p className="text-red-100 text-sm mt-2">
                      {new Date().toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Stats Cards */}
          <FadeIn delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <AnimatedCard className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Santri
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loadingStats ? (
                          <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          stats.totalSantri
                        )}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>

              <AnimatedCard className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Kehadiran Hari Ini
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loadingStats ? (
                          <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          stats.todayAttendance
                        )}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserCheck className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>

              <AnimatedCard className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Hafalan Minggu Ini
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loadingStats ? (
                          <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          stats.thisWeekMemorization
                        )}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>
            </div>
          </FadeIn>

          {/* Menu Grid */}
          <FadeIn delay={0.3}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Menu Utama
              </h2>
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableMenuItems.map((item, index) => (
                  <StaggerItem key={item.title}>
                    <Link href={item.href}>
                      <AnimatedCard className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group h-full">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div
                              className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                            >
                              <item.icon className="h-6 w-6 text-white" />
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors duration-300">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              {item.stats}
                            </Badge>
                          </div>
                        </CardContent>
                      </AnimatedCard>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </FadeIn>

          {/* Quick Actions */}
          <FadeIn delay={0.4}>
            <AnimatedCard className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Aksi Cepat
                </CardTitle>
                <CardDescription>
                  Akses cepat ke fitur yang sering digunakan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {hasPermission("view_attendance") && (
                    <Link href="/attendance">
                      <AnimatedButton className="w-full h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl">
                        <div className="flex items-center gap-3">
                          <UserCheck className="h-5 w-5" />
                          <div className="text-left">
                            <p className="font-semibold">Catat Kehadiran</p>
                            <p className="text-xs text-blue-100">Hari ini</p>
                          </div>
                        </div>
                      </AnimatedButton>
                    </Link>
                  )}

                  {hasPermission("manage_memorization") && (
                    <Link href="/memorization">
                      <AnimatedButton className="w-full h-16 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5" />
                          <div className="text-left">
                            <p className="font-semibold">Input Hafalan</p>
                            <p className="text-xs text-orange-100">
                              Progress santri
                            </p>
                          </div>
                        </div>
                      </AnimatedButton>
                    </Link>
                  )}

                  {hasPermission("manage_users") && (
                    <Link href="/target-hafalan">
                      <AnimatedButton className="w-full h-16 bg-gradient-to-r from-pink-600 to-rose-700 hover:from-pink-700 hover:to-rose-800 text-white rounded-xl">
                        <div className="flex items-center gap-3">
                          <Target className="h-5 w-5" />
                          <div className="text-left">
                            <p className="font-semibold">Target Hafalan</p>
                            <p className="text-xs text-pink-100">
                              Kelola target
                            </p>
                          </div>
                        </div>
                      </AnimatedButton>
                    </Link>
                  )}

                  {hasPermission("view_reports") && (
                    <Link href="/reports">
                      <AnimatedButton className="w-full h-16 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="h-5 w-5" />
                          <div className="text-left">
                            <p className="font-semibold">Lihat Laporan</p>
                            <p className="text-xs text-indigo-100">
                              Analisis data
                            </p>
                          </div>
                        </div>
                      </AnimatedButton>
                    </Link>
                  )}
                </div>
              </CardContent>
            </AnimatedCard>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
