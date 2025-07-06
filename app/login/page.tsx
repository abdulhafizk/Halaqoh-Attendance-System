"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  UserCheck,
  Clock,
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogIn,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { AnimatedCard } from "@/components/animated-card";
import { AnimatedButton } from "@/components/animated-button";
import { AnimatedInput } from "@/components/animated-input";
import { FadeIn } from "@/components/fade-in";
import { StaggerContainer } from "@/components/stagger-container";

interface LoginStats {
  totalUsers: number;
  activeUsers: number;
  lastLoginTime: string | null;
}

export default function LoginPage() {
  const { login, isLoading, error, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginStats, setLoginStats] = useState<LoginStats>({
    totalUsers: 0,
    activeUsers: 0,
    lastLoginTime: null,
  });
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Load saved email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Load saved password from localStorage
  useEffect(() => {
    const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedPassword) {
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  // Load login statistics
  useEffect(() => {
    const loadLoginStats = async () => {
      try {
        // Get total users
        const { count: totalUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        // Get active users (logged in within last 24 hours)
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const { count: activeUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)
          .gte("last_login", twentyFourHoursAgo.toISOString());

        // Get most recent login
        const { data: recentLogin } = await supabase
          .from("profiles")
          .select("last_login")
          .eq("is_active", true)
          .not("last_login", "is", null)
          .order("last_login", { ascending: false })
          .limit(1)
          .single();

        setLoginStats({
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          lastLoginTime: recentLogin?.last_login || null,
        });
      } catch (error) {
        console.error("Error loading login stats:", error);
      }
    };

    loadLoginStats();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    setLoginLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        // Save email if remember me is checked
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        setLoginSuccess(true);

        // Small delay to show success state
        setTimeout(() => {
          router.push("/");
        }, 1000);
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoginLoading(false);
    }
  };

  const formatLastLogin = (timestamp: string | null) => {
    if (!timestamp) return "Belum ada";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Baru saja";
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} jam yang lalu`;
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-emerald-600 font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Login Form */}
          <FadeIn delay={0.2}>
            <div className="w-full max-w-md mx-auto">
              <AnimatedCard className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Sistem Tahfidz PP Hubbul Khoir
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Masuk ke sistem manajemen kehadiran dan hafalan
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {error && (
                    <Alert
                      variant="destructive"
                      className="border-red-200 bg-red-50"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-700">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {loginSuccess && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">
                        Login berhasil! Mengalihkan ke dashboard...
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <AnimatedInput
                          id="email"
                          type="email"
                          placeholder="nama@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <AnimatedInput
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Masukkan password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) =>
                          setRememberMe(checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="remember"
                        className="text-sm text-gray-600 cursor-pointer"
                      >
                        Ingat Saya
                      </Label>
                    </div>

                    <AnimatedButton
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={
                        !email || !password || loginLoading || loginSuccess
                      }
                    >
                      {loginLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Masuk...
                        </div>
                      ) : loginSuccess ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Berhasil!
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <LogIn className="h-4 w-4" />
                          Masuk
                        </div>
                      )}
                    </AnimatedButton>
                  </form>
                </CardContent>
              </AnimatedCard>
            </div>
          </FadeIn>

          {/* Right Side - Statistics */}
          <FadeIn delay={0.4}>
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Sistem Manajemen Kelas Tahfidz
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Platform terintegrasi untuk mengelola kehadiran ustadz,
                  progress hafalan santri, dan laporan komprehensif.
                </p>
              </div>

              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AnimatedCard className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {loginStats.totalUsers}
                      </p>
                      <p className="text-sm text-gray-600">Total Pengguna</p>
                    </div>
                  </div>
                </AnimatedCard>

                <AnimatedCard className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <UserCheck className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {loginStats.activeUsers}
                      </p>
                      <p className="text-sm text-gray-600">Pengguna Aktif</p>
                    </div>
                  </div>
                </AnimatedCard>

                <AnimatedCard className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Clock className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Login Terakhir
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatLastLogin(loginStats.lastLoginTime)}
                      </p>
                    </div>
                  </div>
                </AnimatedCard>
              </StaggerContainer>

              <AnimatedCard className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Fitur Utama
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Absensi Ustadz
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      <BookOpen className="h-3 w-3 mr-1" />
                      Hafalan Santri
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                      <Users className="h-3 w-3 mr-1" />
                      Manajemen Data
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Laporan Real-time
                    </Badge>
                  </div>
                </div>
              </AnimatedCard>
            </div>
          </FadeIn>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
