"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { 
  Camera, 
  X, 
  Check, 
  RotateCcw, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles,
  Upload
} from "lucide-react";

interface SelfieCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSelfie: (selfieDataUrl: string) => Promise<boolean>;
}

export function SelfieCameraModal({
  isOpen,
  onClose,
  onSubmitSelfie,
}: SelfieCameraModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsInitializing(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("আপনার ব্রাউজারে ক্যামেরা সাপোর্ট নেই। নিচে থেকে ছবি আপলোড করুন।");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      console.warn("Camera access error:", err);
      const msg =
        err instanceof Error && err.name === "NotAllowedError"
          ? "ক্যামেরার অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংসে গিয়ে ক্যামেরার অনুমতি দিন অথবা ছবি আপলোড করুন।"
          : "ক্যামেরা ওপেন করা সম্ভব হয়নি। নিচের অপশন থেকে সেলফি ছবি আপলোড করুন।";
      setCameraError(msg);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !capturedPhoto && !submittedSuccess) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, capturedPhoto, submittedSuccess, startCamera, stopCamera]);

  // Keep video source synced if stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  if (!isOpen) return null;

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally to match mirror preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setSubmittedSuccess(false);
    startCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setCapturedPhoto(event.target.result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!capturedPhoto) return;
    setIsSubmitting(true);

    try {
      const ok = await onSubmitSelfie(capturedPhoto);
      if (ok) {
        setSubmittedSuccess(true);
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#38bdf8", "#3b82f6", "#10b981"],
          });
        } catch {
          // Safe
        }
        setTimeout(() => {
          onClose();
          setCapturedPhoto(null);
          setSubmittedSuccess(false);
        }, 2200);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    stopCamera();
    setCapturedPhoto(null);
    setSubmittedSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-1.5">
                <span>সেলফি ভেরিফিকেশন (Blue Tick)</span>
                <ShieldCheck className="h-4 w-4 text-sky-400" />
              </h2>
              <p className="text-[11px] text-muted-foreground">
                ক্যামেরায় আপনার মুখ ক্যাপচার করে ভেরিফাই করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Hidden Canvas & File Input */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Main Content Area */}
        {submittedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 mx-auto animate-bounce">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <h3 className="text-lg font-black text-foreground">সেলফি সফলভাবে জমা হয়েছে!</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              আপনার সেলফিটি অ্যাডমিন পর্যালোচনার জন্য পাঠানো হয়েছে। অ্যাডমিন অনুমোদন করলেই আপনার প্রোফাইলে অফিশিয়াল ব্লু টিক প্রদর্শিত হবে।
            </p>
          </div>
        ) : capturedPhoto ? (
          /* Snapshot Preview Mode */
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-sky-500/40 bg-black shadow-inner">
              <img
                src={capturedPhoto}
                alt="Captured Selfie"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-sky-400 border border-white/10 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>সেলফি স্ন্যাপশট প্রস্তুত</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border text-[11px] text-muted-foreground text-center">
              ছবিতে আপনার মুখ স্পষ্ট ও আলো পর্যাপ্ত আছে কিনা নিশ্চিত হয়ে সাবমিট করুন।
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleRetake}
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-secondary transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>পুনরায় তুলুন</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-500/25 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>জমা দেওয়া হচ্ছে...</span>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>ভেরিফিকেশন সাবমিট</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Live Camera View Mode */
          <div className="space-y-4">
            {cameraError ? (
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
                <p className="text-xs text-destructive font-medium leading-relaxed">
                  {cameraError}
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:opacity-95"
                  >
                    <Upload className="h-4 w-4" />
                    <span>সেলফি ছবি ফাইল আপলোড করুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    ক্যামেরা পুনরায় চেষ্টা করুন
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-sky-500/40 bg-black shadow-lg">
                {/* Live Video Feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />

                {/* Face Guide Oval */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[68%] h-[82%] rounded-[48%] border-2 border-dashed border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.3)] animate-pulse" />
                </div>

                {/* Camera Top Status */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-bold text-white pointer-events-none">
                  <span className="bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>লাইভ ক্যামেরা সক্রিয়</span>
                  </span>
                  <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[10px] text-sky-300">
                    সোজা তাকান
                  </span>
                </div>

                {/* Loading indicator */}
                {isInitializing && (
                  <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2 text-white text-xs">
                    <Sparkles className="h-6 w-6 animate-spin text-sky-400" />
                    <span>ক্যামেরা প্রস্তুত হচ্ছে...</span>
                  </div>
                )}
              </div>
            )}

            {!cameraError && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground text-center">
                  বৃত্তাকার ফ্রেমের ভেতরে মুখ সোজা রেখে নিচের বোতাম চাপুন।
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={isInitializing || !stream}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4" />
                    <span>📸 মুখমণ্ডল ক্যাপচার করুন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="ফাইল থেকে আপলোড করুন"
                    className="p-3 rounded-2xl border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
