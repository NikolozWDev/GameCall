"use client"

import { Loader2 } from "lucide-react"

interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0A0F1C] border border-[#1A2540] rounded-2xl p-8 flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F7C9D]" />
        <p className="text-white/80 text-sm">{message || "Connecting to server..."}</p>
      </div>
    </div>
  )
}