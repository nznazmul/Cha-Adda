"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShieldAlert, CheckCircle, UserX, AlertCircle, RotateCcw } from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { fetchAdminUsers, setAccountStatus } from "@/lib/services/admin-service";
import { Profile } from "@/types/database";
import { calculateAge } from "@/lib/utils";

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const data = await fetchAdminUsers();
        if (mounted) setUsers(data);
      } catch (err) {
        console.error("Error loading users:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const handleStatusChange = async (userId: string, newStatus: Profile["account_status"]) => {
    if (!currentAdmin) return;
    await setAccountStatus(userId, newStatus, currentAdmin.id, `Admin manual action: set to ${newStatus}`);
    setActionNotice(`User status updated to ${newStatus}`);
    await loadData();
    setTimeout(() => setActionNotice(null), 3000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      u.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || u.account_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">User Management</h2>
          <p className="text-xs text-muted-foreground">
            Search, inspect, and moderate platform accounts.
          </p>
        </div>
      </div>

      {actionNotice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-semibold">
          {actionNotice}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or city..."
            className="w-full rounded-xl border border-border bg-card py-2 pl-10 pr-4 text-xs focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-xs focus:border-primary focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-secondary/50 font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-4">Member</th>
                <th className="p-4">Age / Gender</th>
                <th className="p-4">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const age = calculateAge(u.date_of_birth);
                  return (
                    <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4 font-bold text-foreground">
                        <Link href={`/profile/${u.id}`} className="hover:text-primary">
                          {u.display_name}
                        </Link>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {age} yrs • {u.gender}
                      </td>
                      <td className="p-4 text-muted-foreground">{u.city}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            u.account_status === "active"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : u.account_status === "suspended"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {u.account_status}
                        </span>
                      </td>
                      <td className="p-4 font-semibold capitalize">{u.role}</td>
                      <td className="p-4 text-right space-x-1.5">
                        {u.account_status !== "active" ? (
                          <button
                            onClick={() => handleStatusChange(u.id, "active")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500 text-[11px] font-bold transition-colors"
                          >
                            Restore
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStatusChange(u.id, "suspended")}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 text-[11px] font-bold transition-colors"
                            >
                              Suspend
                            </button>
                            <button
                              onClick={() => handleStatusChange(u.id, "banned")}
                              className="px-2.5 py-1 rounded-lg bg-destructive/10 hover:bg-destructive hover:text-white text-destructive text-[11px] font-bold transition-colors"
                            >
                              Ban
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
