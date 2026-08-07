"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { api, APIError, type RoomJoinResponse } from "@/lib/api"
import { profileApi } from "@/lib/api"
import { Loader2, Users, User, ArrowRight } from "lucide-react"

interface JoinRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoinSuccess: (roomData: RoomJoinResponse) => void
  initialCode?: string
}

export function JoinRoomModal({ open, onOpenChange, onJoinSuccess, initialCode = "" }: JoinRoomModalProps) {
  const { user, guestName, setGuestName, isAuthenticated } = useAuth()
  const [roomCode, setRoomCode] = useState(initialCode)
  const [tempGuestName, setTempGuestName] = useState(guestName || "")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)

  const isRoomCodeValid = /^[A-Za-z0-9_-]{6,10}$/.test(roomCode)
  const isGuestNameValid = tempGuestName.trim().length >= 2
  const needsGuestName = !user && !guestName
  const isFormValid = isRoomCodeValid && (user || guestName || isGuestNameValid)

  const loadProfilePicture = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const profile = await profileApi.getProfile()
      setProfilePicture(profile.profile_picture_url)
    } catch {}
  }, [isAuthenticated])

  useEffect(() => {
    if (open) loadProfilePicture()
  }, [open, loadProfilePicture])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    setError("")
    setIsLoading(true)
    try {
      let nameToUse = guestName
      if (!user && !guestName && isGuestNameValid) {
        setGuestName(tempGuestName.trim())
        nameToUse = tempGuestName.trim()
      }
      const roomData = await api.joinRoom(roomCode.toUpperCase(), nameToUse || tempGuestName.trim())
      onJoinSuccess(roomData)
      onOpenChange(false)
    } catch (err) {
      if (err instanceof APIError) setError(err.message)
      else setError("Failed to join room")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-950 border-2 border-slate-800 rounded-xl p-0 gap-0">
        <div className="p-8">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-4 text-center">
              {/* User/Guest photo + Arrow + Room icon */}
              <div className="flex items-center gap-3">
                {/* User / Guest avatar with active dot */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-700 border-2 border-slate-600 flex items-center justify-center">
                    {profilePicture ? (
                      <img src={profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-7 w-7 text-white/50" />
                    )}
                  </div>
                  {/* Green active dot */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-gray-950" />
                </div>

                {/* Arrow */}
                <ArrowRight className="h-6 w-6 text-white/40" />

                {/* Room icon */}
                <div className="w-14 h-14 rounded-2xl bg-[#0F7C9D] flex items-center justify-center shadow-lg shadow-[#0F7C9D]/30">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-white text-2xl font-bold">Join Room</h2>
                <p className="text-white/50 text-sm mt-1">Enter the room code to join</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="roomCode" className="text-white/70 text-sm font-medium">Room Code</Label>
              <Input
                id="roomCode"
                type="text"
                placeholder="Enter code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={10}
                className="h-14 bg-gray-900 border-slate-700 text-white text-lg text-center font-mono tracking-[0.3em] uppercase rounded-lg focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20 placeholder:text-white/20"
              />
              {roomCode && !isRoomCodeValid && (
                <p className="text-xs text-red-400">Room code must be 6-10 characters</p>
              )}
            </div>

            {needsGuestName && (
              <div className="space-y-2">
                <Label htmlFor="guestName" className="text-white/70 text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Your Name
                </Label>
                <Input
                  id="guestName"
                  type="text"
                  placeholder="Enter your name"
                  value={tempGuestName}
                  onChange={(e) => setTempGuestName(e.target.value)}
                  maxLength={50}
                  className="h-12 bg-gray-900 border-slate-700 text-white rounded-lg focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20"
                />
                {tempGuestName && !isGuestNameValid && (
                  <p className="text-xs text-red-400">Name must be at least 2 characters</p>
                )}
              </div>
            )}

            {!user && guestName && (
              <div className="p-3 bg-gray-900 rounded-lg border border-slate-800">
                <p className="text-sm text-white/70">
                  Joining as: <span className="font-medium text-white">{guestName}</span>
                </p>
              </div>
            )}

            {user && (
              <div className="p-3 bg-gray-900 rounded-lg border border-slate-800">
                <p className="text-sm text-white/70">
                  Joining as: <span className="font-medium text-white">{user.username}</span>
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 h-12 text-white/60 border border-white/10 hover:bg-white/5 hover:text-white rounded-lg cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-[#0F7C9D] hover:bg-[#0E6A87] text-white font-semibold rounded-lg cursor-pointer"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Join Room"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}