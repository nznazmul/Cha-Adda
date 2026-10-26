import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { isProfileVerified, getVerificationDetails, VerificationProfileLike } from "@/lib/utils/verification";

interface BlueTickBadgeProps {
  profile?: VerificationProfileLike | null;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function BlueTickBadge({
  profile,
  size = "md",
  showText = false,
  className,
}: BlueTickBadgeProps) {
  if (!isProfileVerified(profile)) {
    return null;
  }

  const details = getVerificationDetails(profile);

  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const iconSizes = {
    sm: "h-2 w-2 stroke-[3.5]",
    md: "h-2.5 w-2.5 stroke-[3.5]",
    lg: "h-3 w-3 stroke-[3]",
  };

  return (
    <div
      className={cn("inline-flex items-center gap-1.5 align-middle", className)}
      title={`Verified Profile (Blue Tick) • ${details.formattedExpiry}`}
    >
      <span
        className={cn(
          "rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm ring-1 ring-sky-400/40",
          sizeClasses[size]
        )}
      >
        <Check className={iconSizes[size]} />
      </span>
      {showText && (
        <span className="text-[11px] font-semibold text-sky-400 tracking-tight">
          {details.badgeTextBengali}
        </span>
      )}
    </div>
  );
}
