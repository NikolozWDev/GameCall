"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react"
import "@livekit/components-styles"
import {
  Mic,
  MicOff,
  Phone,
  Users,
  Copy,
  Check,
  Crown,
  Volume2,
  VolumeX,
  MicOffIcon,
  Clock,
  Settings,
  ChevronDown,
  User,
  AlertTriangle,
} from "lucide-react"
import type { RoomJoinResponse } from "@/lib/api"
import { getAccessToken } from "@/lib/api"

interface VoiceRoomProps {
  roomData: RoomJoinResponse
  onLeave: () => void
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }
  const token = getAccessToken()
  if (token) {
    ;(headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  }
  return fetch(`${API_BASE}${endpoint}`, { ...options, headers })
}

function RoomInterface({ roomData, onLeave }: VoiceRoomProps) {
  const router = useRouter()
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const room = useRoomContext()
  const [isMuted, setIsMuted] = useState(true)
  const [micError, setMicError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [elapsed, setElapsed] = useState("00:00:00")
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const adminMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (roomData.room_code) {
      window.history.replaceState(null, "", `/room/${roomData.room_code}`)
    }
  }, [roomData.room_code])

  const participantPictures: Record<string, string | null> = {}
  if (roomData.participants) {
    for (const p of roomData.participants) {
      participantPictures[p.display_name] = p.profile_picture_url
    }
  }

  const isAdmin = roomData.livekit.is_admin

  useEffect(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(false).catch(console.error)
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop())
          setMicError(null)
        })
        .catch(() => {
          setMicError("Microphone not available. You can still listen.")
        })
    }
  }, [localParticipant])

  useEffect(() => {
    const start = new Date(roomData.created_at).getTime()
    const timer = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000)
      const h = Math.floor(diff / 3600).toString().padStart(2, "0")
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, "0")
      const s = (diff % 60).toString().padStart(2, "0")
      setElapsed(`${h}:${m}:${s}`)
    }, 1000)
    return () => clearInterval(timer)
  }, [roomData.created_at])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setAdminMenuOpen(false)
      }
    }
    if (adminMenuOpen) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [adminMenuOpen])

  const toggleMute = useCallback(async () => {
    if (!localParticipant) return
    try {
      await localParticipant.setMicrophoneEnabled(isMuted)
      setIsMuted(!isMuted)
    } catch (err) {
      console.error("Mic toggle failed:", err)
    }
  }, [localParticipant, isMuted])

  const handleLeave = useCallback(async () => {
    try {
      await room.disconnect()
    } catch (err) {
      console.error("Disconnect failed:", err)
    }
    router.push("/")
    onLeave()
  }, [room, onLeave, router])

  const copyRoomCode = () => {
    navigator.clipboard.writeText(`gamecall.com/room/${roomData.room_code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const muteAll = async () => {
    try {
      await fetchWithAuth(`/rooms/${roomData.id}/mute-all/`, { method: "POST" })
      setAdminMenuOpen(false)
    } catch (err) {
      console.error("Mute all failed:", err)
    }
  }

  const endRoom = async () => {
    if (!window.confirm("Are you sure you want to end this room for everyone?")) return
    try {
      await fetchWithAuth(`/rooms/${roomData.id}/end/`, { method: "POST" })
      setAdminMenuOpen(false)
      router.push("/")
      onLeave()
    } catch (err) {
      console.error("End room failed:", err)
    }
  }

  const muteParticipant = async (identity: string) => {
    try {
      await fetchWithAuth(`/rooms/${roomData.id}/mute/`, {
        method: "POST",
        body: JSON.stringify({ identity }),
      })
    } catch (err) {
      console.error("Mute participant failed:", err)
    }
  }

  const disconnectParticipant = async (identity: string) => {
    try {
      await fetchWithAuth(`/rooms/${roomData.id}/disconnect/`, {
        method: "POST",
        body: JSON.stringify({ identity }),
      })
    } catch (err) {
      console.error("Disconnect participant failed:", err)
    }
  }

  return (
    <div className="h-screen bg-[#04070E] flex flex-col overflow-hidden">
      <div className="bg-gray-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img src="/gamecall-logo.png" alt="GameCall" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-white font-bold text-sm">GameCall</span>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div className="text-sm flex items-center gap-2">
            <span className="text-white/40 text-xs">Room ID:</span>
            <div className="flex items-center gap-2 bg-gray-900/80 border border-slate-700 rounded-lg px-3 py-1.5">
              <span className="text-white/80 font-mono text-sm font-semibold tracking-wider">{roomData.room_code}</span>
              <button onClick={copyRoomCode} className="text-white/50 hover:text-white transition-colors ml-1">
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            {copied && (
              <span className="text-green-400 text-xs animate-in fade-in">Copied!</span>
            )}
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="h-4 w-4 text-white/40" />
            <span className="text-white/80 font-mono text-xs">{elapsed}</span>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4 text-white/40" />
            <span className="text-white/80 text-xs">{participants.length}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 border border-red-500/20 h-8 text-xs"
          onClick={handleLeave}
        >
          <Phone className="h-3.5 w-3.5 mr-1.5 rotate-135" />
          Leave Room
        </Button>
      </div>

      {micError && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-400 text-xs">
          <AlertTriangle className="h-4 w-4" />
          {micError}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 border-r border-slate-800 bg-gray-950/50 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800">
            <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider">Participants</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {participants.map((p) => {
              const isLocal = p.identity === localParticipant?.identity
              const isSpeaking = p.isSpeaking
              const isMuted = !p.isMicrophoneEnabled
              const isAdminUser = p.permissions?.canPublish
              const profilePic = participantPictures[p.name || ""]

              return (
                <div
                  key={p.sid || p.identity || p.name}
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-300 group ${
                    isSpeaking
                      ? "bg-green-500/10 ring-1 ring-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                      : "bg-gray-900/50 hover:bg-gray-900"
                  }`}
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-offset-1 ring-offset-gray-950 transition-all duration-300"
                      style={{
                        ringColor: isSpeaking ? "rgb(34,197,94)" : "transparent",
                      }}
                    >
                      {profilePic ? (
                        <img src={profilePic} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className={`w-full h-full rounded-full flex items-center justify-center text-xs font-bold ${
                            isSpeaking ? "bg-green-500 text-white" : "bg-gray-700 text-white/80"
                          }`}
                        >
                          {p.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                        </div>
                      )}
                    </div>
                    {isSpeaking && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-950 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-sm font-medium truncate">{p.name || p.identity}</span>
                      {isAdminUser && <Crown className="h-3 w-3 text-yellow-500 shrink-0" />}
                      {isLocal && (
                        <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded">You</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isSpeaking ? (
                        <Volume2 className="h-3 w-3 text-green-400 animate-pulse" />
                      ) : isMuted ? (
                        <VolumeX className="h-3 w-3 text-red-400" />
                      ) : (
                        <Volume2 className="h-3 w-3 text-white/30" />
                      )}
                      <span className="text-[10px] text-white/40">
                        {isMuted ? "Muted" : isSpeaking ? "Speaking" : "Connected"}
                      </span>
                    </div>
                  </div>
                  {isAdmin && !isLocal && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => muteParticipant(p.identity)} className="text-white/50 hover:text-orange-400 p-0.5" title="Mute">
                        <MicOffIcon className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => disconnectParticipant(p.identity)} className="text-white/50 hover:text-red-400 p-0.5" title="Kick">
                        <VolumeX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </aside>

        <main className="flex-1 flex items-center justify-center bg-[#04070E] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,124,157,0.1),transparent_70%)] animate-pulse" />
          <div className="relative z-10 text-center space-y-6 max-w-md mx-auto px-4">
            <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-slate-700 flex items-center justify-center mx-auto">
              {participantPictures[roomData.creator.username] ? (
                <img src={participantPictures[roomData.creator.username] || ""} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <User className="h-10 w-10 text-white/30" />
              )}
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold">{roomData.name}</h2>
              <p className="text-white/40 text-sm mt-1">Hosted by {roomData.creator.username}</p>
            </div>

              <div className="bg-gray-900/80 border border-slate-700 rounded-xl px-4 py-2.5 w-full max-w-full overflow-hidden">
                <div className="flex items-center justify-center gap-2 min-w-0">
                  <Users className="h-4 w-4 text-white/40 shrink-0" />
                  <code className="text-[#0F7C9D] font-mono text-sm md:text-base font-bold truncate">
                    game-call.vercel.app/room/{roomData.room_code}
                  </code>
                  <button onClick={copyRoomCode} className="text-white/50 hover:text-white transition-colors shrink-0 ml-1">
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

            <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Connected • Low Latency</span>
            </div>
          </div>
        </main>
      </div>

      <div className="bg-gray-950/80 backdrop-blur-md border-t border-slate-800 px-6 py-4 flex items-center justify-center shrink-0 relative">
        <div className="flex items-center gap-8">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
              isMuted
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:shadow-red-500/20"
                : "bg-gray-800 text-white hover:bg-gray-700 hover:shadow-gray-500/20"
            }`}
            disabled={!!micError}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>

          <div className="flex items-center gap-3 text-white/40">
            <Volume2 className="h-5 w-5" />
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-white/40 rounded-full" />
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="absolute right-6 bottom-4" ref={adminMenuRef}>
            <button
              onClick={() => setAdminMenuOpen(!adminMenuOpen)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-800/80 border border-slate-700 text-white/70 hover:bg-gray-700 text-sm backdrop-blur-sm cursor-pointer transition-all"
            >
              <Settings className="h-4 w-4" />
              Admin
              <ChevronDown className="h-3 w-3 ml-1" />
            </button>
            {adminMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-44 bg-gray-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-sm">
                <button onClick={muteAll} className="w-full text-left px-4 py-2.5 text-white/70 hover:bg-gray-800 text-sm cursor-pointer flex items-center gap-2">
                  <MicOffIcon className="h-4 w-4" /> Mute All
                </button>
                <button onClick={endRoom} className="w-full text-left px-4 py-2.5 text-red-400/80 hover:bg-gray-800 text-sm cursor-pointer flex items-center gap-2">
                  <Phone className="h-4 w-4 rotate-135" /> End Room
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function VoiceRoom({ roomData, onLeave }: VoiceRoomProps) {
  return (
    <LiveKitRoom
      serverUrl={roomData.livekit.url}
      token={roomData.livekit.token}
      connect
      audio
      video={false}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        width: "100vw",
        height: "100vh",
      }}
    >
      <RoomInterface roomData={roomData} onLeave={onLeave} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  )
}