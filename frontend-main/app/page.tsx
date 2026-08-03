"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { JoinRoomModal } from "@/components/room/join-room-modal"
import { CreateRoomModal } from "@/components/room/create-room-modal"
import { VoiceRoom } from "@/components/room/voice-room"
import { useAuth } from "@/lib/auth-context"
import type { RoomJoinResponse, Room } from "@/lib/api"
import { api } from "@/lib/api"
import { Phone, Users, Plus, LogOut, Loader2, Headphones, Shield, Zap } from "lucide-react"

type AuthView = "none" | "login" | "register"

export default function HomePage() {
  const { user, guestName, isLoading, isAuthenticated, logout } = useAuth()
  const [authView, setAuthView] = useState<AuthView>("none")
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeRoom, setActiveRoom] = useState<RoomJoinResponse | null>(null)
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null)

  // Handle room join success
  const handleJoinSuccess = (roomData: RoomJoinResponse) => {
    setActiveRoom(roomData)
    setCreatedRoom(null)
  }

  // Handle room create success - auto join
  const handleCreateSuccess = async (room: Room) => {
    setCreatedRoom(room)
    try {
      const roomData = await api.joinRoom(room.room_code)
      setActiveRoom(roomData)
    } catch {
      // Failed to auto-join, show the code
    }
  }

  // Handle leave room
  const handleLeaveRoom = () => {
    setActiveRoom(null)
    setCreatedRoom(null)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Active voice room
  if (activeRoom) {
    return <VoiceRoom roomData={activeRoom} onLeave={handleLeaveRoom} />
  }

  // Auth forms
  if (authView === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <LoginForm onSuccess={() => setAuthView("none")} onRegisterClick={() => setAuthView("register")} />
          <Button variant="ghost" className="w-full mt-4" onClick={() => setAuthView("none")}>
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  if (authView === "register") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <RegisterForm onSuccess={() => setAuthView("login")} onLoginClick={() => setAuthView("login")} />
          <Button variant="ghost" className="w-full mt-4" onClick={() => setAuthView("none")}>
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  // Main home page
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">GameCall</span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome, <span className="font-medium text-foreground">{user?.username}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : guestName ? (
              <span className="text-sm text-muted-foreground">
                Guest: <span className="font-medium text-foreground">{guestName}</span>
              </span>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setAuthView("login")}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => setAuthView("register")}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Voice Calls Made Simple</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Create or join voice rooms instantly. No downloads required. Perfect for gaming, meetings, and hangouts.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
          {/* Join Room Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowJoinModal(true)}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Join Room</CardTitle>
              <CardDescription>Enter an 8-digit code to join an existing voice room</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                <Users className="mr-2 h-5 w-5" />
                Join with Code
              </Button>
            </CardContent>
          </Card>

          {/* Create Room Card - Only for authenticated users */}
          <Card
            className={`transition-shadow ${isAuthenticated ? "hover:shadow-lg cursor-pointer" : "opacity-60"}`}
            onClick={() => isAuthenticated && setShowCreateModal(true)}
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Create Room</CardTitle>
              <CardDescription>
                {isAuthenticated
                  ? "Start a new voice room and invite others"
                  : "Sign in to create your own voice rooms"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAuthenticated ? (
                <Button className="w-full" size="lg" variant="secondary">
                  <Plus className="mr-2 h-5 w-5" />
                  Create New Room
                </Button>
              ) : (
                <Button
                  className="w-full bg-transparent"
                  size="lg"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    setAuthView("login")
                  }}
                >
                  Sign In to Create
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Created Room Info */}
        {createdRoom && !activeRoom && (
          <Card className="max-w-md mx-auto mb-8 border-green-500/30 bg-green-500/5">
            <CardHeader>
              <CardTitle className="text-green-600">Room Created!</CardTitle>
              <CardDescription>Share this code with others to join</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-mono font-bold tracking-widest mb-4">{createdRoom.room_code}</p>
                <Button onClick={() => api.joinRoom(createdRoom.room_code).then(setActiveRoom)}>Enter Room</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <Headphones className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Crystal Clear Audio</h3>
            <p className="text-sm text-muted-foreground">Powered by LiveKit for low-latency, high-quality voice</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Secure & Private</h3>
            <p className="text-sm text-muted-foreground">End-to-end encrypted rooms with unique access codes</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-semibold mb-2">Instant Access</h3>
            <p className="text-sm text-muted-foreground">No downloads or installations. Works in your browser</p>
          </div>
        </div>
      </main>

      {/* Modals */}
      <JoinRoomModal open={showJoinModal} onOpenChange={setShowJoinModal} onJoinSuccess={handleJoinSuccess} />

      <CreateRoomModal open={showCreateModal} onOpenChange={setShowCreateModal} onCreateSuccess={handleCreateSuccess} />
    </div>
  )
}
