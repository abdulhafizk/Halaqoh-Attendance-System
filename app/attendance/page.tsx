"use client";

import { useState, useEffect } from "react";
import {
  Card,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UserCheck,
  User,
  ArrowLeft,
  Plus,
  Clock,
  AlertTriangle,
  Heart,
  FileText,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { supabase, type Ustadz, type Attendance } from "@/lib/supabase-client";

export default function AttendancePage() {
  const { user, hasPermission, isLoading } = useAuth();
  const [ustadzList, setUstadzList] = useState<Ustadz[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [selectedUstadz, setSelectedUstadz] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceData, setAttendanceData] = useState({
    sabaq: false,
    sabqi: false,
    manzil: false,
    alpha: false,
    sakit: false,
    izin: false,
    notes: "",
  });
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if user can access admin features (Alpha, Sakit, Izin)
  const canAccessAdminFeatures =
    hasPermission("manage_users") ||
    user?.role === "masul_tahfidz" ||
    user?.role === "tim_tahfidz";

  useEffect(() => {
    if (user && hasPermission("manage_attendance")) {
      setHasAccess(true);
    } else {
      setHasAccess(false);
    }
  }, [user, hasPermission]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: ustadzData } = await supabase
          .from("ustadz")
          .select("*")
          .order("created_at", { ascending: false });
        const { data: attendanceData } = await supabase
          .from("attendance")
          .select(
            `
            *,
            ustadz:ustadz_id (
              name,
              kelas
            )
          `
          )
          .order("created_at", { ascending: false });

        setUstadzList(ustadzData || []);
        setAttendanceRecords(attendanceData || []);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Gagal memuat data");
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  // Real-time subscriptions
  useEffect(() => {
    const attendanceChannel = supabase
      .channel("attendance_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
        },
        (payload) => {
          console.log("Real-time attendance update:", payload.eventType);
          loadAttendanceData();
        }
      )
      .subscribe();

    const ustadzChannel = supabase
      .channel("ustadz_realtime_attendance")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ustadz",
        },
        (payload) => {
          console.log(
            "Real-time ustadz update for attendance:",
            payload.eventType
          );
          loadUstadzData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(ustadzChannel);
    };
  }, []);

  const loadAttendanceData = async () => {
    try {
      const { data } = await supabase
        .from("attendance")
        .select(
          `
          *,
          ustadz:ustadz_id (
            name,
            kelas
          )
        `
        )
        .order("created_at", { ascending: false });

      setAttendanceRecords(data || []);
    } catch (error) {
      console.error("Error loading attendance:", error);
    }
  };

  const loadUstadzData = async () => {
    try {
      const { data } = await supabase
        .from("ustadz")
        .select("*")
        .order("created_at", { ascending: false });
      setUstadzList(data || []);
    } catch (error) {
      console.error("Error loading ustadz:", error);
    }
  };

  const handleSubmitAttendance = async () => {
    if (!selectedUstadz) {
      setError("Mohon pilih ustadz terlebih dahulu!");
      return;
    }

    // Validate that at least one attendance type is selected
    const hasAnyAttendance =
      attendanceData.sabaq ||
      attendanceData.sabqi ||
      attendanceData.manzil ||
      attendanceData.alpha ||
      attendanceData.sakit ||
      attendanceData.izin;

    if (!hasAnyAttendance) {
      setError("Mohon pilih minimal satu jenis kehadiran!");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Check if attendance already exists for this ustadz and date
      const { data: existingAttendance } = await supabase
        .from("attendance")
        .select("id")
        .eq("ustadz_id", selectedUstadz)
        .eq("date", selectedDate)
        .single();

      if (existingAttendance) {
        // Update existing attendance
        const { error } = await supabase
          .from("attendance")
          .update({
            sabaq: attendanceData.sabaq,
            sabqi: attendanceData.sabqi,
            manzil: attendanceData.manzil,
            alpha: attendanceData.alpha,
            sakit: attendanceData.sakit,
            izin: attendanceData.izin,
            notes: attendanceData.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingAttendance.id);

        if (error) {
          console.error("Error updating attendance:", error);
          setError("Gagal memperbarui absensi: " + error.message);
          return;
        }

        setSuccess("Absensi berhasil diperbarui!");
      } else {
        // Create new attendance
        const { error } = await supabase.from("attendance").insert([
          {
            ustadz_id: selectedUstadz,
            date: selectedDate,
            sabaq: attendanceData.sabaq,
            sabqi: attendanceData.sabqi,
            manzil: attendanceData.manzil,
            alpha: attendanceData.alpha,
            sakit: attendanceData.sakit,
            izin: attendanceData.izin,
            notes: attendanceData.notes,
          },
        ]);

        if (error) {
          console.error("Error inserting attendance:", error);
          setError("Gagal menyimpan absensi: " + error.message);
          return;
        }

        setSuccess("Absensi berhasil disimpan!");
      }

      // Reset form
      setSelectedUstadz("");
      setAttendanceData({
        sabaq: false,
        sabqi: false,
        manzil: false,
        alpha: false,
        sakit: false,
        izin: false,
        notes: "",
      });
    } catch (error) {
      console.error("Error submitting attendance:", error);
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceBadges = (record: Attendance) => {
    const badges = [];

    // Waktu Kehadiran (accessible by all users)
    if (record.sabaq)
      badges.push(
        <Badge key="sabaq" className="bg-green-100 text-green-800">
          Sabaq
        </Badge>
      );
    if (record.sabqi)
      badges.push(
        <Badge key="sabqi" className="bg-blue-100 text-blue-800">
          Sabqi
        </Badge>
      );
    if (record.manzil)
      badges.push(
        <Badge key="manzil" className="bg-purple-100 text-purple-800">
          Manzil
        </Badge>
      );

    // Status Ketidakhadiran (only for admin/masul/tim)
    if (record.alpha)
      badges.push(
        <Badge key="alpha" className="bg-red-100 text-red-800">
          Alpha
        </Badge>
      );
    if (record.sakit)
      badges.push(
        <Badge key="sakit" className="bg-orange-100 text-orange-800">
          Sakit
        </Badge>
      );
    if (record.izin)
      badges.push(
        <Badge key="izin" className="bg-yellow-100 text-yellow-800">
          Izin
        </Badge>
      );

    return badges;
  };

  const getRecentAttendance = () => {
    return attendanceRecords
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Absensi Ustadz
            </h1>
            <p className="text-gray-600">
              Catat kehadiran ustadz dalam kegiatan Tahfidz Hubbul Khoir
            </p>

            {canAccessAdminFeatures && (
              <Alert className="mt-4 border-blue-200 bg-blue-50">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-blue-700">
                  <strong>Admin/Masul/Tim:</strong> Anda memiliki akses ke fitur
                  Alpha, Sakit, dan Izin.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Input Absensi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Input Absensi
                </CardTitle>
                <CardDescription>Catat kehadiran ustadz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label htmlFor="ustadz">Pilih Ustadz *</Label>
                  <Select
                    value={selectedUstadz}
                    onValueChange={setSelectedUstadz}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Ustadz" />
                    </SelectTrigger>
                    <SelectContent>
                      {ustadzList.map((ustadz) => (
                        <SelectItem key={ustadz.id} value={ustadz.id}>
                          {ustadz.name} - {ustadz.kelas}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                {/* Waktu Kehadiran - Accessible by all users */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-900">
                    Waktu Kehadiran
                  </Label>
                  <div className="grid grid-cols-1 gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sabaq"
                        checked={attendanceData.sabaq}
                        onCheckedChange={(checked) =>
                          setAttendanceData((prev) => ({
                            ...prev,
                            sabaq: checked as boolean,
                          }))
                        }
                      />
                      <Label
                        htmlFor="sabaq"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Clock className="h-4 w-4 text-green-600" />
                        Sabaq
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sabqi"
                        checked={attendanceData.sabqi}
                        onCheckedChange={(checked) =>
                          setAttendanceData((prev) => ({
                            ...prev,
                            sabqi: checked as boolean,
                          }))
                        }
                      />
                      <Label
                        htmlFor="sabqi"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Clock className="h-4 w-4 text-blue-600" />
                        Sabqi
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="manzil"
                        checked={attendanceData.manzil}
                        onCheckedChange={(checked) =>
                          setAttendanceData((prev) => ({
                            ...prev,
                            manzil: checked as boolean,
                          }))
                        }
                      />
                      <Label
                        htmlFor="manzil"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Clock className="h-4 w-4 text-purple-600" />
                        Manzil
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Status Ketidakhadiran - Only for Admin/Masul/Tim */}
                {canAccessAdminFeatures && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-semibold text-gray-900">
                        Status Ketidakhadiran
                      </Label>
                      <Badge variant="outline" className="text-xs">
                        Admin/Masul/Tim
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="alpha"
                          checked={attendanceData.alpha}
                          onCheckedChange={(checked) =>
                            setAttendanceData((prev) => ({
                              ...prev,
                              alpha: checked as boolean,
                            }))
                          }
                        />
                        <Label
                          htmlFor="alpha"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          Alpha
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sakit"
                          checked={attendanceData.sakit}
                          onCheckedChange={(checked) =>
                            setAttendanceData((prev) => ({
                              ...prev,
                              sakit: checked as boolean,
                            }))
                          }
                        />
                        <Label
                          htmlFor="sakit"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Heart className="h-4 w-4 text-orange-600" />
                          Sakit
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="izin"
                          checked={attendanceData.izin}
                          onCheckedChange={(checked) =>
                            setAttendanceData((prev) => ({
                              ...prev,
                              izin: checked as boolean,
                            }))
                          }
                        />
                        <Label
                          htmlFor="izin"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <FileText className="h-4 w-4 text-yellow-600" />
                          Izin
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    placeholder="Catatan tambahan..."
                    value={attendanceData.notes}
                    onChange={(e) =>
                      setAttendanceData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                  />
                </div>

                <Button
                  onClick={handleSubmitAttendance}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!selectedUstadz || loading}
                >
                  {loading ? "Menyimpan..." : "Simpan Absensi"}
                </Button>
              </CardContent>
            </Card>

            {/* Daftar Absensi Terbaru */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Absensi Terbaru
                </CardTitle>
                <CardDescription>
                  10 data absensi terbaru yang diinput
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getRecentAttendance().length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Belum ada data absensi
                    </p>
                  ) : (
                    getRecentAttendance().map((record) => (
                      <div key={record.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">
                              {record.ustadz?.name}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(record.date).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Kelas:</span>{" "}
                            {record.ustadz?.kelas}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {getAttendanceBadges(record)}
                          </div>
                          {record.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              {record.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
