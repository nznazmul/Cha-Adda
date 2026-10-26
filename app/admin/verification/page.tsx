"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Search, 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  User, 
  Sparkles, 
  Camera,
  RotateCcw
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { VerificationRequest } from "@/types/database";
import { fetchAdminVerificationRequests, reviewVerificationRequest } from "@/lib/services/verification-service";
import { calculateAge } from "@/lib/utils";
import { VerificationDurationPreset, calculateVerificationExpiry } from "@/lib/utils/verification";
import { BlueTickBadge } from "@/components/ui/blue-tick-badge";

export default function AdminVerificationPage() {
  const { user: currentAdmin } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [actionNotice, setActionNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Approval Modal State
  const [approvingReq, setApprovingReq] = useState<VerificationRequest | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<VerificationDurationPreset>("1_month");
  const [approvalNote, setApprovalNote] = useState("");
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Rejection Modal State
  const [rejectingReq, setRejectingReq] = useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("মুখমণ্ডল স্পষ্ট নয় বা পর্যাপ্ত আলো নেই");
  const [isProcessingRejection, setIsProcessingRejection] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const data = await fetchAdminVerificationRequests();
      setRequests(data);
    } catch (err) {
      console.error("Error loading verification requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchAdminVerificationRequests().then((data) => {
      if (isMounted) {
        setRequests(data);
        setLoading(false);
      }
    }).catch((err) => {
      if (isMounted) {
        console.error("Error loading verification requests:", err);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingReq) return;

    setIsProcessingApproval(true);
    try {
      const res = await reviewVerificationRequest(
        approvingReq.id,
        "approve",
        selectedDuration,
        approvalNote.trim() || undefined
      );

      if (res.success) {
        setActionNotice({
          text: `"${approvingReq.user?.display_name || "Member"}"-এর সেলফি ভেরিফিকেশন অনুমোদিত হয়েছে এবং ব্লু টিক প্রদান করা হয়েছে!`,
          type: "success",
        });
        setApprovingReq(null);
        await loadRequests();
      } else {
        setActionNotice({
          text: res.error || "অনুমোদন ব্যর্থ হয়েছে।",
          type: "error",
        });
      }
    } catch (err: unknown) {
      setActionNotice({
        text: err instanceof Error ? err.message : "Error processing approval",
        type: "error",
      });
    } finally {
      setIsProcessingApproval(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReq) return;

    setIsProcessingRejection(true);
    try {
      const res = await reviewVerificationRequest(
        rejectingReq.id,
        "reject",
        "1_month",
        rejectionReason.trim()
      );

      if (res.success) {
        setActionNotice({
          text: `"${rejectingReq.user?.display_name || "Member"}"-এর সেলফি ভেরিফিকেশন আবেদন বাতিল করা হয়েছে।`,
          type: "success",
        });
        setRejectingReq(null);
        await loadRequests();
      } else {
        setActionNotice({
          text: res.error || "বাতিল করতে ব্যর্থ হয়েছে।",
          type: "error",
        });
      }
    } catch (err: unknown) {
      setActionNotice({
        text: err instanceof Error ? err.message : "Error processing rejection",
        type: "error",
      });
    } finally {
      setIsProcessingRejection(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const name = req.user?.display_name?.toLowerCase() || "";
    const memberId = req.user?.unique_id?.toLowerCase() || "";
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || name.includes(q) || memberId.includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>User Verification & Selfie Review</span>
              <ShieldCheck className="h-6 w-6 text-sky-400" />
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            ক্যামেরা দিয়ে তোলা লাইভ সেলফি যাচাই করে প্রোফাইলে ব্লু টিক অনুমোদন বা বাতিল করুন।
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-semibold self-start sm:self-auto"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Action Toast Notice */}
      {actionNotice && (
        <div
          className={`p-3 rounded-2xl text-xs font-semibold border flex items-center gap-2 ${
            actionNotice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          {actionNotice.type === "success" ? (
            <Check className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => setStatusFilter("pending")}
          className={`p-4 rounded-3xl border text-left transition-all ${
            statusFilter === "pending"
              ? "border-amber-500/50 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/30"
              : "border-border bg-card hover:bg-secondary/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground">অপেক্ষমান আবেদন</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-500">{pendingCount}</div>
          <span className="text-[10px] text-muted-foreground">পর্যালোচনা প্রয়োজন</span>
        </button>

        <button
          onClick={() => setStatusFilter("approved")}
          className={`p-4 rounded-3xl border text-left transition-all ${
            statusFilter === "approved"
              ? "border-emerald-500/50 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/30"
              : "border-border bg-card hover:bg-secondary/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground">অনুমোদিত ব্লু টিক</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-500">
              <Check className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-500">{approvedCount}</div>
          <span className="text-[10px] text-muted-foreground">সফল ভেরিফিকেশন</span>
        </button>

        <button
          onClick={() => setStatusFilter("rejected")}
          className={`p-4 rounded-3xl border text-left transition-all ${
            statusFilter === "rejected"
              ? "border-destructive/50 bg-destructive/10 shadow-sm ring-1 ring-destructive/30"
              : "border-border bg-card hover:bg-secondary/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground">বাতিল আবেদন</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/20 text-destructive">
              <X className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-destructive">{rejectedCount}</div>
          <span className="text-[10px] text-muted-foreground">প্রত্যাখ্যাত আবেদন</span>
        </button>

        <button
          onClick={() => setStatusFilter("all")}
          className={`p-4 rounded-3xl border text-left transition-all ${
            statusFilter === "all"
              ? "border-sky-500/50 bg-sky-500/10 shadow-sm ring-1 ring-sky-500/30"
              : "border-border bg-card hover:bg-secondary/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground">মোট আবেদন</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">{requests.length}</div>
          <span className="text-[10px] text-muted-foreground">সর্বমোট জমাকৃত</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ইউজারের নাম বা আইডি দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 rounded-xl bg-secondary/50 border border-border text-xs">
          {[
            { id: "pending", label: `Pending (${pendingCount})` },
            { id: "approved", label: `Approved (${approvedCount})` },
            { id: "rejected", label: `Rejected (${rejectedCount})` },
            { id: "all", label: `All (${requests.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Cards Feed */}
      {loading ? (
        <div className="p-16 text-center text-xs text-muted-foreground bg-card rounded-3xl border border-border space-y-2">
          <Sparkles className="h-6 w-6 animate-spin text-sky-400 mx-auto" />
          <p>সেলফি ভেরিফিকেশন আবেদন লোড হচ্ছে...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-16 text-center text-xs text-muted-foreground bg-card rounded-3xl border border-border space-y-2">
          <ShieldCheck className="h-10 w-10 text-muted-foreground/50 mx-auto" />
          <p className="font-bold text-foreground">কোনো ভেরিফিকেশন আবেদন পাওয়া যায়নি</p>
          <p className="text-[11px]">
            {statusFilter === "pending"
              ? "বর্তমানে পর্যালোচনার জন্য কোনো অপেক্ষমান আবেদন নেই।"
              : "এই ফিল্টারে কোনো আবেদন নেই।"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredRequests.map((req) => {
            const age = req.user?.date_of_birth ? calculateAge(req.user.date_of_birth) : 24;
            const submittedDate = new Date(req.submitted_at).toLocaleString("bn-BD", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={req.id}
                className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm space-y-4 hover:border-sky-500/30 transition-colors"
              >
                {/* Card Top: User Info & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-600/10 text-sky-400 font-bold text-base border border-sky-500/20 shrink-0">
                      {req.user?.display_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/profile/${req.user_id}`}
                          className="font-bold text-sm hover:text-sky-400 transition-colors"
                        >
                          {req.user?.display_name || "Unknown Member"}
                        </Link>
                        {req.status === "approved" && <BlueTickBadge profile={{ verified: true }} size="sm" />}
                        {req.user?.unique_id && (
                          <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                            ID: {req.user.unique_id}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {age} বছর • {req.user?.gender || "other"} • {req.user?.city || "Dhaka"}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      req.status === "pending"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/30 animate-pulse"
                        : req.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                        : "bg-destructive/10 text-destructive border border-destructive/30"
                    }`}
                  >
                    {req.status === "pending" ? (
                      <>
                        <Clock className="h-3 w-3" />
                        <span>Pending Review</span>
                      </>
                    ) : req.status === "approved" ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Approved (Blue Tick)</span>
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3" />
                        <span>Rejected</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Side-by-Side Face Comparison View */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Left: Profile Photo */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                      <span>প্রোফাইল ছবি</span>
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-secondary shadow-inner">
                      <img
                        src={req.user?.primary_photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"}
                        alt="Profile photo"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-white">
                        Current Avatar
                      </span>
                    </div>
                  </div>

                  {/* Right: Live Captured Selfie */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-sky-400">
                      <span>লাইভ ক্যামেরা সেলফি</span>
                      <Camera className="h-3.5 w-3.5" />
                    </div>
                    <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-sky-500/40 bg-black shadow-inner">
                      <img
                        src={req.selfie_url}
                        alt="Captured live selfie"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 bg-sky-500/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-xs">
                        📸 Captured Face
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submission Meta and Review Notes */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60 gap-1">
                  <span>জমা দেওয়ার সময়: {submittedDate}</span>
                  {req.rejection_reason && (
                    <span className="text-destructive font-semibold">
                      বাতিলের কারণ: {req.rejection_reason}
                    </span>
                  )}
                  {req.duration_preset && req.status === "approved" && (
                    <span className="text-emerald-500 font-semibold">
                      মেয়াদ: {req.duration_preset}
                    </span>
                  )}
                </div>

                {/* Pending Actions */}
                {req.status === "pending" && (
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRejectingReq(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>বাতিল করুন</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovingReq(req)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>ব্লু টিক অনুমোদন করুন</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Approval Modal with Duration Selection */}
      {approvingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between border-b border-border/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 font-bold shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight">
                    ব্লু টিক অনুমোদন ও মেয়াদ নির্ধারণ
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Member: <span className="font-bold text-foreground">{approvingReq.user?.display_name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovingReq(null)}
                disabled={isProcessingApproval}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApprove} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">
                  ব্লু টিক প্রদর্শনের মেয়াদ নির্ধারণ করুন:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "1_month", label: "১ মাস", desc: "৩০ দিন সক্রিয়" },
                    { id: "2_months", label: "২ মাস", desc: "৬০ দিন সক্রিয়" },
                    { id: "3_months", label: "৩ মাস", desc: "৯০ দিন সক্রিয়" },
                    { id: "6_months", label: "৬ মাস", desc: "১৮০ দিন সক্রিয়" },
                    { id: "1_year", label: "১ বছর", desc: "৩৬৫ দিন সক্রিয়" },
                    { id: "lifetime", label: "আজীবন / স্থায়ী", desc: "কোনো মেয়াদ শেষ হবে না" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedDuration(opt.id as VerificationDurationPreset)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-0.5 ${
                        selectedDuration === opt.id
                          ? "border-sky-500 bg-sky-500/15 shadow-sm ring-1 ring-sky-500/30"
                          : "border-border bg-card hover:bg-secondary/60"
                      }`}
                    >
                      <span className={`text-xs font-bold ${selectedDuration === opt.id ? "text-sky-400" : "text-foreground"}`}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry preview */}
              <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-2.5 text-xs text-sky-400 flex items-center justify-between">
                <span>ব্লু টিকের মেয়াদ থাকবে:</span>
                <span className="font-bold">
                  {selectedDuration === "lifetime"
                    ? "আজীবন (Lifetime)"
                    : new Date(calculateVerificationExpiry(selectedDuration) || "").toLocaleDateString("bn-BD", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  অনুমোদন নোট / মন্তব্য (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="e.g. লাইভ সেলফির সাথে প্রোফাইল ছবি হুবহু মিলেছে"
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setApprovingReq(null)}
                  disabled={isProcessingApproval}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingApproval}
                  className="inline-flex items-center gap-1.5 px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {isProcessingApproval ? (
                    <span>প্রক্রিয়াধীন...</span>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>অনুমোদন ও ব্লু টিক প্রদান</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/15 text-destructive font-bold shrink-0">
                  <X className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black tracking-tight">
                    আবেদন বাতিলের কারণ
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Member: {rejectingReq.user?.display_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingReq(null)}
                disabled={isProcessingRejection}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  বাতিলের কারণ নির্বাচন করুন:
                </label>
                <div className="space-y-2">
                  {[
                    "মুখমণ্ডল স্পষ্ট নয় বা পর্যাপ্ত আলো নেই",
                    "প্রোফাইল ছবির সাথে লাইভ সেলফির মুখের মিল পাওয়া যায়নি",
                    "সেলফিতে একাধিক ব্যক্তি বা অস্পষ্ট ছবি পাওয়া গেছে",
                    "ছবিটি ক্যামেরার সামনে স্ক্রিনশট বা ফেক মনে হয়েছে",
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRejectionReason(r)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs transition-colors ${
                        rejectionReason === r
                          ? "border-destructive bg-destructive/10 text-destructive font-bold"
                          : "border-border bg-card hover:bg-secondary/50 text-foreground"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  কাস্টম কারণ বা নোট
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs focus:border-destructive focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectingReq(null)}
                  disabled={isProcessingRejection}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingRejection}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-destructive hover:bg-destructive/90 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {isProcessingRejection ? (
                    <span>বাতিল হচ্ছে...</span>
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      <span>আবেদন বাতিল নিশ্চিত করুন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
