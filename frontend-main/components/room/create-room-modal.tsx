"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api, APIError, type Room } from "@/lib/api"
import { Loader2, Plus } from "lucide-react"

interface CreateRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateSuccess: (room: Room) => void
}

export function CreateRoomModal({ open, onOpenChange, onCreateSuccess }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Validation
  const isRoomNameValid = roomName.trim().length >= 3 && roomName.trim().length <= 100
  const isFormValid = isRoomNameValid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setError("")
    setIsLoading(true)

    try {
      const room = await api.createRoom(roomName.trim())
      onCreateSuccess(room)
      onOpenChange(false)
      setRoomName("")
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message)
      } else {
        setError("Failed to create room")
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
            <Plus className="h-5 w-5" />
            Create Room
          </DialogTitle>
          <DialogDescription>Create a new voice call room and invite others with the room code</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              type="text"
              placeholder="My Voice Room"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={100}
              required
            />
            {roomName && !isRoomNameValid && <p className="text-xs text-red-500">Room name must be 3-100 characters</p>}
          </div>

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
                  Creating...
                </>
              ) : (
                "Create Room"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
