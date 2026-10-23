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
        <h2 className="text-xl font-bold tracking-tight">Administrative Audit Trail</h2>
        <p className="text-xs text-muted-foreground">
          Immutable history of all moderator actions, account suspensions, bans, and dismissals.
        </p>
      </div>

      <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-secondary/50 font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Admin / Moderator</th>
                <th className="p-4">Action Type</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No moderation actions logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4 text-muted-foreground whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="p-4 font-bold text-foreground">
                      {log.admin_name || "Admin"}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-muted-foreground">
                      {log.target_type}: {log.target_id.slice(0, 12)}...
                    </td>
                    <td className="p-4 text-muted-foreground">
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
