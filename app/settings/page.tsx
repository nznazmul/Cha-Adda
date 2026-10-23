"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Moon, 
  Sun, 
  Bell, 
  Lock, 
  Trash2, 
  LogOut, 
  SlidersHorizontal 
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { useAuth } from "@/components/providers/auth-context";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, updateCurrentProfile } = useAuth();

  const [notificationsMatches, setNotificationsMatches] = useState(true);
  const [notificationsMessages, setNotificationsMessages] = useState(true);
  const [notificationsLikes, setNotificationsLikes] = useState(true);
  const [isDiscoverable, setIsDiscoverable] = useState(user?.is_discoverable ?? true);
  const [showDistance, setShowDistance] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSavePreferences = () => {
    updateCurrentProfile({
      is_discoverable: isDiscoverable,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleDeleteAccount = () => {
    if (user) {
      updateCurrentProfile({
        account_status: "suspended",
        is_discoverable: false,
      });
      signOut();
      router.push("/");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your account, discovery preferences, and privacy.
          </p>
        </div>
      </div>

      {savedNotice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-semibold text-center">
          Preferences updated successfully!
        </div>
      )}

      {/* Discovery & Visibility */}
      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Discovery & Visibility</span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-semibold">Discoverable in Feed</p>
            <p className="text-xs text-muted-foreground">
              When disabled, your card is hidden from others&apos; discovery decks.
            </p>
          </div>
          <input
            type="checkbox"
            checked={isDiscoverable}
            onChange={(e) => {
              setIsDiscoverable(e.target.checked);
              handleSavePreferences();
            }}
            className="h-5 w-5 rounded border-border text-primary focus:ring-primary accent-primary"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-sm font-semibold">Show Approximate Distance</p>
            <p className="text-xs text-muted-foreground">
              Display approximate distance (e.g. 3 km) on your public card.
            </p>
          </div>
          <input
            type="checkbox"
            checked={showDistance}
            onChange={(e) => setShowDistance(e.target.checked)}
            className="h-5 w-5 rounded border-border text-primary focus:ring-primary accent-primary"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-sm font-semibold">Show Active Status</p>
            <p className="text-xs text-muted-foreground">
              Show when you are currently online or active.
            </p>
          </div>
          <input
            type="checkbox"
            checked={showOnline}
            onChange={(e) => setShowOnline(e.target.checked)}
            className="h-5 w-5 rounded border-border text-primary focus:ring-primary accent-primary"
          />
        </div>
      </section>

      {/* Theme & Display */}
      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span>Appearance</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Color Theme</p>
            <p className="text-xs text-muted-foreground">
              Switch between deep plum dark theme and warm light theme.
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl border border-border bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-colors"
          >
            {theme === "dark" ? "Dark Mode (Active)" : "Light Mode (Active)"}
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">New Matches</span>
            <input
              type="checkbox"
              checked={notificationsMatches}
              onChange={(e) => setNotificationsMatches(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm">New Chat Messages</span>
            <input
              type="checkbox"
              checked={notificationsMessages}
              onChange={(e) => setNotificationsMessages(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm">Admirer Likes (When upgraded)</span>
            <input
              type="checkbox"
              checked={notificationsLikes}
              onChange={(e) => setNotificationsLikes(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
          </div>
        </div>
      </section>

      {/* Account Actions */}
      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-destructive font-bold text-sm">
          <Lock className="h-4 w-4" />
          <span>Account & Security</span>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => signOut()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={() => setDeleteConfirm(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive hover:text-white transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full rounded-3xl border border-border bg-card p-6 text-center space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-destructive">Delete your account?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This action is permanent. Your dating profile, swipes, matches, and conversations will be deleted in accordance with our data retention policy.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary"
              >
                Keep Account
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-xs font-bold hover:opacity-90"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
