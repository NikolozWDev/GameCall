"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { api, APIError, type Room } from "@/lib/api"
import { profileApi } from "@/lib/api"
import { Loader2, Zap, ArrowRight, User } from "lucide-react"
import { playSound, SoundEvent } from '@/lib/sounds'

interface CreateRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateSuccess: (room: Room) => void
}

export function CreateRoomModal({ open, onOpenChange, onCreateSuccess }: CreateRoomModalProps) {
  const { user, isAuthenticated } = useAuth()
  const [roomName, setRoomName] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)

  const isRoomNameValid = roomName.trim().length >= 3 && roomName.trim().length <= 100
  const isFormValid = isRoomNameValid

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
      const room = await api.createRoom(roomName.trim())
      playSound(SoundEvent.ROOM_CREATED)
      onCreateSuccess(room)
      onOpenChange(false)
      setRoomName("")
    } catch (err) {
      if (err instanceof APIError) setError(err.message)
      else setError("Failed to create room")
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
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-700 border-2 border-slate-600 flex items-center justify-center">
                    {profilePicture ? (
                      <img src={profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-7 w-7 text-white/50" />
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-gray-950" />
                </div>

                <ArrowRight className="h-6 w-6 text-white/40" />

                <div className="w-14 h-14 rounded-2xl bg-[#0F7C9D] flex items-center justify-center shadow-lg shadow-[#0F7C9D]/30">
                  <Zap className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-white text-2xl font-bold">Create Room</h2>
                <p className="text-white/50 text-sm mt-1">Start a new voice room instantly</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="roomName" className="text-white/70 text-sm font-medium">Room Name</Label>
              <Input
                id="roomName"
                type="text"
                placeholder="My Squad Room"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                maxLength={100}
                className="h-12 bg-gray-900 border-slate-700 text-white text-base rounded-lg focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20 placeholder:text-white/30"
              />
              {roomName && !isRoomNameValid && (
                <p className="text-xs text-red-400">Room name must be 3-100 characters</p>
              )}
            </div>

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
                className="flex-1 h-12 bg-[#0F7C9D] hover:bg-[#0E6A87] text-white font-semibold rounded-lg transition-all duration-300 cursor-pointer"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Room"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}