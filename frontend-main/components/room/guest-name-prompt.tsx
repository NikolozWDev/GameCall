"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { User, ArrowRight, Users } from "lucide-react"

interface GuestNamePromptProps {
  onComplete: () => void
  roomCode?: string
}

export function GuestNamePrompt({ onComplete, roomCode }: GuestNamePromptProps) {
  const { setGuestName } = useAuth()
  const [name, setName] = useState("")

  const isNameValid = name.trim().length >= 2

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isNameValid) return
    setGuestName(name.trim())
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#04070E] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-950 border-2 border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-700 border-2 border-slate-600 flex items-center justify-center">
                <User className="h-7 w-7 text-white/50" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-gray-950" />
            </div>
            <ArrowRight className="h-6 w-6 text-white/40" />
            <div className="w-14 h-14 rounded-2xl bg-[#0F7C9D] flex items-center justify-center shadow-lg shadow-[#0F7C9D]/30">
              <Users className="h-7 w-7 text-white" />
            </div>
          </div>

          <h2 className="text-white text-2xl font-bold mb-2">Welcome to GameCall</h2>
          <p className="text-white/50 text-sm mb-2">
            You've been invited to join a voice room
          </p>
          {roomCode && (
            <div className="bg-gray-900 border border-slate-700 rounded-lg px-4 py-2 mb-6 inline-block">
              <code className="text-[#0F7C9D] font-mono text-lg font-bold tracking-wider">{roomCode}</code>
            </div>
          )}
          <p className="text-white/50 text-sm mb-6">
            Enter your display name to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="name" className="text-white/70 text-sm font-medium">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. JohnDoe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                autoFocus
                className="h-12 bg-gray-900 border-slate-700 text-white rounded-lg focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20 text-center"
              />
              {name && !isNameValid && (
                <p className="text-xs text-red-400 text-center">Name must be at least 2 characters</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#0F7C9D] hover:bg-[#0E6A87] text-white font-semibold rounded-lg cursor-pointer"
              disabled={!isNameValid}
            >
              Join Room
            </Button>

            <p className="text-xs text-white/40">This name will be used for all voice rooms</p>
          </form>
        </div>
      </div>
    </div>
  )
}