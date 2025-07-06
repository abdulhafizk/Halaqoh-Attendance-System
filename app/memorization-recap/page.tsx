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
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  User,
  BookOpen,
  Star,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { supabase } from "@/lib/supabase";
import { AnimatedCard } from "@/components/animated-card";
import { AnimatedButton } from "@/components/animated-button";
import { FadeIn } from "@/components/fade-in";
import { motion } from "framer-motion";

interface MemorizationRecord {
  santriId: string;
  santriName: string;
  kelas: string;
  totalHafalan: number;
  quality: string;
  notes: string;
  lastUpdated: string;
  latestRecordId?: string;
}

export default function MemorizationRecapPage() {
  const { user, hasPermission, isLoading: authLoading } = useAuth();
  const [memorizationData, setMemorizationData] = useState<
    MemorizationRecord[]
  >([]);
  const [filteredData, setFilteredData] = useState<MemorizationRecord[]>([]);
  const [availableKelas, setAvailableKelas] = useState<string[]>([]);
  const [selectedKelas, setSelectedKelas] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit functionality states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MemorizationRecord | null>(
    null
  );
  const [editFormData, setEditFormData] = useState({
    totalHafalan: 0,
    quality: "",
    notes: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user && hasPermission("view_memorization")) {
      loadMemorizationData();
    }
  }, [user, hasPermission]);

  useEffect(() => {
    filterData();
  }, [memorizationData, selectedKelas, searchTerm]);

  const loadMemorizationData = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Check if user is demo user
      const isDemoUser = user?.email === "demo@tahfidz.com";

      if (isDemoUser) {
        // Load demo data from localStorage
        const demoData = localStorage.getItem("demoMemorizationData");
        if (demoData) {
          const parsedData = JSON.parse(demoData);
          setMemorizationData(parsedData);

          // Extract unique classes
          const classes = [
            ...new Set(
              parsedData.map((record: MemorizationRecord) => record.kelas)
            ),
          ];
          setAvailableKelas(classes);
        } else {
          // Create demo data if not exists
          const defaultDemoData = [
            {
              santriId: "demo1",
              santriName: "Ahmad Fauzi",
              kelas: "Kelas 7",
              totalHafalan: 5.2,
              quality: "Baik",
              notes: "Progress sangat baik, perlu latihan tajwid",
              lastUpdated: new Date().toISOString(),
              latestRecordId: "demo_record_1",
            },
            {
              santriId: "demo2",
              santriName: "Fatimah Zahra",
              kelas: "Kelas 8",
              totalHafalan: 8.7,
              quality: "Sangat Baik",
              notes: "Hafalan sangat lancar, siap untuk ujian",
              lastUpdated: new Date().toISOString(),
              latestRecordId: "demo_record_2",
            },
            {
              santriId: "demo3",
              santriName: "Muhammad Rizki",
              kelas: "Kelas 7",
              totalHafalan: 3.5,
              quality: "Cukup",
              notes: "Perlu bimbingan lebih intensif",
              lastUpdated: new Date().toISOString(),
              latestRecordId: "demo_record_3",
            },
          ];
          localStorage.setItem(
            "demoMemorizationData",
            JSON.stringify(defaultDemoData)
          );
          setMemorizationData(defaultDemoData);
          setAvailableKelas(["Kelas 7", "Kelas 8"]);
        }
      } else {
        // Load real data from Supabase
        const { data: santriData, error: santriError } = await supabase
          .from("santri")
          .select("id, name, halaqoh")
          .order("name");

        if (santriError) throw santriError;

        const { data: memorizationData, error: memorizationError } =
          await supabase
            .from("memorization")
            .select("id, santri_id, ayah_to, quality, notes, created_at")
            .order("created_at", { ascending: false });

        if (memorizationError) throw memorizationError;

        // Process data to get latest record for each santri
        const santriMap = new Map();
        santriData?.forEach((santri) => {
          santriMap.set(santri.id, {
            santriId: santri.id,
            santriName: santri.name,
            kelas: santri.halaqoh,
            totalHafalan: 0,
            quality: "Belum Ada Data",
            notes: "",
            lastUpdated: "",
            latestRecordId: null,
          });
        });

        // Update with latest memorization data
        memorizationData?.forEach((record) => {
          if (santriMap.has(record.santri_id)) {
            const existing = santriMap.get(record.santri_id);
            if (
              !existing.lastUpdated ||
              record.created_at > existing.lastUpdated
            ) {
              santriMap.set(record.santri_id, {
                ...existing,
                totalHafalan:
                  typeof record.ayah_to === "number" ? record.ayah_to / 10 : 0,
                quality: record.quality || "Belum Ada Data",
                notes: record.notes || "",
                lastUpdated: record.created_at,
                latestRecordId: record.id,
              });
            }
          }
        });

        const processedData = Array.from(santriMap.values());
        setMemorizationData(processedData);

        // Extract unique classes
        const classes = [
          ...new Set(
            processedData.map((record) => record.kelas).filter(Boolean)
          ),
        ];
        setAvailableKelas(classes);
      }
    } catch (error) {
      console.error("Error loading memorization data:", error);
      setError(
        error instanceof Error ? error.message : "Gagal memuat data hafalan"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filterData = () => {
    let filtered = memorizationData;

    if (selectedKelas !== "all") {
      filtered = filtered.filter((record) => record.kelas === selectedKelas);
    }

    if (searchTerm) {
      filtered = filtered.filter((record) =>
        record.santriName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const handleEdit = (record: MemorizationRecord) => {
    setEditingRecord(record);
    setEditFormData({
      totalHafalan: record.totalHafalan,
      quality: record.quality,
      notes: record.notes,
    });
    setIsEditDialogOpen(true);
    setError("");
    setSuccess("");
  };

  const handleEditSubmit = async () => {
    if (!editingRecord) return;

    try {
      setIsUpdating(true);
      setError("");

      // Validation
      if (editFormData.totalHafalan < 0 || editFormData.totalHafalan > 30) {
        setError("Total hafalan harus antara 0-30 Juz");
        return;
      }

      const isDemoUser = user?.email === "demo@tahfidz.com";

      if (isDemoUser) {
        // Update demo data in localStorage
        const demoData = JSON.parse(
          localStorage.getItem("demoMemorizationData") || "[]"
        );
        const updatedData = demoData.map((record: MemorizationRecord) =>
          record.santriId === editingRecord.santriId
            ? {
                ...record,
                totalHafalan: editFormData.totalHafalan,
                quality: editFormData.quality,
                notes: editFormData.notes,
                lastUpdated: new Date().toISOString(),
              }
            : record
        );
        localStorage.setItem(
          "demoMemorizationData",
          JSON.stringify(updatedData)
        );
        setMemorizationData(updatedData);
      } else {
        // Update real data in Supabase
        if (!editingRecord.latestRecordId) {
          setError("ID record tidak ditemukan");
          return;
        }

        // Convert decimal to integer by multiplying by 10 to store in ayah_to column
        const hafalanAsInteger = Math.round(editFormData.totalHafalan * 10);

        const { error } = await supabase
          .from("memorization")
          .update({
            ayah_to: hafalanAsInteger, // Store as integer (Juz * 10)
            quality: editFormData.quality,
            notes: editFormData.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingRecord.latestRecordId);

        if (error) throw error;

        // Reload data
        await loadMemorizationData();
      }

      setSuccess("Data berhasil diperbarui!");
      setIsEditDialogOpen(false);
      setEditingRecord(null);
    } catch (error) {
      console.error("Error updating memorization:", error);
      setError(
        error instanceof Error ? error.message : "Gagal memperbarui data"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (record: MemorizationRecord) => {
    try {
      setIsDeleting(true);
      setError("");

      const isDemoUser = user?.email === "demo@tahfidz.com";

      if (isDemoUser) {
        // Remove from demo data
        const demoData = JSON.parse(
          localStorage.getItem("demoMemorizationData") || "[]"
        );
        const updatedData = demoData.filter(
          (r: MemorizationRecord) => r.santriId !== record.santriId
        );
        localStorage.setItem(
          "demoMemorizationData",
          JSON.stringify(updatedData)
        );
        setMemorizationData(updatedData);
      } else {
        // Delete from Supabase
        if (!record.latestRecordId) {
          setError("ID record tidak ditemukan");
          return;
        }

        const { error } = await supabase
          .from("memorization")
          .delete()
          .eq("id", record.latestRecordId);

        if (error) throw error;

        // Reload data
        await loadMemorizationData();
      }

      setSuccess("Data berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting memorization:", error);
      setError(error instanceof Error ? error.message : "Gagal menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };

  const getQualityBadge = (quality: string) => {
    switch (quality.toLowerCase()) {
      case "sangat baik":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Sangat Baik
          </Badge>
        );
      case "baik":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Baik
          </Badge>
        );
      case "cukup":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Cukup
          </Badge>
        );
      case "kurang":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Kurang
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Belum Ada Data
          </Badge>
        );
    }
  };

  const exportToPDF = () => {
    window.print();
  };

  const exportToWord = () => {
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Rekap Hafalan Santri</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .quality-sangat-baik { background-color: #d4edda; }
            .quality-baik { background-color: #cce5ff; }
            .quality-cukup { background-color: #fff3cd; }
            .quality-kurang { background-color: #f8d7da; }
          </style>
        </head>
        <body>
          <h1>Rekap Hafalan Santri</h1>
          <p>Tanggal: ${new Date().toLocaleDateString("id-ID")}</p>
          <p>Total Santri: ${filteredData.length}</p>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Santri</th>
                <th>Kelas</th>
                <th>Total Hafalan (Juz)</th>
                <th>Kualitas</th>
                <th>Catatan</th>
                <th>Terakhir Update</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData
                .map(
                  (record, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${record.santriName}</td>
                  <td>${record.kelas}</td>
                  <td>${record.totalHafalan.toFixed(1)}</td>
                  <td class="quality-${record.quality
                    .toLowerCase()
                    .replace(" ", "-")}">${record.quality}</td>
                  <td>${record.notes || "-"}</td>
                  <td>${new Date(record.lastUpdated).toLocaleDateString(
                    "id-ID"
                  )}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rekap_Hafalan_${new Date()
      .toISOString()
      .slice(0, 10)}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            {authLoading ? "Memuat autentikasi..." : "Memuat data hafalan..."}
          </p>
          <p className="text-gray-500 text-sm mt-2">Mohon tunggu sebentar</p>
        </motion.div>
      </div>
    );
  }

  if (!user || !hasPermission("view_memorization")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Akses Ditolak
          </h1>
          <p className="text-gray-600">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <BookOpen className="h-8 w-8" />
                  Rekap Hafalan Santri
                </h1>
                <p className="text-blue-100">
                  Lihat dan kelola progress hafalan semua santri dalam satu
                  tampilan
                </p>
                <div className="mt-4 p-4 bg-white/10 rounded-lg border border-white/20">
                  <p className="text-sm text-blue-100">
                    📊 <strong>Total Data:</strong> {filteredData.length} santri
                    | 📈 <strong>Rata-rata Hafalan:</strong>{" "}
                    {filteredData.length > 0
                      ? (
                          filteredData.reduce(
                            (sum, record) => sum + record.totalHafalan,
                            0
                          ) / filteredData.length
                        ).toFixed(1)
                      : "0"}{" "}
                    Juz
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Alerts */}
          {error && (
            <FadeIn delay={0.2}>
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </FadeIn>
          )}

          {success && (
            <FadeIn delay={0.2}>
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  {success}
                </AlertDescription>
              </Alert>
            </FadeIn>
          )}

          {/* Filters and Actions */}
          <FadeIn delay={0.3}>
            <AnimatedCard className="mb-8 border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Filter & Export Data
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Filter data berdasarkan kelas dan nama, atau export ke
                  berbagai format
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label
                      htmlFor="kelas-filter"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Filter Kelas
                    </Label>
                    <Select
                      value={selectedKelas}
                      onValueChange={setSelectedKelas}
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Kelas</SelectItem>
                        {availableKelas.map((kelas) => (
                          <SelectItem key={kelas} value={kelas}>
                            {kelas}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="search"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Cari Nama Santri
                    </Label>
                    <Input
                      id="search"
                      type="text"
                      placeholder="Ketik nama santri..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Export PDF
                    </Label>
                    <AnimatedButton
                      onClick={exportToPDF}
                      className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </AnimatedButton>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Export Word
                    </Label>
                    <AnimatedButton
                      onClick={exportToWord}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Word
                    </AnimatedButton>
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>
          </FadeIn>

          {/* Data Table */}
          <FadeIn delay={0.4}>
            <AnimatedCard className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Data Hafalan Santri ({filteredData.length})
                </CardTitle>
                <CardDescription className="text-green-100">
                  Daftar lengkap progress hafalan semua santri
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          No
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Nama Santri
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Kelas
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Total Hafalan
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Kualitas
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Catatan
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Terakhir Update
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider no-print">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
                              <p className="text-gray-500 text-lg font-medium">
                                Tidak ada data hafalan
                              </p>
                              <p className="text-gray-400 text-sm mt-2">
                                {searchTerm || selectedKelas !== "all"
                                  ? "Coba ubah filter pencarian"
                                  : "Belum ada data hafalan yang tercatat"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((record, index) => (
                          <motion.tr
                            key={record.santriId}
                            className="hover:bg-gray-50 transition-colors"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.02 }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                      {record.santriName
                                        .charAt(0)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {record.santriName}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {record.kelas}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 mr-2" />
                                <span className="text-sm font-bold text-gray-900">
                                  {record.totalHafalan.toFixed(1)} Juz
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getQualityBadge(record.quality)}
                            </td>
                            <td className="px-6 py-4">
                              <div
                                className="text-sm text-gray-600 max-w-xs truncate"
                                title={record.notes}
                              >
                                {record.notes || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record.lastUpdated
                                ? new Date(
                                    record.lastUpdated
                                  ).toLocaleDateString("id-ID", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(record)}
                                  className="h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Hapus
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Konfirmasi Hapus
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus data
                                        hafalan untuk{" "}
                                        <strong>{record.santriName}</strong>?
                                        Tindakan ini tidak dapat dibatalkan.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Batal
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(record)}
                                        className="bg-red-600 hover:bg-red-700"
                                        disabled={isDeleting}
                                      >
                                        {isDeleting ? (
                                          <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Menghapus...
                                          </>
                                        ) : (
                                          "Hapus"
                                        )}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </AnimatedCard>
          </FadeIn>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Data Hafalan
            </DialogTitle>
            <DialogDescription>
              Edit data hafalan untuk{" "}
              <strong>{editingRecord?.santriName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-hafalan">Total Hafalan (Juz)</Label>
              <Input
                id="edit-hafalan"
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={editFormData.totalHafalan}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    totalHafalan: Number.parseFloat(e.target.value) || 0,
                  })
                }
                className="h-12"
              />
              <p className="text-xs text-gray-500">
                Masukkan jumlah Juz yang telah dihafal (0-30)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-quality">Kualitas Hafalan</Label>
              <Select
                value={editFormData.quality}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, quality: value })
                }
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Pilih kualitas hafalan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sangat Baik">Sangat Baik</SelectItem>
                  <SelectItem value="Baik">Baik</SelectItem>
                  <SelectItem value="Cukup">Cukup</SelectItem>
                  <SelectItem value="Kurang">Kurang</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Catatan</Label>
              <Textarea
                id="edit-notes"
                placeholder="Tambahkan catatan tentang progress hafalan..."
                value={editFormData.notes}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, notes: e.target.value })
                }
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Batal
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          .bg-gradient-to-r,
          .bg-gradient-to-br {
            background: #4f46e5 !important;
            color: white !important;
          }
        }
      `}</style>
    </div>
  );
}
