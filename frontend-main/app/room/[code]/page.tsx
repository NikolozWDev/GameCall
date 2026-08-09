"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api, type RoomJoinResponse, APIError } from "@/lib/api"
import { VoiceRoom } from "@/components/room/voice-room"
import { GuestNamePrompt } from "@/components/room/guest-name-prompt"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Home } from "lucide-react"

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params)
  const roomCode = resolvedParams.code
  const router = useRouter()
  const { user, guestName, isLoading: authLoading } = useAuth()
  const [roomData, setRoomData] = useState<RoomJoinResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [needsName, setNeedsName] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user && !guestName) {
      setNeedsName(true)
    } else {
      setNeedsName(false)
    }
  }, [user, guestName, authLoading])

  useEffect(() => {
    if (authLoading || needsName || roomData || isJoining) return

    const joinRoom = async () => {
      setIsJoining(true)
      setError(null)
      try {
        const data = await api.joinRoom(roomCode, guestName || undefined)
        setRoomData(data)
      } catch (err) {
        if (err instanceof APIError) setError(err.message)
        else setError("Failed to join room. It may no longer exist.")
      } finally {
        setIsJoining(false)
      }
    }

    joinRoom()
  }, [roomCode, guestName, authLoading, needsName, roomData, isJoining])

  const handleLeave = () => router.push("/")

  const handleGuestNameComplete = () => {
    setNeedsName(false)
  }

  if (authLoading || (needsName && !guestName && !user)) {
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#04070E]">
          <Loader2 className="h-8 w-8 animate-spin text-[#0F7C9D]" />
        </div>
      )
    }
    if (!user && !guestName && !needsName) {
      return <GuestNamePrompt onComplete={handleGuestNameComplete} roomCode={roomCode} />
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#04070E]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F7C9D]" />
      </div>
    )
  }

  if (needsName) {
    return <GuestNamePrompt onComplete={handleGuestNameComplete} roomCode={roomCode} />
  }

  if (isJoining) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#04070E]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0F7C9D] mx-auto mb-4" />
          <p className="text-white/70">Joining room <span className="text-[#0F7C9D] font-mono font-bold">{roomCode}</span>...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#04070E] p-4">
        <div className="w-full max-w-md bg-gray-950 border-2 border-slate-800 rounded-xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">Unable to Join Room</h2>
          <p className="text-white/50 text-sm mb-2">Room: <code className="text-[#0F7C9D] font-mono">{roomCode}</code></p>
          <p className="text-white/50 text-sm mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} className="w-full h-12 bg-[#0F7C9D] hover:bg-[#0E6A87] text-white font-semibold rounded-lg">
              Try Again
            </Button>
            <Button variant="ghost" onClick={() => router.push("/")} className="w-full h-12 text-white/60 border border-white/10 hover:bg-white/5 hover:text-white rounded-lg">
              <Home className="mr-2 h-4 w-4" />Go Home
            </Button>
          </div>
        </div>
      </div>
    )
  }


  if (roomData) return <VoiceRoom roomData={roomData} onLeave={handleLeave} />

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#04070E]">
      <Loader2 className="h-8 w-8 animate-spin text-[#0F7C9D]" />
    </div>
  )
}