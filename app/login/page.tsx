"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, User, Shield, Eye, EyeOff, ChurchIcon as Mosque } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedButton } from "@/components/animated-button"
import { AnimatedInput } from "@/components/animated-input"
import { FadeIn } from "@/components/fade-in"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useAuth } from "@/hooks/use-auth"

interface LoginCredentials {
  username: string
  password: string
  role: "admin" | "masul_tahfidz" | "tim_tahfidz" | ""
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: "",
    password: "",
    role: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    setError("")

    // Validate input
    if (!credentials.username || !credentials.password || !credentials.role) {
      setError("Semua field harus diisi!")
      setIsLoading(false)
      return
    }

    try {
      const success = await login(credentials.username, credentials.password, credentials.role)

      if (success) {
        router.push("/")
      } else {
        setError("Username, password, atau role tidak valid!")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Terjadi kesalahan saat login. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "admin":
        return "Akses penuh ke semua fitur sistem"
      case "masul_tahfidz":
        return "Akses ke manajemen data dan laporan"
      case "tim_tahfidz":
        return "Akses ke absensi dan input hafalan"
      default:
        return ""
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4 text-red-500" />
      case "masul_tahfidz":
        return <User className="h-4 w-4 text-blue-500" />
      case "tim_tahfidz":
        return <Lock className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <motion.div
        className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fillRule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%2334d399&quot; fillOpacity=&quot;0.05&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"
        animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
        transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />

      <FadeIn delay={0.2} className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
            <CardHeader className="text-center pb-8">
              <motion.div
                className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                whileHover={{ rotate: 5, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Mosque className="h-10 w-10 text-white" />
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Sistem Absensi Halaqoh
                </CardTitle>
                <CardDescription className="text-gray-600 mt-2">Silakan login untuk mengakses sistem</CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-6">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="space-y-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                  Pilih Role *
                </Label>
                <Select
                  value={credentials.role}
                  onValueChange={(value: "admin" | "masul_tahfidz" | "tim_tahfidz") =>
                    setCredentials((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-200">
                    <SelectValue placeholder="Pilih role Anda" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { value: "admin", label: "Admin", desc: "Akses penuh sistem", color: "red" },
                      { value: "masul_tahfidz", label: "Masul Tahfidz", desc: "Manajemen & laporan", color: "blue" },
                      { value: "tim_tahfidz", label: "Tim Tahfidz", desc: "Absensi & hafalan", color: "green" },
                    ].map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <motion.div
                          className="flex items-center gap-3 py-1"
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className={`w-8 h-8 bg-${role.color}-100 rounded-lg flex items-center justify-center`}>
                            {role.value === "admin" && <Shield className={`h-4 w-4 text-${role.color}-600`} />}
                            {role.value === "masul_tahfidz" && <User className={`h-4 w-4 text-${role.color}-600`} />}
                            {role.value === "tim_tahfidz" && <Lock className={`h-4 w-4 text-${role.color}-600`} />}
                          </div>
                          <div>
                            <div className="font-medium">{role.label}</div>
                            <div className="text-xs text-gray-500">{role.desc}</div>
                          </div>
                        </motion.div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AnimatePresence>
                  {credentials.role && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        {getRoleIcon(credentials.role)}
                        <span className="font-medium">{getRoleDescription(credentials.role)}</span>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                  Username *
                </Label>
                <div className="relative">
                  <motion.div
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <User className="h-5 w-5 text-gray-400" />
                  </motion.div>
                  <AnimatedInput
                    placeholder="Masukkan username"
                    value={credentials.username}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
                    className="h-12 pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password *
                </Label>
                <div className="relative">
                  <motion.div
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Lock className="h-5 w-5 text-gray-400" />
                  </motion.div>
                  <AnimatedInput
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={credentials.password}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                    className="h-12 pl-10 pr-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </motion.button>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <AnimatedButton
                  onClick={handleLogin}
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" color="white" />
                      Memproses...
                    </div>
                  ) : (
                    "Login"
                  )}
                </AnimatedButton>
              </motion.div>

              {/* Demo Credentials */}
              <motion.div
                className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <h4 className="font-semibold text-sm mb-4 text-gray-700 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Demo Credentials:
                </h4>
                <div className="space-y-3 text-xs">
                  {[
                    { role: "Admin", icon: Shield, color: "red", username: "admin", password: "admin123" },
                    { role: "Masul", icon: User, color: "blue", username: "masul", password: "masul123" },
                    { role: "Tim", icon: Lock, color: "green", username: "tim", password: "tim123" },
                  ].map((item, index) => (
                    <motion.div
                      key={item.role}
                      className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm cursor-pointer"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      onClick={() => {
                        setCredentials({
                          username: item.username,
                          password: item.password,
                          role: item.username as "admin" | "masul_tahfidz" | "tim_tahfidz",
                        })
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <div className={`w-6 h-6 bg-${item.color}-100 rounded-md flex items-center justify-center`}>
                          <item.icon className={`h-3 w-3 text-${item.color}-600`} />
                        </div>
                        <span className="font-medium">{item.role}</span>
                      </span>
                      <span className="font-mono text-gray-600">
                        {item.username} / {item.password}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </FadeIn>
    </div>
  )
}
