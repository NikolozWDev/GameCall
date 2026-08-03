"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { api, APIError, type RoomJoinResponse } from "@/lib/api"
import { Loader2, Users, User } from "lucide-react"

interface JoinRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoinSuccess: (roomData: RoomJoinResponse) => void
  initialCode?: string
}

export function JoinRoomModal({ open, onOpenChange, onJoinSuccess, initialCode = "" }: JoinRoomModalProps) {
  const { user, guestName, setGuestName } = useAuth()
  const [roomCode, setRoomCode] = useState(initialCode)
  const [tempGuestName, setTempGuestName] = useState(guestName || "")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Validation
  const isRoomCodeValid = /^[A-Za-z0-9_-]{6,10}$/.test(roomCode)
  const isGuestNameValid = tempGuestName.trim().length >= 2
  const needsGuestName = !user && !guestName
  const isFormValid = isRoomCodeValid && (user || guestName || isGuestNameValid)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setError("")
    setIsLoading(true)

    try {
      // თუ guest-ია და ჯერ არ აქვს სახელი, შეინახოს
      let nameToUse = guestName
      if (!user && !guestName && isGuestNameValid) {
        setGuestName(tempGuestName.trim())
        nameToUse = tempGuestName.trim()
      }

      const roomData = await api.joinRoom(roomCode.toUpperCase(), nameToUse || tempGuestName.trim())
      onJoinSuccess(roomData)
      onOpenChange(false)
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message)
      } else {
        setError("Failed to join room")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Join Room
          </DialogTitle>
          <DialogDescription>Enter the 8-digit room code to join a voice call</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="roomCode">Room Code</Label>
            <Input
              id="roomCode"
              type="text"
              placeholder="ABCD1234"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="text-center text-lg font-mono tracking-widest uppercase"
              required
            />
            {roomCode && !isRoomCodeValid && <p className="text-xs text-red-500">Room code must be 6-10 characters</p>}
          </div>

          {/* Guest Name Input - მხოლოდ თუ არ არის დალოგინებული და არ აქვს შენახული სახელი */}
          {needsGuestName && (
            <div className="space-y-2">
              <Label htmlFor="guestName" className="flex items-center gap-2">
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
                required
              />
              {tempGuestName && !isGuestNameValid && (
                <p className="text-xs text-red-500">Name must be at least 2 characters</p>
              )}
              <p className="text-xs text-muted-foreground">This name will be saved and used for all future rooms</p>
            </div>
          )}

          {/* აჩვენე შენახული guest name */}
          {!user && guestName && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                Joining as: <span className="font-medium">{guestName}</span>
              </p>
            </div>
          )}

          {/* აჩვენე user-ის სახელი თუ დალოგინებულია */}
          {user && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                Joining as: <span className="font-medium">{user.username}</span>
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!isFormValid || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Room"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
