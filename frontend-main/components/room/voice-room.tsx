"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react"
import "@livekit/components-styles"
import { Mic, MicOff, Phone, Users, Copy, Check, Crown, Volume2, VolumeX } from "lucide-react"
import type { RoomJoinResponse } from "@/lib/api"
import { useTracks } from "@livekit/components-react"

interface VoiceRoomProps {
  roomData: RoomJoinResponse
  onLeave: () => void
}

function ParticipantsList() {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Users className="h-4 w-4" />
        Participants ({participants.length})
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {participants.map((participant) => {
          const isLocal = participant.identity === localParticipant?.identity
          const isAdmin = participant.permissions?.canPublish
          const isSpeaking = participant.isSpeaking
          const isMuted = !participant.isMicrophoneEnabled

          return (
            <div
              key={participant.identity}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                isSpeaking ? "bg-green-500/10 ring-2 ring-green-500/30" : "bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    isSpeaking ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"
                  }`}
                >
                  {participant.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{participant.name || participant.identity}</span>
                    {isLocal && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                    {isAdmin && <Crown className="h-4 w-4 text-yellow-500" />}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {participant.identity.startsWith("guest-") ? "Guest" : "Member"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSpeaking && <Volume2 className="h-4 w-4 text-green-500 animate-pulse" />}
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-red-500" />
                ) : (
                  !isSpeaking && <Volume2 className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RoomControls({ onLeave, isAdmin }: { onLeave: () => void; isAdmin: boolean }) {
  const { localParticipant } = useLocalParticipant()
  const room = useRoomContext()
  const [isMuted, setIsMuted] = useState(false)

  const toggleMute = useCallback(async () => {
    if (!localParticipant) return

    try {
      await localParticipant.setMicrophoneEnabled(isMuted)
      setIsMuted(!isMuted)
    } catch (err) {
      console.error("[v0] Failed to toggle microphone:", err)
    }
  }, [localParticipant, isMuted])

  const handleLeave = useCallback(async () => {
    try {
      await room.disconnect()
    } catch (err) {
      console.error("[v0] Error disconnecting:", err)
    }
    onLeave()
  }, [room, onLeave])

 
useEffect(() => {
  if (!isAdmin && localParticipant) {
    const muteMic = async () => {
      try {
        await localParticipant.setMicrophoneEnabled(false)
        setIsMuted(true)
      } catch (err) {
        console.error("[v0] Failed to mute microphone:", err)
      }
    }
    muteMic()
  }
}, [isAdmin, localParticipant])

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant={isMuted ? "destructive" : "secondary"}
        size="lg"
        className="rounded-full w-14 h-14"
        onClick={toggleMute}
        disabled={!isAdmin}
        title={!isAdmin ? "Only the room creator can broadcast" : "Toggle microphone"}
      >
        {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </Button>

      <Button variant="destructive" size="lg" className="rounded-full w-14 h-14" onClick={handleLeave}>
        <Phone className="h-6 w-6 rotate-135" />
      </Button>
    </div>
  )
}

export function VoiceRoom({ roomData, onLeave }: VoiceRoomProps) {
  const [copied, setCopied] = useState(false)
  console.log("LiveKit data:", roomData.livekit)

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomData.room_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Room Header */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{roomData.name}</h1>
              <p className="text-sm text-muted-foreground">Created by {roomData.creator.username}</p>
            </div>
            {roomData.livekit.is_admin && (
              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                <Crown className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>

          {/* Room Code */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Room Code:</span>
            <code className="font-mono font-bold text-lg tracking-widest">{roomData.room_code}</code>
            <Button variant="ghost" size="sm" onClick={copyRoomCode} className="ml-auto">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </Card>

        {/* LiveKit Room */}
      <LiveKitRoom
        serverUrl={roomData.livekit.url}
        token={roomData.livekit.token}
        connect
        audio
        video={false}
      >
          <Card className="p-6">
            <ParticipantsList />
          </Card>

          <Card className="p-6">
            <RoomControls onLeave={onLeave} isAdmin={roomData.livekit.is_admin} />
          </Card>

          <RoomAudioRenderer />
        </LiveKitRoom>

        {!roomData.livekit.is_admin && (
          <p className="text-center text-sm text-muted-foreground">
            You are a listener. Only the room admin can broadcast.
          </p>
        )}
      </div>
    </div>
  )
}
