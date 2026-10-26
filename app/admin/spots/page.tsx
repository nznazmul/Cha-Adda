"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Coffee,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Navigation,
  ShieldCheck,
  Building
} from "lucide-react";
import { MeetingSpot } from "@/types/database";
import {
  fetchAdminSpots,
  createMeetingSpot,
  updateMeetingSpot,
  deleteMeetingSpot
} from "@/lib/services/meeting-spots-service";

interface SpotFormData {
  name: string;
  area: string;
  city: string;
  address: string;
  tip: string;
  google_maps_url: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
}

const DEFAULT_FORM: SpotFormData = {
  name: "",
  area: "",
  city: "Dhaka",
  address: "",
  tip: "",
  google_maps_url: "",
  image_url: "",
  is_active: true,
  display_order: 1,
};

export default function AdminMeetingSpotsPage() {
  const [spots, setSpots] = useState<MeetingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [notice, setNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<MeetingSpot | null>(null);
  const [formData, setFormData] = useState<SpotFormData>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation modal state
  const [deletingSpot, setDeletingSpot] = useState<MeetingSpot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showNotice = useCallback((text: string, type: "success" | "error") => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 3500);
  }, []);

  const loadSpots = useCallback(async () => {
    try {
      const data = await fetchAdminSpots();
      setSpots(data);
    } catch (err) {
      console.error("Error loading meeting spots:", err);
      showNotice("স্পটের তালিকা লোড করতে সমস্যা হয়েছে।", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    let isMounted = true;
    fetchAdminSpots()
      .then((data) => {
        if (isMounted) {
          setSpots(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading meeting spots:", err);
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const openCreateModal = () => {
    setEditingSpot(null);
    setFormData({
      ...DEFAULT_FORM,
      display_order: spots.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (spot: MeetingSpot) => {
    setEditingSpot(spot);
    setFormData({
      name: spot.name,
      area: spot.area,
      city: spot.city || "Dhaka",
      address: spot.address || "",
      tip: spot.tip || "",
      google_maps_url: spot.google_maps_url || "",
      image_url: spot.image_url || "",
      is_active: spot.is_active,
      display_order: spot.display_order ?? 1,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSpot(null);
    setIsSubmitting(false);
  };

  const handleSaveSpot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showNotice("ক্যাফে/স্পটের নাম দেওয়া আবশ্যক।", "error");
      return;
    }

    if (!formData.area.trim()) {
      showNotice("এলাকা বা লোকেশন উল্লেখ করা আবশ্যক।", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSpot) {
        // Edit spot
        const res = await updateMeetingSpot(editingSpot.id, {
          name: formData.name.trim(),
          area: formData.area.trim(),
          city: formData.city.trim(),
          address: formData.address.trim() || null,
          tip: formData.tip.trim() || null,
          google_maps_url: formData.google_maps_url.trim() || null,
          image_url: formData.image_url.trim() || null,
          is_active: formData.is_active,
          display_order: Number(formData.display_order) || 1,
        });

        if (res.success) {
          showNotice(`"${formData.name}" স্পটটি সফলভাবে আপডেট করা হয়েছে।`, "success");
          closeModal();
          await loadSpots();
        } else {
          showNotice(res.error || "আপডেট ব্যর্থ হয়েছে।", "error");
        }
      } else {
        // Create new spot
        const res = await createMeetingSpot({
          name: formData.name.trim(),
          area: formData.area.trim(),
          city: formData.city.trim(),
          address: formData.address.trim() || null,
          tip: formData.tip.trim() || null,
          google_maps_url: formData.google_maps_url.trim() || null,
          image_url: formData.image_url.trim() || null,
          is_active: formData.is_active,
          display_order: Number(formData.display_order) || 1,
        });

        if (res.success) {
          showNotice(`নতুন স্পট "${formData.name}" সফলভাবে যুক্ত করা হয়েছে।`, "success");
          closeModal();
          await loadSpots();
        } else {
          showNotice(res.error || "স্পট যোগ করতে সমস্যা হয়েছে।", "error");
        }
      }
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : "Error saving meeting spot.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (spot: MeetingSpot) => {
    const newStatus = !spot.is_active;
    // Optimistic update
    setSpots((prev) =>
      prev.map((s) => (s.id === spot.id ? { ...s, is_active: newStatus } : s))
    );

    const res = await updateMeetingSpot(spot.id, { is_active: newStatus });
    if (res.success) {
      showNotice(
        `"${spot.name}" এখন ${newStatus ? "সক্রিয় (Active)" : "নিষ্ক্রিয় (Inactive)"} করা হয়েছে।`,
        "success"
      );
    } else {
      showNotice("স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।", "error");
      await loadSpots();
    }
  };

  const confirmDelete = async () => {
    if (!deletingSpot) return;

    setIsDeleting(true);
    try {
      const res = await deleteMeetingSpot(deletingSpot.id);
      if (res.success) {
        setSpots((prev) => prev.filter((s) => s.id !== deletingSpot.id));
        showNotice(`"${deletingSpot.name}" মুছে ফেলা হয়েছে।`, "success");
        setDeletingSpot(null);
      } else {
        showNotice(res.error || "স্পট মুছে ফেলতে সমস্যা হয়েছে।", "error");
      }
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : "Error deleting spot.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered spots
  const filteredSpots = spots.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.area.toLowerCase().includes(search.toLowerCase()) ||
      (s.tip && s.tip.toLowerCase().includes(search.toLowerCase())) ||
      (s.city && s.city.toLowerCase().includes(search.toLowerCase()));

    const matchesCity = cityFilter === "all" || s.city.toLowerCase() === cityFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && s.is_active) ||
      (statusFilter === "inactive" && !s.is_active);

    return matchesSearch && matchesCity && matchesStatus;
  });

  const activeCount = spots.filter((s) => s.is_active).length;
  const inactiveCount = spots.filter((s) => !s.is_active).length;
  const cities = Array.from(new Set(spots.map((s) => s.city || "Dhaka")));

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500/20 to-rose-500/10 text-amber-500 border border-amber-500/20 shadow-sm">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                <span>Safe Meeting Spots</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  নিরাপদ ক্যাফে স্পট
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                ব্যবহারকারীদের প্রথম ডেট ও নিরাপদ আড্ডার জন্য অনুমোদিত ক্যাফে ও মিটিং স্পট পরিচালনা করুন।
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold shadow-md shadow-amber-500/25 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>New Meeting Spot (নতুন স্পট)</span>
        </button>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`rounded-2xl border p-4 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in transition-all ${
            notice.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter("all")}
          className={`cursor-pointer rounded-2xl border p-4 bg-card transition-all shadow-sm ${
            statusFilter === "all" ? "border-primary ring-2 ring-primary/20" : "border-border/80 hover:bg-secondary/40"
          }`}
        >
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Total Spots</span>
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black mt-1 text-foreground">{spots.length}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">নিরাপদ স্পট সংখ্যা</div>
        </div>

        <div
          onClick={() => setStatusFilter("active")}
          className={`cursor-pointer rounded-2xl border p-4 bg-card transition-all shadow-sm ${
            statusFilter === "active" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-border/80 hover:bg-secondary/40"
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Active Spots</span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-black mt-1 text-foreground">{activeCount}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">চ্যাটে দেখানো হচ্ছে</div>
        </div>

        <div
          onClick={() => setStatusFilter("inactive")}
          className={`cursor-pointer rounded-2xl border p-4 bg-card transition-all shadow-sm ${
            statusFilter === "inactive" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-border/80 hover:bg-secondary/40"
          }`}
        >
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>Inactive Spots</span>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black mt-1 text-foreground">{inactiveCount}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">লুকানো স্পট</div>
        </div>

        <div className="rounded-2xl border border-border/80 p-4 bg-card shadow-sm">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Coverage Areas</span>
            <Building className="h-4 w-4 text-violet-500" />
          </div>
          <div className="text-2xl font-black mt-1 text-foreground">{cities.length} Cities</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{cities.join(", ") || "Dhaka"}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by spot name, area, or keywords..."
            className="w-full rounded-2xl border border-border/80 bg-card py-2.5 pl-10 pr-4 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-2xl border border-border/80 bg-card px-3.5 py-2.5 text-xs font-semibold focus:border-primary focus:outline-none shadow-sm"
        >
          <option value="all">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          className="rounded-2xl border border-border/80 bg-card px-3.5 py-2.5 text-xs font-semibold focus:border-primary focus:outline-none shadow-sm"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Spots List View */}
      {loading ? (
        <div className="p-16 text-center text-xs text-muted-foreground bg-card rounded-3xl border border-border">
          ক্যাফে ও মিটিং স্পট লোড হচ্ছে...
        </div>
      ) : filteredSpots.length === 0 ? (
        <div className="p-16 text-center text-xs text-muted-foreground bg-card rounded-3xl border border-border space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto">
            <Coffee className="h-6 w-6" />
          </div>
          <div className="font-bold text-sm text-foreground">কোনো মিটিং স্পট পাওয়া যায়নি</div>
          <p className="text-muted-foreground max-w-sm mx-auto text-xs">
            নতুন মিটিং স্পট যুক্ত করতে উপরের &quot;New Meeting Spot&quot; বাটনে ক্লিক করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSpots.map((spot) => (
            <div
              key={spot.id}
              className={`rounded-3xl border bg-card overflow-hidden shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                spot.is_active ? "border-border/80" : "border-border/50 opacity-75 bg-card/60"
              }`}
            >
              <div>
                {/* Image Banner */}
                <div className="relative h-36 w-full bg-secondary/80 overflow-hidden">
                  {spot.image_url ? (
                    <img
                      src={spot.image_url}
                      alt={spot.name}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-amber-500/10 to-rose-500/10 text-amber-500">
                      <Coffee className="h-10 w-10 opacity-40" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-xs ${
                        spot.is_active
                          ? "bg-emerald-500/90 text-white"
                          : "bg-zinc-800/90 text-zinc-300"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${spot.is_active ? "bg-white" : "bg-zinc-400"}`} />
                      <span>{spot.is_active ? "Active" : "Inactive"}</span>
                    </span>
                  </div>

                  {/* City Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-md border border-border/80 text-[10px] font-bold text-foreground">
                      {spot.city || "Dhaka"}
                    </span>
                  </div>
                </div>

                {/* Spot Details */}
                <div className="p-4 sm:p-5 space-y-2.5">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground tracking-tight flex items-center gap-1.5">
                      <span>{spot.name}</span>
                    </h3>
                    <p className="text-xs text-amber-500 font-semibold flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{spot.area}</span>
                    </p>
                  </div>

                  {spot.address && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {spot.address}
                    </p>
                  )}

                  {spot.tip && (
                    <div className="rounded-xl border border-border/60 bg-secondary/40 p-2.5 text-[11px] text-muted-foreground flex items-start gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                      <span className="leading-relaxed">{spot.tip}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="p-4 sm:p-5 pt-0 border-t border-border/60 flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-1.5">
                  {spot.google_maps_url ? (
                    <a
                      href={spot.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border/80 bg-secondary/50 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      title="Open Google Maps Location"
                    >
                      <Navigation className="h-3 w-3 text-sky-400" />
                      <span>Maps</span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                    </a>
                  ) : null}

                  {/* Toggle Active Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(spot)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                      spot.is_active
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                    }`}
                    title={spot.is_active ? "Deactivate Spot" : "Activate Spot"}
                  >
                    {spot.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{spot.is_active ? "Hide" : "Show"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => openEditModal(spot)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-bold transition-all active:scale-95 shadow-xs"
                    title="Edit Spot Details"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Edit</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => setDeletingSpot(spot)}
                    className="p-1.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all active:scale-95"
                    title="Delete Meeting Spot"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Spot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-black shadow-md shadow-amber-500/20">
                  <Coffee className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    {editingSpot ? "Edit Meeting Spot" : "Add Safe Meeting Spot"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {editingSpot ? "ক্যাফে বা স্পটের তথ্য হালনাগাদ করুন" : "নতুন নিরাপদ ক্যাফে বা ডেটিং স্পট যুক্ত করুন"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSpot} className="space-y-4">
              {/* Spot Name */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Spot / Cafe Name (ক্যাফের নাম) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. North End Coffee Roasters"
                  className="w-full rounded-2xl border border-border/80 bg-background px-3.5 py-2.5 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                />
              </div>

              {/* Area & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Area / Location (এলাকা) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="e.g. Banani 11 / Dhanmondi 27"
                    className="w-full rounded-2xl border border-border/80 bg-background px-3.5 py-2.5 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    City (শহর) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Dhaka, Chittagong, Sylhet"
                    className="w-full rounded-2xl border border-border/80 bg-background px-3.5 py-2.5 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                  />
                </div>
              </div>

              {/* Full Address */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Full Address / Directions (সম্পূর্ণ ঠিকানা)
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. House 42, Road 11, Block D, Banani"
                  className="w-full rounded-2xl border border-border/80 bg-background px-3.5 py-2.5 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                />
              </div>

              {/* Safety Tip */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Safety Tip / Recommendation (নিরাপত্তা ও পরিবেশের বিবরণ)
                </label>
                <textarea
                  rows={2}
                  value={formData.tip}
                  onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                  placeholder="e.g. শান্ত ও নান্দনিক পরিবেশ, সিসিটিভি ক্যামেরা ও ওপেন সিটিং ব্যবস্থা।"
                  className="w-full rounded-2xl border border-border/80 bg-background p-3 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm resize-none"
                />
              </div>

              {/* Google Maps Link */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Google Maps URL (গুগল ম্যাপস লিংক)
                </label>
                <input
                  type="url"
                  value={formData.google_maps_url}
                  onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full rounded-2xl border border-border/80 bg-background px-3.5 py-2.5 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Spot Photo / Image URL (ক্যাফের ছবি)
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-2xl border border-border/80 bg-background px-3.5 py-2.5 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                />
              </div>

              {/* Display Order & Active Checkbox */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-foreground">Display Order:</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                    className="w-20 rounded-xl border border-border/80 bg-background px-2.5 py-1.5 text-xs font-semibold focus:border-primary focus:outline-none text-center"
                  />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded text-primary focus:ring-primary border-border"
                  />
                  <span className="text-xs font-bold text-foreground">
                    Active (চ্যাট স্পট পিকারে দেখান)
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "সংরক্ষণ হচ্ছে..." : editingSpot ? "Update Spot" : "Create Spot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSpot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm rounded-3xl border border-destructive/30 bg-card p-6 shadow-2xl space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-foreground">স্পটটি মুছে ফেলতে চান?</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  &quot;{deletingSpot.name}&quot; তালিকা থেকে স্থায়ীভাবে মুছে ফেলা হবে।
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setDeletingSpot(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-xl bg-destructive text-white text-xs font-bold hover:bg-destructive/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {isDeleting ? "মুছে ফেলা হচ্ছে..." : "মুছে ফেলুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
