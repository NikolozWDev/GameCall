"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api, type RoomJoinResponse, APIError } from "@/lib/api"
import { VoiceRoom } from "@/components/room/voice-room"
import { GuestNamePrompt } from "@/components/room/guest-name-prompt"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

  // Check if guest needs to enter name
  useEffect(() => {
    if (authLoading) return

    // თუ არ არის დალოგინებული და არ აქვს guest სახელი
    if (!user && !guestName) {
      setNeedsName(true)
    }
  }, [user, guestName, authLoading])

  // Join room automatically when ready
  useEffect(() => {
    if (authLoading || needsName || roomData || isJoining) return

    const joinRoom = async () => {
      setIsJoining(true)
      setError(null)

      try {
        const data = await api.joinRoom(roomCode, guestName || undefined)
        setRoomData(data)
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.message)
        } else {
          setError("Failed to join room")
        }
      } finally {
        setIsJoining(false)
      }
    }

    joinRoom()
  }, [roomCode, guestName, authLoading, needsName, roomData, isJoining])

  // Handle leave room
  const handleLeave = () => {
    router.push("/")
  }

  // Handle guest name complete
  const handleNameComplete = () => {
    setNeedsName(false)
  }

  // Loading auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Needs guest name
  if (needsName) {
    return <GuestNamePrompt onComplete={handleNameComplete} roomCode={roomCode} />
  }

  // Joining room
  if (isJoining) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Joining room {roomCode}...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <CardTitle>Unable to Join Room</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Active room
  if (roomData) {
    return <VoiceRoom roomData={roomData} onLeave={handleLeave} />
  }

  return null
}
