"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { JoinRoomModal } from "@/components/room/join-room-modal"
import { CreateRoomModal } from "@/components/room/create-room-modal"
import { VoiceRoom } from "@/components/room/voice-room"
import { useAuth } from "@/lib/auth-context"
import type { RoomJoinResponse, Room } from "@/lib/api"
import { api } from "@/lib/api"
import { Users, ZapIcon, Loader2 } from "lucide-react"
import { RoomCreatedOverlay } from "@/components/room/room-created-overlay"

type AuthView = "none" | "login" | "register" | "forgot" | "reset"

function HomePageContent() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authView, setAuthView] = useState<AuthView>("none")
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeRoom, setActiveRoom] = useState<RoomJoinResponse | null>(null)
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [registeredMessage, setRegisteredMessage] = useState(false)

  useEffect(() => {
    const auth = searchParams.get("auth")
    const create = searchParams.get("create")
    const join = searchParams.get("join")
    const registered = searchParams.get("registered")

    if (registered === "true") setRegisteredMessage(true)
    if (auth === "login") setAuthView("login")
    else if (auth === "register") setAuthView("register")
    else if (auth === "forgot") setAuthView("forgot")
    else if (auth === "reset" && searchParams.get("token")) {
      setResetToken(searchParams.get("token"))
      setAuthView("reset")
    }
    else setAuthView("none")

    if (create === "true") setShowCreateModal(true)
    if (join === "true") setShowJoinModal(true)
  }, [searchParams])

  const handleJoinSuccess = (roomData: RoomJoinResponse) => {
    setActiveRoom(roomData)
    setCreatedRoom(null)
    router.replace("/")
  }

  const handleCreateSuccess = async (room: Room) => {
    setCreatedRoom(room)
  }

  const handleLeaveRoom = () => {
    setActiveRoom(null)
    setCreatedRoom(null)
    router.push("/")
  }

  const handleLoginSuccess = () => {
    router.replace("/")
    setAuthView("none")
  }

  const handleRegisterSuccess = () => {
    router.replace("/?auth=login&registered=true")
    setAuthView("login")
    setRegisteredMessage(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#04070E]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F7C9D]" />
      </div>
    )
  }

  if (activeRoom) {
    return <VoiceRoom roomData={activeRoom} onLeave={handleLeaveRoom} />
  }

  if (authView === "login") {
    return (
      <LoginForm
        onSuccess={handleLoginSuccess}
        onRegisterClick={() => { setAuthView("register"); router.replace("/?auth=register") }}
        onForgotPassword={() => { setAuthView("forgot"); router.replace("/?auth=forgot") }}
        successMessage={registeredMessage ? "Account created successfully! Please log in." : undefined}
      />
    )
  }

  if (authView === "register") {
    return (
      <RegisterForm
        onSuccess={handleRegisterSuccess}
        onLoginClick={() => { setAuthView("login"); router.replace("/?auth=login") }}
      />
    )
  }

  if (authView === "forgot") {
    return (
      <ForgotPasswordForm
        onBack={() => { setAuthView("login"); router.replace("/?auth=login") }}
        onResetToken={(token) => { setResetToken(token); setAuthView("reset") }}
      />
    )
  }

  if (authView === "reset" && resetToken) {
    return (
      <ResetPasswordForm
        token={resetToken}
        onSuccess={() => {
          setResetToken(null)
          setAuthView("login")
          router.replace("/?auth=login")
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#04070E] selection:bg-[#0F7C9D]/30 cursor-default">
      <div className="bg-[#04070E]">
        <section className="w-full h-[55vh] md:h-[65vh] relative mt-0 pt-0 overflow-hidden group">
          <img
            src="/banner.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-[2s] ease-out animate-banner-drift"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#04070E]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F7C9D]/20 via-transparent to-[#5DAEC4]/20 animate-gradient-shift pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(15,124,157,0.3),transparent_50%)] animate-glow-pulse pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#04070E] via-[#04070E]/80 to-transparent pointer-events-none" />

          <div className="relative z-10 container mx-auto max-w-6xl px-4 md:px-8 h-full flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight animate-fade-in-up drop-shadow-2xl">
              <span className="text-white">Instant Private</span>
              <br />
              <span className="text-white">Voice Rooms for </span>
              <span className="text-[#5DAEC4] drop-shadow-[0_0_20px_rgba(93,174,196,0.5)]">Gamers</span>
            </h1>
            <p className="text-white/90 text-sm md:text-base max-w-md mx-auto mb-8 leading-relaxed animate-fade-in-up animation-delay-200 drop-shadow-lg">
              Create a room in seconds. Share a link. Talk instantly. No downloads.
            </p>
            <div className="flex items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
              <Button
                size="lg"
                className="bg-[#0F7C9D] hover:bg-[#0E6A87] text-white px-7 py-5 text-base font-semibold rounded-xl shadow-xl shadow-[#0F7C9D]/40 hover:shadow-2xl hover:shadow-[#0F7C9D]/50 active:scale-95 cursor-pointer transition-all duration-300"
                onClick={() => isAuthenticated ? setShowCreateModal(true) : setAuthView("login")}
              >
                <ZapIcon className="h-5 w-5 mr-2" />
                Create Room
              </Button>
              <Button
                size="lg"
                className="bg-[#5DAEC4]/20 text-white border border-[#5DAEC4]/60 shadow-lg shadow-[#5DAEC4]/30 hover:bg-[#0F7C9D] hover:text-white hover:border-[#0F7C9D] hover:shadow-xl hover:shadow-[#0F7C9D]/40 px-7 py-5 text-base font-semibold rounded-xl active:scale-95 cursor-pointer transition-all duration-300"
                onClick={() => setShowJoinModal(true)}
              >
                <Users className="h-5 w-5 mr-2" />
                Join Room
              </Button>
            </div>
          </div>
        </section>
      </div>

      <div className="container mx-auto max-w-6xl px-4 md:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-5 mb-16 relative z-20">
          {[
            { title: "Ultra-fast room creation", desc: "Create your private voice room instantly and start talking in seconds", img: "/cont1.png", bg: "#040E1C", border: "#1A2540" },
            { title: "Low-latency voice", desc: "Crystal-clear voice with ultra-low latency for the best gaming communication", img: "/cont2.png", bg: "#040D1B", border: "#1A2440" },
            { title: "Shareable links & guest access", desc: "Share a link with your squad. Guests can join instantly without an account", img: "/cont3.png", bg: "#050B1A", border: "#1A2540" },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border text-center flex flex-col items-center gap-4 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#0F7C9D]/5 transition-all duration-300"
              style={{ backgroundColor: feature.bg, borderColor: feature.border }}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-[#0A0F1C] ring-2 ring-[#0F7C9D]/30">
                <img src={feature.img} alt="" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-semibold text-base text-white">{feature.title}</h3>
              <p className="text-sm text-white/70 leading-relaxed max-w-[220px]">{feature.desc}</p>
            </div>
          ))}
        </div>

        {createdRoom && !activeRoom && (
          <RoomCreatedOverlay
            room={createdRoom}
            onEnterRoom={async () => {
              try {
                const roomData = await api.joinRoom(createdRoom.room_code)
                setActiveRoom(roomData)
              } catch {}
            }}
          />
        )}
      </div>

      <JoinRoomModal open={showJoinModal} onOpenChange={(open) => { setShowJoinModal(open); if (!open) router.replace("/") }} onJoinSuccess={handleJoinSuccess} />
      <CreateRoomModal open={showCreateModal} onOpenChange={(open) => { setShowCreateModal(open); if (!open) router.replace("/") }} onCreateSuccess={handleCreateSuccess} />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#04070E]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F7C9D]" />
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}