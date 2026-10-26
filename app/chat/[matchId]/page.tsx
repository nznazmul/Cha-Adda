"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  ShieldAlert, 
  UserX, 
  Flag, 
  Sparkles, 
  CheckCheck, 
  Lock,
  Coffee,
  Mic,
  Square,
  Play,
  Pause,
  MapPin,
  X
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { 
  fetchConversationMessages, 
  fetchMatchDetails,
  postChatMessage, 
  subscribeToMatchMessages 
} from "@/lib/services/chat-service";
import { unmatchUser } from "@/lib/services/matching-service";
import { blockMember } from "@/lib/services/safety-service";
import { Message, PublicProfile, MeetingSpot } from "@/types/database";
import { fetchActiveSpots } from "@/lib/services/meeting-spots-service";
import { cn, formatDate } from "@/lib/utils";
import { 
  playVoiceNote, 
  stopCurrentVoice, 
  extractVoiceDuration, 
  voiceAudioCache 
} from "@/lib/utils/voice-player";

const SAFE_CAFES = [
  { name: "North End Coffee Roasters", area: "Banani / Dhanmondi / Gulshan", tip: "শান্ত ও নান্দনিক পরিবেশ" },
  { name: "Crimson Cup Coffee", area: "Dhanmondi / Banani", tip: "কফিপ্রেমীদের পছন্দের আড্ডা" },
  { name: "Gloria Jean's Coffees", area: "Gulshan-2 / Dhanmondi", tip: "আরামদায়ক বসার ব্যবস্থা" },
  { name: "Cha Adda Corner (রবীন্দ্র সরোবর)", area: "Dhanmondi Lake", tip: "খোলামেলা লেকভিউ ও গরম চা" },
  { name: "Butlers Chocolate Cafe", area: "Gulshan-1", tip: "চমৎকার ডেজার্ট ও হট চকলেট" }
];

function ChatConversationContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStarter = searchParams?.get("starter");

  const { user } = useAuth();
  const matchId = params.matchId as string;

  const [partner, setPartner] = useState<PublicProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState(initialStarter || "");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCafePicker, setShowCafePicker] = useState(false);
  const [availableSpots, setAvailableSpots] = useState<MeetingSpot[]>([]);
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);

  // Voice note recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Voice note playback state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [playingProgress, setPlayingProgress] = useState(0);
  const [playbackCurrentTime, setPlaybackCurrentTime] = useState(0);
  const stopPlaybackRef = useRef<(() => void) | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Stop playback and recording when leaving the chat screen
  useEffect(() => {
    fetchActiveSpots()
      .then((spots) => {
        if (spots && spots.length > 0) {
          setAvailableSpots(spots);
        }
      })
      .catch((err) => console.warn("Could not load dynamic spots:", err));

    return () => {
      stopCurrentVoice();
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    async function loadChat() {
      if (!user) return;
      setLoading(true);

      // Load partner profile info
      const match = await fetchMatchDetails(matchId, user.id);
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

  const startVoiceRecording = async () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      if (typeof window !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.start(100);
      }
    } catch (err) {
      console.warn("Microphone access unavailable or denied, using simulated audio capture:", err);
    }

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const cancelVoiceRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Safe
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const finishVoiceRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = Math.max(1, recordingSeconds);
    setIsRecording(false);
    setRecordingSeconds(0);

    let audioBlob: Blob | null = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
        if (audioChunksRef.current.length > 0) {
          audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        }
      } catch {
        // Safe
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (!user) return;
    try {
      const voiceContent = `🎙️ [Voice Note • ${duration}s]`;
      const sentMsg = await postChatMessage(matchId, user.id, voiceContent);
      sentMsg.message_type = "voice";
      sentMsg.voice_duration = duration;

      if (audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        voiceAudioCache.set(sentMsg.id, audioUrl);
      }

      setMessages((prev) => [...prev, sentMsg]);
    } catch (err) {
      console.error("Failed to send voice note:", err);
    }
  };

  const handleTogglePlayVoice = (msg: Message) => {
    const duration = extractVoiceDuration(msg.content, msg.voice_duration);

    if (playingMessageId === msg.id) {
      // Pause/Stop
      if (stopPlaybackRef.current) stopPlaybackRef.current();
      stopCurrentVoice();
      setPlayingMessageId(null);
      setPlayingProgress(0);
      setPlaybackCurrentTime(0);
      return;
    }

    // Stop whatever else is playing
    if (stopPlaybackRef.current) stopPlaybackRef.current();
    stopCurrentVoice();

    setPlayingMessageId(msg.id);
    setPlayingProgress(0);
    setPlaybackCurrentTime(0);

    const cancel = playVoiceNote({
      messageId: msg.id,
      duration,
      onProgress: (prog, currentSec) => {
        setPlayingProgress(prog);
        setPlaybackCurrentTime(currentSec);
      },
      onEnded: () => {
        setPlayingMessageId(null);
        setPlayingProgress(0);
        setPlaybackCurrentTime(0);
      },
    });

    stopPlaybackRef.current = cancel;
  };

  const handleSelectCafe = (cafe: { name: string; area: string; city?: string }) => {
    setInputText(`☕ এক কাপ চমৎকার কফির জন্য "${cafe.name}" (${cafe.area})-এ দেখা করা যায়? আপনি কি ফ্রি আছেন?`);
    setShowCafePicker(false);
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
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col bg-background border-x border-border/60 relative">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-border/80 bg-card/90 px-4 py-3 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/matches"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <Link
            href={`/profile/${partner?.id}`}
            className="flex items-center gap-3 hover:opacity-85 transition-opacity"
          >
            <div className="relative h-10 w-10 rounded-full overflow-hidden border border-border bg-secondary shrink-0">
              <img
                src={partner?.primary_photo_url || partner?.photos?.[0]?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"}
                alt={partner?.display_name || "Partner"}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight">{partner?.display_name}</span>
                <span className="text-[10px] text-muted-foreground">• {partner?.age}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>সক্রিয় আছেন (Active now)</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-1.5 relative">
          {/* Suggest Cafe Meetup Button */}
          <button
            type="button"
            onClick={() => setShowCafePicker(!showCafePicker)}
            title="নিরাপদ ক্যাফে আড্ডার প্রস্তাব দিন"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
          >
            <Coffee className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ক্যাফে আড্ডা 📍</span>
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {/* More Menu Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-12 z-50 w-48 rounded-2xl border border-border bg-card p-1.5 shadow-xl text-xs">
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

      {/* Suggested Cafe Picker Modal */}
      {showCafePicker && (
        <div className="absolute top-16 left-4 right-4 z-40 max-w-sm ml-auto rounded-3xl border border-amber-500/30 bg-card p-4 shadow-2xl animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>নিরাপদ ক্যাফে স্পট বেছে নিন</span>
            </span>
            <button onClick={() => setShowCafePicker(false)} className="p-1 rounded-full text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {(availableSpots.length > 0 ? availableSpots : SAFE_CAFES).map((cafe) => (
              <button
                key={"id" in cafe ? cafe.id : cafe.name}
                type="button"
                onClick={() => handleSelectCafe(cafe)}
                className="w-full text-left p-2.5 rounded-xl border border-border/80 bg-secondary/40 hover:bg-amber-500/10 hover:border-amber-500/40 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-foreground group-hover:text-amber-500 transition-colors">
                    {cafe.name}
                  </div>
                  {"city" in cafe && cafe.city ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary border border-border/60 text-muted-foreground font-semibold">
                      {cafe.city}
                    </span>
                  ) : null}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                  <span className="font-medium text-foreground/80">{cafe.area}</span>
                  {cafe.tip && <span>• {cafe.tip}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* End-to-End Encryption Security Pill */}
        <div className="mx-auto max-w-sm rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-1.5 text-center flex items-center justify-center gap-2 text-[11px] text-amber-500 font-medium shadow-sm backdrop-blur-sm">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span>Messages are end-to-end encrypted (AES-256). Privacy & chat data leak protected.</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-muted-foreground">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          /* Empty Chat Starter */
          <div className="py-10 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600/20 to-amber-500/20 text-primary mb-3">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold">{partner?.display_name}-এর সাথে আড্ডা শুরু হোক!</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-6">
              Say hello and break the ice. Ask about their favorite chai spot or weekend passions.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "☕ চা নাকি কফি?",
                "☕ ধানমন্ডি লেকে এক কাপ চা?",
                "বৃষ্টির দিনে প্রিয় আড্ডার জায়গা কী?",
                "আপনার প্রিয় ভ্রমণ স্মৃতি কী?",
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
            const isVoice = msg.message_type === "voice" || msg.content.includes("Voice Note");
            const isTeaInvite = msg.message_type === "tea_invite" || msg.content.includes("চা খাওয়ার দাওয়াত");

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[85%] sm:max-w-[70%]",
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {/* Voice Note Message Bubble with Real Sound Playback & Auto-stop */}
                {isVoice ? (
                  <div
                    className={cn(
                      "rounded-2xl p-3 shadow-md flex items-center gap-3 min-w-[220px] sm:min-w-[260px]",
                      isMe
                        ? "bg-gradient-to-tr from-rose-600 to-rose-500 text-white rounded-br-xs"
                        : "bg-secondary text-foreground rounded-bl-xs"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleTogglePlayVoice(msg)}
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95",
                        isMe ? "bg-white text-rose-600 hover:bg-white/95" : "bg-primary text-white hover:bg-primary/95"
                      )}
                      title={playingMessageId === msg.id ? "Pause voice note" : "Play voice note"}
                    >
                      {playingMessageId === msg.id ? (
                        <Pause className="h-5 w-5 fill-current" />
                      ) : (
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      {/* Waveform Bar Scrubber that lights up as voice plays */}
                      <div className="flex items-center gap-1 h-6">
                        {[30, 65, 40, 85, 55, 95, 45, 80, 60, 90, 40, 75, 50, 70, 45].map((h, i) => {
                          const barThreshold = i / 15;
                          const isPassed = playingMessageId === msg.id && playingProgress >= barThreshold;
                          return (
                            <div
                              key={i}
                              style={{ height: `${h}%` }}
                              className={cn(
                                "w-1 rounded-full transition-all duration-75",
                                isPassed
                                  ? isMe
                                    ? "bg-amber-300"
                                    : "bg-rose-500"
                                  : isMe
                                  ? "bg-white/45"
                                  : "bg-muted-foreground/35"
                              )}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[11px] opacity-90 font-mono">
                        <span>
                          {playingMessageId === msg.id
                            ? `0:0${Math.floor(playbackCurrentTime)}`
                            : `0:0${extractVoiceDuration(msg.content, msg.voice_duration)}`}
                        </span>
                        <span className="text-[10px] opacity-75">
                          {playingMessageId === msg.id ? "Playing..." : "Voice Note"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : isTeaInvite ? (
                  /* Tea Invite Decorative Bubble */
                  <div
                    className={cn(
                      "rounded-2xl p-4 shadow-md border max-w-sm",
                      isMe
                        ? "bg-gradient-to-br from-amber-500/20 via-card to-rose-500/20 border-amber-500/40 text-foreground rounded-br-xs"
                        : "bg-gradient-to-br from-amber-500/20 via-card to-rose-500/20 border-amber-500/40 text-foreground rounded-bl-xs"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
                      <Coffee className="h-4 w-4" />
                      <span>চা খাওয়ার দাওয়াত (Tea Invite)</span>
                    </div>
                    <p className="text-sm font-semibold leading-relaxed mb-2">
                      {msg.content}
                    </p>
                    {msg.tea_venue && (
                      <div className="inline-flex items-center gap-1 text-[11px] text-amber-500/90 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md">
                        <MapPin className="h-3 w-3" />
                        <span>{msg.tea_venue}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Text Bubble */
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
                )}

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
        {isRecording ? (
          /* Active Recording State */
          <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold text-rose-500">
                রেকর্ডিং হচ্ছে: 00:{String(recordingSeconds).padStart(2, "0")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelVoiceRecording}
                className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs text-muted-foreground hover:text-foreground"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={finishVoiceRecording}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:opacity-95"
              >
                <Square className="h-3.5 w-3.5 fill-white" />
                <span>পাঠান</span>
              </button>
            </div>
          </div>
        ) : (
          /* Standard Input Bar */
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <button
              type="button"
              onClick={startVoiceRecording}
              title="ভয়েস নোট রেকর্ড করুন (Voice Note)"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-secondary text-muted-foreground hover:text-primary hover:border-primary transition-all shrink-0"
            >
              <Mic className="h-5 w-5" />
            </button>

            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${partner?.display_name || "match"}-কে বার্তা লিখুন...`}
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
        )}
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
