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
  Target,
  Settings,
  ArrowLeft,
  Save,
  Eye,
  Palette,
  TrendingUp,
  User,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { supabase } from "@/lib/supabase";
import { AnimatedCard } from "@/components/animated-card";
import { AnimatedButton } from "@/components/animated-button";
import { FadeIn } from "@/components/fade-in";
import { motion } from "framer-motion";

interface TargetHafalan {
  id: string;
  kelas: string;
  target_juz: number;
  merah_min: number;
  merah_max: number;
  kuning_min: number;
  kuning_max: number;
  hijau_min: number;
  hijau_max: number;
  biru_min: number;
  biru_max: number;
  pink_threshold: number;
  created_at: string;
  updated_at: string;
}

interface SantriProgress {
  santriId: string;
  santriName: string;
  kelas: string;
  currentHafalan: number;
  targetJuz: number;
  colorCategory: string;
  progressPercentage: number;
}

interface KelasProgress {
  kelas: string;
  targetJuz: number;
  santriList: SantriProgress[];
  summary: {
    totalSantri: number;
    averageHafalan: number;
    colorDistribution: {
      merah: number;
      kuning: number;
      hijau: number;
      biru: number;
      pink: number;
    };
  };
}

export default function TargetHafalanPage() {
  const { user, hasPermission, isLoading: authLoading } = useAuth();
  const [targetList, setTargetList] = useState<TargetHafalan[]>([]);
  const [availableKelas, setAvailableKelas] = useState<string[]>([]);
  const [kelasProgress, setKelasProgress] = useState<KelasProgress[]>([]);
  const [selectedViewKelas, setSelectedViewKelas] = useState("all");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [formData, setFormData] = useState({
    target_juz: "",
    merah_min: "0",
    merah_max: "4",
    kuning_min: "4.1",
    kuning_max: "7",
    hijau_min: "7.1",
    hijau_max: "11.4",
    biru_min: "11.5",
    biru_max: "20",
    pink_threshold: "30",
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user && hasPermission("manage_users")) {
      loadInitialData();
    }
  }, [user, hasPermission]);

  const loadInitialData = async () => {
    try {
      setDataLoading(true);
      setError("");

      // Load available classes and targets in parallel
      const [ustadzResult, targetResult] = await Promise.all([
        supabase.from("ustadz").select("halaqoh").order("halaqoh"),
        supabase.from("target_hafalan").select("*").order("kelas"),
      ]);

      if (ustadzResult.error) {
        throw new Error(
          "Gagal memuat data kelas: " + ustadzResult.error.message
        );
      }

      if (targetResult.error) {
        throw new Error(
          "Gagal memuat data target: " + targetResult.error.message
        );
      }

      const kelasList =
        [
          ...new Set(ustadzResult.data?.map((u) => u.halaqoh).filter(Boolean)),
        ] || [];
      setAvailableKelas(kelasList);
      setTargetList(targetResult.data || []);

      // Load progress data in background (non-blocking)
      loadProgressDataAsync(targetResult.data || []);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setError(error instanceof Error ? error.message : "Gagal memuat data");
    } finally {
      setDataLoading(false);
    }
  };

  const loadProgressDataAsync = async (targets: TargetHafalan[]) => {
    try {
      // This runs in background, doesn't block UI
      const progressData = await calculateProgressData(targets);
      setKelasProgress(progressData);
    } catch (error) {
      console.error("Error loading progress data:", error);
      // Don't show error to user, this is background operation
    }
  };

  const calculateProgressData = async (
    targets: TargetHafalan[]
  ): Promise<KelasProgress[]> => {
    // Get santri data with timeout
    const santriPromise = supabase
      .from("santri")
      .select("id, name, halaqoh")
      .order("name")
      .limit(100); // Limit to prevent huge queries

    const memorizationPromise = supabase
      .from("memorization")
      .select("santri_id, ayah_to")
      .order("created_at", { ascending: false })
      .limit(1000); // Limit recent records

    const [santriResult, memorizationResult] = await Promise.race([
      Promise.all([santriPromise, memorizationPromise]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000)
      ),
    ]);

    if (santriResult.error || memorizationResult.error) {
      throw new Error("Database query failed");
    }

    const santriData = santriResult.data || [];
    const memorizationData = memorizationResult.data || [];

    // Get latest hafalan for each santri
    const santriHafalanMap = new Map();
    memorizationData.forEach((record) => {
      const santriId = record.santri_id;
      const currentHafalan = record.ayah_to / 10;

      if (
        !santriHafalanMap.has(santriId) ||
        santriHafalanMap.get(santriId) < currentHafalan
      ) {
        santriHafalanMap.set(santriId, currentHafalan);
      }
    });

    // Create progress data
    const santriProgressList: SantriProgress[] = santriData.map((santri) => {
      const target = targets.find((t) => t.kelas === santri.halaqoh);
      const currentHafalan = santriHafalanMap.get(santri.id) || 0;
      const targetJuz = target?.target_juz || 0;
      const colorCategory = getColorCategory(currentHafalan, target);
      const progressPercentage =
        targetJuz > 0 ? Math.round((currentHafalan / targetJuz) * 100) : 0;

      return {
        santriId: santri.id,
        santriName: santri.name,
        kelas: santri.halaqoh,
        currentHafalan,
        targetJuz,
        colorCategory,
        progressPercentage,
      };
    });

    // Group by kelas
    const kelasMap = new Map<string, SantriProgress[]>();
    santriProgressList.forEach((santri) => {
      if (!kelasMap.has(santri.kelas)) {
        kelasMap.set(santri.kelas, []);
      }
      kelasMap.get(santri.kelas)!.push(santri);
    });

    // Calculate summary for each kelas
    const progressData: KelasProgress[] = [];
    kelasMap.forEach((santriList, kelas) => {
      const target = targets.find((t) => t.kelas === kelas);
      const averageHafalan =
        santriList.length > 0
          ? santriList.reduce((sum, s) => sum + s.currentHafalan, 0) /
            santriList.length
          : 0;

      const colorDistribution = {
        merah: santriList.filter((s) => s.colorCategory === "red").length,
        kuning: santriList.filter((s) => s.colorCategory === "yellow").length,
        hijau: santriList.filter((s) => s.colorCategory === "green").length,
        biru: santriList.filter((s) => s.colorCategory === "blue").length,
        pink: santriList.filter((s) => s.colorCategory === "pink").length,
      };

      progressData.push({
        kelas,
        targetJuz: target?.target_juz || 0,
        santriList: santriList
          .sort((a, b) => b.currentHafalan - a.currentHafalan)
          .slice(0, 20), // Limit display
        summary: {
          totalSantri: santriList.length,
          averageHafalan,
          colorDistribution,
        },
      });
    });

    return progressData.sort((a, b) => a.kelas.localeCompare(b.kelas));
  };

  const getColorCategory = (
    hafalan: number,
    target?: TargetHafalan
  ): string => {
    if (!target) return "gray";

    // Pink: Hafal semua (30 Juz atau lebih)
    if (hafalan >= target.pink_threshold) return "pink";

    // Biru: Melampaui target (di atas hijau_max sampai biru_max)
    if (hafalan > target.hijau_max && hafalan <= target.biru_max) return "blue";

    // Hijau: Mencapai target (hijau_min sampai hijau_max)
    if (hafalan >= target.hijau_min && hafalan <= target.hijau_max)
      return "green";

    // Kuning: Mendekati target (kuning_min sampai kuning_max)
    if (hafalan >= target.kuning_min && hafalan <= target.kuning_max)
      return "yellow";

    // Merah: Perlu peningkatan (merah_min sampai merah_max)
    if (hafalan >= target.merah_min && hafalan <= target.merah_max)
      return "red";

    // Default: jika tidak masuk kategori manapun
    return "gray";
  };

  const getColorBadgeClass = (category: string): string => {
    switch (category) {
      case "pink":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "blue":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "green":
        return "bg-green-100 text-green-800 border-green-200";
      case "yellow":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "red":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getColorDescription = (category: string): string => {
    switch (category) {
      case "pink":
        return "Hafal Semua";
      case "blue":
        return "Melampaui Target";
      case "green":
        return "Mencapai Target";
      case "yellow":
        return "Mendekati Target";
      case "red":
        return "Perlu Peningkatan";
      default:
        return "Belum Ada Target";
    }
  };

  const handleSubmit = async () => {
    // clear previous messages
    setError("");
    setSuccess("");

    /* ---------- VALIDATION ---------- */
    if (!selectedKelas?.trim()) {
      setError("Pilih kelas terlebih dahulu!");
      return;
    }
    if (!formData.target_juz?.trim()) {
      setError("Target hafalan wajib diisi!");
      return;
    }
    const targetJuz = Number.parseFloat(formData.target_juz);
    if (isNaN(targetJuz) || targetJuz <= 0 || targetJuz > 30) {
      setError("Target hafalan harus berupa angka antara 0.1 – 30!");
      return;
    }

    setLoading(true);

    try {
      /* ---------- PREP DATA ---------- */
      const targetData = {
        kelas: selectedKelas.trim(),
        target_juz: targetJuz,
        merah_min: Number.parseFloat(formData.merah_min) || 0,
        merah_max: Number.parseFloat(formData.merah_max) || 4,
        kuning_min: Number.parseFloat(formData.kuning_min) || 4.1,
        kuning_max: Number.parseFloat(formData.kuning_max) || 7,
        hijau_min: Number.parseFloat(formData.hijau_min) || 7.1,
        hijau_max: Number.parseFloat(formData.hijau_max) || 11.4,
        biru_min: Number.parseFloat(formData.biru_min) || 11.5,
        biru_max: Number.parseFloat(formData.biru_max) || 20,
        pink_threshold: Number.parseFloat(formData.pink_threshold) || 30,
        updated_at: new Date().toISOString(),
      };

      /* ---------- UPSERT (INSERT OR UPDATE) ---------- */
      const { error } = await supabase
        .from("target_hafalan")
        .upsert(targetData, {
          onConflict: "kelas", // update baris berkelas sama
          ignoreDuplicates: false, // overwrite jika ada
        });

      if (error) throw new Error(error.message);

      /* ---------- SUCCESS ---------- */
      setSuccess(
        isEditing
          ? "Target berhasil diperbarui!"
          : "Target berhasil ditambahkan!"
      );
      resetForm();
      // refresh list (tanpa delay besar)
      loadInitialData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan data";
      setError(msg);
      console.error("Save error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      target_juz: "",
      merah_min: "0",
      merah_max: "4",
      kuning_min: "4.1",
      kuning_max: "7",
      hijau_min: "7.1",
      hijau_max: "11.4",
      biru_min: "11.5",
      biru_max: "20",
      pink_threshold: "30",
    });
    setSelectedKelas("");
    setIsEditing(false);
    setEditingId("");
  };

  const handleEdit = (target: TargetHafalan) => {
    setSelectedKelas(target.kelas);
    setFormData({
      target_juz: target.target_juz.toString(),
      merah_min: target.merah_min.toString(),
      merah_max: target.merah_max.toString(),
      kuning_min: target.kuning_min.toString(),
      kuning_max: target.kuning_max.toString(),
      hijau_min: target.hijau_min.toString(),
      hijau_max: target.hijau_max.toString(),
      biru_min: target.biru_min.toString(),
      biru_max: target.biru_max.toString(),
      pink_threshold: target.pink_threshold.toString(),
    });
    setIsEditing(true);
    setEditingId(target.id);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    resetForm();
    setError("");
    setSuccess("");
  };

  const getFilteredKelasProgress = () => {
    if (selectedViewKelas === "all") {
      return kelasProgress;
    }
    return kelasProgress.filter((kelas) => kelas.kelas === selectedViewKelas);
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            {authLoading ? "Memuat autentikasi..." : "Memuat data..."}
          </p>
          <p className="text-gray-500 text-sm mt-2">Mohon tunggu sebentar</p>
        </motion.div>
      </div>
    );
  }

  if (!user || !hasPermission("manage_users")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-red-600" />
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
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
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Target className="h-8 w-8" />
                  Target Hafalan Kelas
                </h1>
                <p className="text-purple-100">
                  Kelola target hafalan per kelas - semua santri dalam satu
                  kelas memiliki target yang sama
                </p>
                <div className="mt-4 p-4 bg-white/10 rounded-lg border border-white/20">
                  <p className="text-sm text-purple-100">
                    💡 <strong>Cara Kerja:</strong> Target ditetapkan per kelas
                    (misal: Kelas 7 target 10 Juz). Semua santri di kelas
                    tersebut memiliki target yang sama, tapi progress individual
                    berbeda-beda.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Color Legend */}
          <FadeIn delay={0.2}>
            <AnimatedCard className="mb-8 border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Kategori Warna Progress Santri
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Sistem warna untuk menunjukkan progress setiap santri terhadap
                  target kelasnya
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[
                    {
                      color: "red",
                      label: "🔴 Merah",
                      desc: "Perlu Peningkatan",
                      example: "Sesuai rentang merah",
                    },
                    {
                      color: "yellow",
                      label: "🟡 Kuning",
                      desc: "Mendekati Target",
                      example: "Sesuai rentang kuning",
                    },
                    {
                      color: "green",
                      label: "🟢 Hijau",
                      desc: "Mencapai Target",
                      example: "Sesuai rentang hijau",
                    },
                    {
                      color: "blue",
                      label: "🔵 Biru",
                      desc: "Melampaui Target",
                      example: "Di atas target hijau",
                    },
                    {
                      color: "pink",
                      label: "🩷 Pink",
                      desc: "Hafal Semua",
                      example: "30 Juz lengkap",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.color}
                      className="text-center p-4 rounded-xl bg-white border-2 border-gray-100 hover:shadow-md transition-shadow"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <Badge
                        className={`${getColorBadgeClass(
                          item.color
                        )} mb-2 text-sm px-3 py-1 border`}
                      >
                        {item.label}
                      </Badge>
                      <p className="text-xs text-gray-600 font-medium">
                        {item.desc}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.example}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </AnimatedCard>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Target */}
            <FadeIn delay={0.3}>
              <AnimatedCard className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {isEditing ? "Edit Target Kelas" : "Tambah Target Kelas"}
                  </CardTitle>
                  <CardDescription className="text-purple-100">
                    {isEditing
                      ? "Perbarui target dan kategori warna untuk kelas"
                      : "Tetapkan target hafalan untuk semua santri di kelas"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
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
                      htmlFor="kelas"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Pilih Kelas *
                    </Label>
                    <Select
                      value={selectedKelas}
                      onValueChange={setSelectedKelas}
                      disabled={isEditing || loading}
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue placeholder="Pilih Kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableKelas.map((kelas) => (
                          <SelectItem key={kelas} value={kelas}>
                            {kelas}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Target ini akan berlaku untuk{" "}
                      <strong>semua santri</strong> di kelas yang dipilih
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="target_juz"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Target Hafalan Kelas (Juz) *
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="30"
                      placeholder="Contoh: 10.0"
                      value={formData.target_juz}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          target_juz: e.target.value,
                        }))
                      }
                      className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500">
                      Semua santri di kelas ini akan memiliki target yang sama
                    </p>
                  </div>

                  {/* Simplified Color Range Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Pengaturan Kategori Warna
                    </h3>
                    <p className="text-sm text-gray-600">
                      Santri akan dikategorikan berdasarkan hafalan mereka:
                      Merah (0-max), Kuning (min-max), Hijau (min-max untuk
                      target), Biru (di atas hijau), Pink (hafal semua)
                    </p>

                    {/* Quick preset buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            merah_min: "0",
                            merah_max: "4",
                            kuning_min: "4.1",
                            kuning_max: "7",
                            hijau_min: "7.1",
                            hijau_max: "11.4",
                            biru_min: "11.5",
                            biru_max: "20",
                            pink_threshold: "30",
                          }));
                        }}
                      >
                        Preset Default
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loading || !formData.target_juz}
                        onClick={() => {
                          const target =
                            Number.parseFloat(formData.target_juz) || 10;
                          setFormData((prev) => ({
                            ...prev,
                            merah_min: "0",
                            merah_max: (target * 0.4).toFixed(1),
                            kuning_min: (target * 0.4 + 0.1).toFixed(1),
                            kuning_max: (target * 0.7).toFixed(1),
                            hijau_min: (target * 0.7 + 0.1).toFixed(1),
                            hijau_max: (target * 1.2).toFixed(1),
                            biru_min: (target * 1.2 + 0.1).toFixed(1),
                            biru_max: "25",
                            pink_threshold: "30",
                          }));
                        }}
                      >
                        Auto dari Target
                      </Button>
                    </div>

                    {/* Simplified color ranges */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-red-700 font-medium">
                            🔴 Merah (Maksimal)
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.merah_max}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                merah_max: e.target.value,
                              }))
                            }
                            className="border-red-200 focus:border-red-500"
                            disabled={loading}
                          />
                          <p className="text-xs text-red-600">
                            0 - {formData.merah_max} Juz
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-yellow-700 font-medium">
                            🟡 Kuning (Maksimal)
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.kuning_max}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                kuning_max: e.target.value,
                              }))
                            }
                            className="border-yellow-200 focus:border-yellow-500"
                            disabled={loading}
                          />
                          <p className="text-xs text-yellow-600">
                            {(
                              Number.parseFloat(formData.merah_max) + 0.1
                            ).toFixed(1)}{" "}
                            - {formData.kuning_max} Juz
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-green-700 font-medium">
                            🟢 Hijau (Maksimal)
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.hijau_max}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                hijau_max: e.target.value,
                              }))
                            }
                            className="border-green-200 focus:border-green-500"
                            disabled={loading}
                          />
                          <p className="text-xs text-green-600">
                            {(
                              Number.parseFloat(formData.kuning_max) + 0.1
                            ).toFixed(1)}{" "}
                            - {formData.hijau_max} Juz
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-blue-700 font-medium">
                            🔵 Biru (Maksimal)
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.biru_max}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                biru_max: e.target.value,
                              }))
                            }
                            className="border-blue-200 focus:border-blue-500"
                            disabled={loading}
                          />
                          <p className="text-xs text-blue-600">
                            {(
                              Number.parseFloat(formData.hijau_max) + 0.1
                            ).toFixed(1)}{" "}
                            - {formData.biru_max} Juz
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-pink-700 font-medium">
                          🩷 Pink (Minimal untuk Hafal Semua)
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.pink_threshold}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              pink_threshold: e.target.value,
                            }))
                          }
                          className="border-pink-200 focus:border-pink-500"
                          disabled={loading}
                        />
                        <p className="text-xs text-pink-600">
                          {formData.pink_threshold}+ Juz (Biasanya 30 Juz)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <AnimatedButton
                      onClick={handleSubmit}
                      className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        loading || !selectedKelas || !formData.target_juz
                      }
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isEditing ? "Memperbarui..." : "Menyimpan..."}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          {isEditing ? "Perbarui" : "Simpan"} Target
                        </div>
                      )}
                    </AnimatedButton>
                    {isEditing && (
                      <AnimatedButton
                        onClick={handleCancel}
                        variant="outline"
                        className="flex-1 h-12 rounded-xl"
                        disabled={loading}
                      >
                        Batal
                      </AnimatedButton>
                    )}
                  </div>
                </CardContent>
              </AnimatedCard>
            </FadeIn>

            {/* Progress Overview Per Santri */}
            <div className="lg:col-span-2">
              <FadeIn delay={0.4}>
                <AnimatedCard className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Progress Santri Terhadap Target Kelas
                    </CardTitle>
                    <CardDescription className="text-indigo-100">
                      Lihat bagaimana setiap santri mencapai target kelas mereka
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Filter Kelas */}
                    <div className="mb-6">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Filter Kelas
                      </Label>
                      <Select
                        value={selectedViewKelas}
                        onValueChange={setSelectedViewKelas}
                      >
                        <SelectTrigger className="w-64 h-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
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

                    <div className="space-y-6 max-h-96 overflow-y-auto">
                      {getFilteredKelasProgress().length === 0 ? (
                        <div className="text-center py-8">
                          <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">
                            Belum ada data progress santri
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Tambahkan target kelas untuk melihat progress santri
                          </p>
                        </div>
                      ) : (
                        getFilteredKelasProgress().map(
                          (kelasData, kelasIndex) => (
                            <motion.div
                              key={kelasData.kelas}
                              className="border rounded-xl p-6 bg-white shadow-sm"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 + kelasIndex * 0.1 }}
                            >
                              {/* Kelas Header */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <Users className="h-6 w-6 text-indigo-600" />
                                  <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                      {kelasData.kelas}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      Target Kelas:{" "}
                                      <strong>{kelasData.targetJuz} Juz</strong>{" "}
                                      untuk semua santri
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge className="bg-purple-100 text-purple-800 mb-1">
                                    {kelasData.summary.totalSantri} Santri
                                  </Badge>
                                  <p className="text-xs text-gray-600">
                                    Rata-rata:{" "}
                                    {kelasData.summary.averageHafalan.toFixed(
                                      1
                                    )}{" "}
                                    Juz
                                  </p>
                                </div>
                              </div>

                              {/* Color Distribution Summary */}
                              <div className="grid grid-cols-5 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                                {[
                                  {
                                    color: "red",
                                    count:
                                      kelasData.summary.colorDistribution.merah,
                                    label: "🔴",
                                  },
                                  {
                                    color: "yellow",
                                    count:
                                      kelasData.summary.colorDistribution
                                        .kuning,
                                    label: "🟡",
                                  },
                                  {
                                    color: "green",
                                    count:
                                      kelasData.summary.colorDistribution.hijau,
                                    label: "🟢",
                                  },
                                  {
                                    color: "blue",
                                    count:
                                      kelasData.summary.colorDistribution.biru,
                                    label: "🔵",
                                  },
                                  {
                                    color: "pink",
                                    count:
                                      kelasData.summary.colorDistribution.pink,
                                    label: "🩷",
                                  },
                                ].map((item) => (
                                  <div key={item.color} className="text-center">
                                    <div className="text-lg font-bold text-gray-900">
                                      {item.count}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {item.label}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Santri List */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Progress Individual Santri (Top 20):
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                                  {kelasData.santriList.map(
                                    (santri, santriIndex) => (
                                      <motion.div
                                        key={santri.santriId}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border"
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{
                                          delay:
                                            0.6 +
                                            kelasIndex * 0.1 +
                                            santriIndex * 0.02,
                                        }}
                                      >
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900 text-sm">
                                            {santri.santriName}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-gray-600">
                                              <strong>
                                                {santri.currentHafalan}
                                              </strong>{" "}
                                              / {santri.targetJuz} Juz
                                            </p>
                                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                              <div
                                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                                  santri.colorCategory === "red"
                                                    ? "bg-red-500"
                                                    : santri.colorCategory ===
                                                      "yellow"
                                                    ? "bg-yellow-500"
                                                    : santri.colorCategory ===
                                                      "green"
                                                    ? "bg-green-500"
                                                    : santri.colorCategory ===
                                                      "blue"
                                                    ? "bg-blue-500"
                                                    : santri.colorCategory ===
                                                      "pink"
                                                    ? "bg-pink-500"
                                                    : "bg-gray-400"
                                                }`}
                                                style={{
                                                  width: `${Math.min(
                                                    santri.progressPercentage,
                                                    100
                                                  )}%`,
                                                }}
                                              ></div>
                                            </div>
                                            <span className="text-xs font-medium text-gray-700">
                                              {santri.progressPercentage}%
                                            </span>
                                          </div>
                                        </div>
                                        <Badge
                                          className={`${getColorBadgeClass(
                                            santri.colorCategory
                                          )} text-xs border ml-2`}
                                        >
                                          {getColorDescription(
                                            santri.colorCategory
                                          )}
                                        </Badge>
                                      </motion.div>
                                    )
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )
                        )
                      )}
                    </div>
                  </CardContent>
                </AnimatedCard>
              </FadeIn>
            </div>
          </div>

          {/* Target List */}
          <FadeIn delay={0.5}>
            <AnimatedCard className="mt-8 border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Daftar Target Kelas ({targetList.length})
                </CardTitle>
                <CardDescription className="text-green-100">
                  Semua target hafalan yang telah ditetapkan untuk setiap kelas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {targetList.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Belum ada target yang ditetapkan
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Tambahkan target untuk mulai memantau progress santri
                      </p>
                    </div>
                  ) : (
                    targetList.map((target, index) => (
                      <motion.div
                        key={target.id}
                        className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Users className="h-6 w-6 text-green-600" />
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {target.kelas}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Target untuk semua santri di kelas ini
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-purple-100 text-purple-800 text-sm px-3 py-1">
                              Target: {target.target_juz} Juz
                            </Badge>
                            <AnimatedButton
                              onClick={() => handleEdit(target)}
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                              disabled={loading}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Edit
                            </AnimatedButton>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-xs font-medium text-red-700 mb-1">
                              🔴 Merah
                            </p>
                            <p className="text-sm text-red-800 font-medium">
                              0 - {target.merah_max} Juz
                            </p>
                            <p className="text-xs text-red-600">
                              Perlu Peningkatan
                            </p>
                          </div>
                          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-xs font-medium text-yellow-700 mb-1">
                              🟡 Kuning
                            </p>
                            <p className="text-sm text-yellow-800 font-medium">
                              {(
                                Number.parseFloat(target.merah_max.toString()) +
                                0.1
                              ).toFixed(1)}{" "}
                              - {target.kuning_max} Juz
                            </p>
                            <p className="text-xs text-yellow-600">
                              Mendekati Target
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs font-medium text-green-700 mb-1">
                              🟢 Hijau
                            </p>
                            <p className="text-sm text-green-800 font-medium">
                              {(
                                Number.parseFloat(
                                  target.kuning_max.toString()
                                ) + 0.1
                              ).toFixed(1)}{" "}
                              - {target.hijau_max} Juz
                            </p>
                            <p className="text-xs text-green-600">
                              Mencapai Target
                            </p>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs font-medium text-blue-700 mb-1">
                              🔵 Biru
                            </p>
                            <p className="text-sm text-blue-800 font-medium">
                              {(
                                Number.parseFloat(target.hijau_max.toString()) +
                                0.1
                              ).toFixed(1)}{" "}
                              - {target.biru_max} Juz
                            </p>
                            <p className="text-xs text-blue-600">
                              Melampaui Target
                            </p>
                          </div>
                          <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                            <p className="text-xs font-medium text-pink-700 mb-1">
                              🩷 Pink
                            </p>
                            <p className="text-sm text-pink-800 font-medium">
                              {target.pink_threshold}+ Juz
                            </p>
                            <p className="text-xs text-pink-600">Hafal Semua</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
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
