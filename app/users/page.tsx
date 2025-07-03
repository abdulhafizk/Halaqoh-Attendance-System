"use client";

import { useState, useEffect } from "react";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UserPlus,
  Users,
  Edit,
  Trash2,
  ArrowLeft,
  Shield,
  User,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { supabase } from "@/lib/supabase";
import { AnimatedCard } from "@/components/animated-card";
import { AnimatedButton } from "@/components/animated-button";
import { FadeIn } from "@/components/fade-in";
import { StaggerContainer, StaggerItem } from "@/components/stagger-container";

interface UserData {
  id: string;
  username: string;
  email: string;
  role: "admin" | "masul_tahfidz" | "tim_tahfidz" | "pengampu";
  status: "active" | "inactive";
  createdAt: string;
  lastLogin?: string;
}

export default function UsersPage() {
  const { user, hasPermission, isLoading } = useAuth();

  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user && hasPermission("manage_users")) {
      loadUsers();
    }
  }, [user, hasPermission]);

  const loadUsers = async () => {
    try {
      const isDemoUser = user?.id?.startsWith("demo-");

      if (isDemoUser) {
        // Load from localStorage for demo users
        const usersData = JSON.parse(localStorage.getItem("usersData") || "[]");
        setUsersList(usersData);
      } else {
        // Load from Supabase for real users
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading users:", error);
          setError("Gagal memuat data pengguna");
          return;
        }

        // Transform data to match interface
        const transformedUsers: UserData[] =
          data?.map((profile) => ({
            id: profile.id,
            username: profile.username,
            email: profile.username, // Using username as email for demo
            role: profile.role,
            status: "active",
            createdAt: profile.created_at,
            lastLogin: undefined,
          })) || [];

        setUsersList(transformedUsers);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setError("Terjadi kesalahan saat memuat data");
    }
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.role) {
      setError("Username, email, dan role wajib diisi!");
      return false;
    }

    if (!isEditing && (!formData.password || !formData.confirmPassword)) {
      setError("Password wajib diisi untuk pengguna baru!");
      return false;
    }

    if (!isEditing && formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok!");
      return false;
    }

    if (!isEditing && formData.password.length < 6) {
      setError("Password minimal 6 karakter!");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Format email tidak valid!");
      return false;
    }

    // Check if username already exists (except when editing)
    const existingUser = usersList.find(
      (u) =>
        u.username.toLowerCase() === formData.username.toLowerCase() &&
        u.id !== editingId
    );
    if (existingUser) {
      setError("Username sudah digunakan!");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const isDemoUser = user?.id?.startsWith("demo-");

      if (isDemoUser) {
        // Handle demo user with localStorage
        let updatedList: UserData[];

        if (isEditing) {
          updatedList = usersList.map((userData) =>
            userData.id === editingId
              ? {
                  ...userData,
                  username: formData.username,
                  email: formData.email,
                  role: formData.role as
                    | "admin"
                    | "masul_tahfidz"
                    | "tim_tahfidz"
                    | "pengampu",
                  status: formData.status as "active" | "inactive",
                }
              : userData
          );
          setSuccess("Data pengguna berhasil diperbarui!");
        } else {
          const newUser: UserData = {
            id: `demo-user-${Date.now()}`,
            username: formData.username,
            email: formData.email,
            role: formData.role as
              | "admin"
              | "masul_tahfidz"
              | "tim_tahfidz"
              | "pengampu",
            status: formData.status as "active" | "inactive",
            createdAt: new Date().toISOString(),
          };
          updatedList = [...usersList, newUser];
          setSuccess("Pengguna baru berhasil ditambahkan!");
        }

        setUsersList(updatedList);
        localStorage.setItem("usersData", JSON.stringify(updatedList));
      } else {
        // Handle real Supabase user
        if (isEditing) {
          const { error } = await supabase
            .from("profiles")
            .update({
              username: formData.username,
              role: formData.role,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editingId);

          if (error) {
            console.error("Error updating user:", error);
            setError("Gagal memperbarui data pengguna: " + error.message);
            return;
          }

          setSuccess("Data pengguna berhasil diperbarui!");
        } else {
          // For real users, we would need to create auth user first
          // This is a simplified version for demo
          const { data: authData, error: authError } =
            await supabase.auth.signUp({
              email: formData.email,
              password: formData.password,
              options: {
                data: {
                  username: formData.username,
                  role: formData.role,
                },
              },
            });

          if (authError) {
            console.error("Error creating user:", authError);
            setError("Gagal membuat pengguna: " + authError.message);
            return;
          }

          setSuccess("Pengguna baru berhasil ditambahkan!");
        }

        // Reload data
        await loadUsers();
      }

      // Reset form
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "",
        status: "active",
      });
      setIsEditing(false);
      setEditingId("");
    } catch (error) {
      console.error("Error submitting user:", error);
      setError("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (userData: UserData) => {
    setFormData({
      username: userData.username,
      email: userData.email,
      password: "",
      confirmPassword: "",
      role: userData.role,
      status: userData.status,
    });
    setIsEditing(true);
    setEditingId(userData.id);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) return;

    try {
      const isDemoUser = user?.id?.startsWith("demo-");

      if (isDemoUser) {
        // Handle demo user with localStorage
        const updatedList = usersList.filter((userData) => userData.id !== id);
        setUsersList(updatedList);
        localStorage.setItem("usersData", JSON.stringify(updatedList));
        setSuccess("Pengguna berhasil dihapus!");
      } else {
        // Handle real Supabase user
        const { error } = await supabase.from("profiles").delete().eq("id", id);

        if (error) {
          console.error("Error deleting user:", error);
          setError("Gagal menghapus pengguna: " + error.message);
          return;
        }

        setSuccess("Pengguna berhasil dihapus!");
        await loadUsers();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Terjadi kesalahan saat menghapus pengguna");
    }
  };

  const handleCancel = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "",
      status: "active",
    });
    setIsEditing(false);
    setEditingId("");
    setError("");
    setSuccess("");
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "masul_tahfidz":
        return "bg-blue-100 text-blue-800";
      case "tim_tahfidz":
        return "bg-green-100 text-green-800";
      case "pengampu":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin";
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "masul_tahfidz":
        return <User className="h-4 w-4" />;
      case "tim_tahfidz":
        return <Settings className="h-4 w-4" />;
      case "pengampu":
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !hasPermission("manage_users")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Akses Ditolak
          </h1>
          <p className="text-gray-600">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Hanya Admin yang dapat mengelola pengguna.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Navbar />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <FadeIn delay={0.1}>
            <div className="mb-8">
              <Link href="/">
                <Button
                  variant="ghost"
                  className="mb-4 hover:bg-white/50 rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke Dashboard
                </Button>
              </Link>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Users className="h-8 w-8" />
                  Manajemen Pengguna
                </h1>
                <p className="text-indigo-100">
                  Kelola akun pengguna dan hak akses sistem
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Statistics */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StaggerItem>
              <AnimatedCard className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Total Pengguna
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {usersList.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>
            </StaggerItem>

            <StaggerItem>
              <AnimatedCard className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Admin
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {usersList.filter((u) => u.role === "admin").length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>
            </StaggerItem>

            <StaggerItem>
              <AnimatedCard className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Pengguna Aktif
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {usersList.filter((u) => u.status === "active").length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>
            </StaggerItem>
          </StaggerContainer>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Tambah/Edit Pengguna */}
            <FadeIn delay={0.3}>
              <AnimatedCard className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    {isEditing ? "Edit Pengguna" : "Tambah Pengguna Baru"}
                  </CardTitle>
                  <CardDescription className="text-indigo-100">
                    {isEditing
                      ? "Perbarui data pengguna"
                      : "Buat akun pengguna baru"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-700">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="username"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Username *
                    </Label>
                    <Input
                      placeholder="Masukkan username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Email *
                    </Label>
                    <Input
                      type="email"
                      placeholder="Masukkan email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="role"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Role *
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-red-600" />
                            <span>Admin - Akses penuh sistem</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="masul_tahfidz">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span>Masul Tahfidz - Manajemen & laporan</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="tim_tahfidz">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-green-600" />
                            <span>Tim Tahfidz - Absensi & hafalan</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="pengampu">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-yellow-600" />
                            <span>Pengampu - Input Hafalan Santri</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {!isEditing && (
                    <>
                      <div className="space-y-2">
                        <Label
                          htmlFor="password"
                          className="text-sm font-semibold text-gray-700"
                        >
                          Password *
                        </Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Masukkan password (min. 6 karakter)"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                password: e.target.value,
                              }))
                            }
                            className="h-12 pr-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="confirmPassword"
                          className="text-sm font-semibold text-gray-700"
                        >
                          Konfirmasi Password *
                        </Label>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Ulangi password"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="status"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Tidak Aktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3">
                    <AnimatedButton
                      onClick={handleSubmit}
                      className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {isEditing ? "Memperbarui..." : "Menyimpan..."}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          {isEditing ? "Perbarui" : "Tambah"} Pengguna
                        </div>
                      )}
                    </AnimatedButton>
                    {isEditing && (
                      <AnimatedButton
                        onClick={handleCancel}
                        variant="outline"
                        className="flex-1 h-12 rounded-xl"
                      >
                        Batal
                      </AnimatedButton>
                    )}
                  </div>
                </CardContent>
              </AnimatedCard>
            </FadeIn>

            {/* Daftar Pengguna */}
            <FadeIn delay={0.4}>
              <AnimatedCard className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Daftar Pengguna ({usersList.length})
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Semua pengguna yang terdaftar
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {usersList.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                          Belum ada pengguna terdaftar
                        </p>
                      </div>
                    ) : (
                      usersList.map((userData) => (
                        <div
                          key={userData.id}
                          className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
                                {getRoleIcon(userData.role)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">
                                    {userData.username}
                                  </span>
                                  <Badge
                                    className={getRoleColor(userData.role)}
                                  >
                                    {getRoleName(userData.role)}
                                  </Badge>
                                  <Badge
                                    variant={
                                      userData.status === "active"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={
                                      userData.status === "active"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                    }
                                  >
                                    {userData.status === "active"
                                      ? "Aktif"
                                      : "Tidak Aktif"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {userData.email}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Dibuat:{" "}
                                  {new Date(
                                    userData.createdAt
                                  ).toLocaleDateString("id-ID")}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(userData)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(userData.id)}
                                className="text-red-600 hover:text-red-700"
                                disabled={userData.id === user.id} // Prevent self-deletion
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
              </AnimatedCard>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  );
}
