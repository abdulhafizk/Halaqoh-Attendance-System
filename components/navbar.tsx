"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Shield, Clock, ChurchIcon as Mosque, Settings } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

export function Navbar() {
  const { user, logout } = useAuth()

  if (!user) return null

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-gradient-to-r from-red-500 to-pink-500 text-white"
      case "masul_tahfidz":
        return "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
      case "tim_tahfidz":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin"
      case "masul_tahfidz":
        return "Masul Tahfidz"
      case "tim_tahfidz":
        return "Tim Tahfidz"
      default:
        return role
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />
      case "masul_tahfidz":
        return <User className="h-4 w-4" />
      case "tim_tahfidz":
        return <Settings className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <nav className="bg-background/95 backdrop-blur-sm shadow-lg border-b border-border px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Mosque className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Sistem Absensi Halaqoh
              </h1>
              <p className="text-xs text-muted-foreground">Manajemen Tahfidz Digital</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-xl">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <div className="font-medium text-foreground">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date().toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 h-12 px-4 hover:bg-muted/50 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <div className="font-medium text-foreground">{user.username}</div>
                  <div className="text-xs text-muted-foreground">{getRoleName(user.role)}</div>
                </div>
                <Badge className={`${getRoleColor(user.role)} shadow-sm`}>
                  <div className="flex items-center gap-1">
                    {getRoleIcon(user.role)}
                    <span className="hidden sm:inline">{getRoleName(user.role)}</span>
                  </div>
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <div className="px-3 py-2 border-b border-border mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{getRoleName(user.role)}</p>
                    <p className="text-xs text-muted-foreground">
                      Login: {new Date(user.loginTime).toLocaleTimeString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer rounded-lg">
                  <Settings className="h-4 w-4 mr-3" />
                  Pengaturan
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer rounded-lg"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
