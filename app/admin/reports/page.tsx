"use client";

import React, { useState, useEffect } from "react";
import { Flag, CheckCircle, XCircle, AlertTriangle, MessageSquare, Clock } from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { fetchModerationReports, resolveModerationReport } from "@/lib/services/admin-service";
import { Report } from "@/types/database";
import { formatDate } from "@/lib/utils";

export default function AdminReportsPage() {
  const { user: currentAdmin } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchModerationReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const data = await fetchModerationReports();
        if (mounted) setReports(data);
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAction = async (reportId: string, status: Report["status"], note: string) => {
    if (!currentAdmin) return;
    await resolveModerationReport(reportId, status, currentAdmin.id, note);
    setNotice(`Report marked as ${status}.`);
    await loadReports();
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Moderation Queue</h2>
        <p className="text-xs text-muted-foreground">
          Investigate user reports, review safety infractions, and take enforcement action.
        </p>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-semibold">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground">
          Loading report queue...
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center max-w-md mx-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto mb-3">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold">Queue is clear!</h3>
          <p className="text-xs text-muted-foreground mt-1">
            There are currently no unresolved safety reports.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                    {report.category.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • Filed {formatDate(report.created_at)}
                  </span>
                </div>
                <span className="inline-flex px-2 py-0.5 rounded-full bg-secondary text-[10px] font-bold uppercase">
                  Status: {report.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-muted-foreground">Reported User:</span>
                  <p className="font-bold text-foreground text-sm">
                    {report.reported_user?.display_name || report.reported_user_id}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Reporter:</span>
                  <p className="font-bold text-foreground text-sm">
                    {report.reporter?.display_name || report.reporter_id}
                  </p>
                </div>
              </div>

              {report.description && (
                <div className="rounded-xl border border-border bg-background p-3 text-xs text-foreground/90 leading-relaxed">
                  <span className="font-semibold text-muted-foreground block mb-1">Explanation:</span>
                  {report.description}
                </div>
              )}

              {/* Action Buttons */}
              {report.status === "pending" && (
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => handleAction(report.id, "dismissed", "Dismissed as unsubstantiated.")}
                    className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                  >
                    Dismiss Report
                  </button>
                  <button
                    onClick={() => handleAction(report.id, "investigating", "Under active review by safety team.")}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 text-xs font-bold transition-colors"
                  >
                    Mark Investigating
                  </button>
                  <button
                    onClick={() => handleAction(report.id, "resolved", "Enforcement action applied against reported user.")}
                    className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm shadow-primary/25 hover:opacity-95 transition-all"
                  >
                    Resolve & Warn User
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
