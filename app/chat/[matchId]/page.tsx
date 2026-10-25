"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  ShieldAlert, 
  UserX, 
  Flag, 
  Sparkles, 
  Heart,
  Check,
  CheckCheck,
  Info
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { 
  fetchConversationMessages, 
  postChatMessage, 
  subscribeToMatchMessages 
} from "@/lib/services/chat-service";
import { unmatchUser } from "@/lib/services/matching-service";
import { blockMember } from "@/lib/services/safety-service";
import { devStore } from "@/lib/services/dev-store";
import { Message, Match, PublicProfile } from "@/types/database";
import { cn, formatDate } from "@/lib/utils";

function ChatConversationContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const matchId = params.matchId as string;

  const [partner, setPartner] = useState<PublicProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadChat() {
      if (!user) return;
      setLoading(true);

      // Load partner profile info
      const match = devStore.getMatch(matchId, user.id);
      if (match?.other_user) {
        setPartner(match.other_user);
      } else {
        // Fallback default partner for preview
        setPartner({
          id: "usr-kaelen-04",
          display_name: "Kaelen Miller",
          age: 28,
          gender: "man",
          city: "Dhaka",
          bio: "Culinary explorer and jazz enthusiast.",
          dating_intentions: ["Serious dating"],
          interests: ["Cooking", "Music", "Travel"],
          languages: ["English"],
          photos: [{
            id: "ph-1",
            user_id: "usr-kaelen-04",
            storage_path: "",
            url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
            display_order: 0,
            is_primary: true,
            moderation_status: "approved",
            created_at: new Date().toISOString()
          }]
        });
      }

      // Fetch messages
      try {
        const msgs = await fetchConversationMessages(matchId);
        setMessages(msgs);
      } catch (err) {
        console.error("Failed to load conversation:", err);
      } finally {
        setLoading(false);
      }
    }

    loadChat();

    // Subscribe to live messages
    const unsubscribe = subscribeToMatchMessages(matchId, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [matchId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || !user || sending) return;

    setInputText("");
    setSending(true);

    try {
      const sentMsg = await postChatMessage(matchId, user.id, content);
      setMessages((prev) => [...prev, sentMsg]);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUnmatch = async () => {
    if (!user) return;
    await unmatchUser(matchId, user.id);
    router.push("/matches");
  };

  const handleBlock = async () => {
    if (!user || !partner) return;
    await blockMember(user.id, partner.id);
    router.push("/matches");
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col bg-background border-x border-border/40">
      {/* Conversation Header */}
      <div className="flex h-16 items-center justify-between border-b border-border/80 bg-card px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/matches"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {partner && (
            <Link
              href={`/profile/${partner.id}`}
              className="flex items-center gap-3 group"
            >
              <div className="relative h-10 w-10 rounded-full overflow-hidden border border-border">
                <img
                  src={partner.primary_photo_url || partner.photos[0]?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"}
                  alt={partner.display_name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold group-hover:text-primary transition-colors">
                  {partner.display_name}, {partner.age}
                </span>
                <span className="text-[10px] text-muted-foreground">Active now</span>
              </div>
            </Link>
          )}
        </div>

        {/* Safety & Moderation Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            aria-label="Conversation options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-50 w-48 rounded-2xl border border-border bg-card p-1.5 shadow-xl text-xs space-y-0.5">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmUnmatch(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-left"
              >
                <UserX className="h-4 w-4 text-amber-500" />
                <span>Unmatch</span>
              </button>
              <Link
                href={`/safety/report/${partner?.id}?msg=${matchId}`}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors text-left"
              >
                <Flag className="h-4 w-4 text-rose-500" />
                <span>Report Member</span>
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleBlock();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors text-left font-semibold"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Block Member</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {loading ? (
          <div className="py-20 text-center text-xs text-muted-foreground">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          /* Empty Chat Starter */
          <div className="py-12 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600/20 to-amber-500/20 text-primary mb-3">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold">You matched with {partner?.display_name}!</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-6">
              Say hello and break the ice. Ask about their favorite chai spot or weekend passions.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Hey! What's your favorite spot in town?",
                "Great music taste! What have you been listening to lately?",
                "Hey there! How has your week been?",
              ].map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(starter)}
                  className="px-3 py-1.5 rounded-full border border-border bg-card text-xs text-muted-foreground hover:border-primary hover:text-primary transition-all text-left"
                >
                  &quot;{starter}&quot;
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[80%] sm:max-w-[70%]",
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap",
                    isMe
                      ? "bg-gradient-to-tr from-rose-600 to-rose-500 text-white rounded-br-xs"
                      : "bg-secondary text-foreground rounded-bl-xs"
                  )}
                >
                  {msg.content}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground px-1">
                  <span>{formatDate(msg.created_at)}</span>
                  {isMe && <CheckCheck className="h-3 w-3 text-rose-400" />}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <div className="p-3 sm:p-4 border-t border-border/80 bg-card shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <textarea
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${partner?.display_name || "match"}...`}
            className="flex-1 max-h-32 min-h-[44px] resize-none rounded-2xl border border-border bg-background p-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-md shadow-rose-500/25 hover:opacity-95 active:scale-95 transition-all disabled:opacity-40 shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Unmatch Confirmation Modal */}
      {confirmUnmatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full rounded-3xl border border-border bg-card p-6 text-center space-y-4 shadow-xl">
            <h3 className="text-lg font-bold">Unmatch {partner?.display_name}?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will remove them from your matches and disable messaging. You won&apos;t be able to undo this action.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmUnmatch(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUnmatch}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-xs font-bold hover:opacity-90"
              >
                Confirm Unmatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatConversationPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-muted-foreground">Connecting to conversation...</div>}>
      <ChatConversationContent />
    </Suspense>
  );
}
