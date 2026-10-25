"use client";

import React, { useState, useEffect } from "react";
import { FileText, Shield, Clock } from "lucide-react";
import { fetchAuditLogs } from "@/lib/services/admin-service";
import { AdminAuditLog } from "@/types/database";
import { formatDate } from "@/lib/utils";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">Administrative Audit Trail</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Immutable history of all moderator actions, account suspensions, bans, role changes, and dismissals.
        </p>
      </div>

      {/* Mobile Card List (< md screens) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground bg-card rounded-3xl border border-border">
            Loading audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground bg-card rounded-3xl border border-border">
            No moderation actions logged yet.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="rounded-3xl border border-border/80 bg-card p-4 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span>{log.admin_name || "Admin"}</span>
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(log.created_at)}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase">
                  {log.action_type}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground truncate">
                  Target: {log.target_id.slice(0, 8)}...
                </span>
              </div>

              {log.reason && (
                <p className="text-xs text-foreground/80 bg-secondary/30 rounded-xl p-2.5">
                  {log.reason}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (>= md screens) */}
      <div className="hidden md:block rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-secondary/50 font-bold uppercase tracking-wider text-[11px] text-muted-foreground">
              <tr>
                <th className="p-4 pl-6">Timestamp</th>
                <th className="p-4">Admin / Moderator</th>
                <th className="p-4">Action Type</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4 pr-6">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No moderation actions logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4 pl-6 text-muted-foreground whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="p-4 font-bold text-foreground">
                      {log.admin_name || "Admin"}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-wider">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {log.target_type}: {log.target_id.slice(0, 12)}...
                    </td>
                    <td className="p-4 pr-6 text-muted-foreground">
                      {log.reason || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
