"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  LiveKitRoom, RoomAudioRenderer,
  useParticipants, useLocalParticipant, useRoomContext,
} from "@livekit/components-react"
import { Track } from "livekit-client"
import "@livekit/components-styles"
import {
  Mic, MicOff, Phone, Users, Copy, Check, Crown,
  Volume2, VolumeX, MicOffIcon, Clock, Settings, ChevronDown,
  AlertTriangle, MessageSquare, Send, Loader2, X,
} from "lucide-react"
import type { RoomJoinResponse, ChatMessage } from "@/lib/api"
import { getAccessToken, chatApi, api } from "@/lib/api"
import { playSound, SoundEvent } from '@/lib/sounds'

interface VoiceRoomProps { roomData: RoomJoinResponse; onLeave: () => void }

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const headers: HeadersInit = { "Content-Type": "application/json", ...options.headers }
  const token = getAccessToken()
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  return fetch(`${API_BASE}${endpoint}`, { ...options, headers })
}

const getGridClass = (count: number) => {
  if (count === 1) return "grid-cols-1 max-w-2xl"
  if (count === 2) return "grid-cols-2 max-w-4xl"
  if (count === 3) return "grid-cols-3 max-w-5xl"
  if (count <= 4) return "grid-cols-2 max-w-5xl"
  if (count <= 6) return "grid-cols-3 max-w-6xl"
  if (count <= 9) return "grid-cols-3 max-w-7xl"
  return "grid-cols-4 max-w-7xl"
}

const PHOTOS = [
  "/photos/1.webp", "/photos/2.jpg", "/photos/3.jpg", "/photos/4.jpeg",
  "/photos/5.webp", "/photos/6.jpg", "/photos/7.avif", "/photos/8.jpg",
  "/photos/9.jfif", "/photos/10.jfif", "/photos/11.avif",
]

function getRandomPhoto(current?: string) {
  let next = PHOTOS[Math.floor(Math.random() * PHOTOS.length)]
  if (PHOTOS.length > 1 && current) while (next === current) next = PHOTOS[Math.floor(Math.random() * PHOTOS.length)]
  return next
}

function RoomInterface({ roomData, onLeave }: VoiceRoomProps) {
  const router = useRouter()
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const room = useRoomContext()
  const [isMuted, setIsMuted] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [elapsed, setElapsed] = useState("00:00:00")
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const adminMenuRef = useRef<HTMLDivElement>(null)
  const [volumes, setVolumes] = useState<Record<string, number>>({})
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLeaving, setIsLeaving] = useState(false)

  const [currentBg, setCurrentBg] = useState(() => getRandomPhoto())
  const [nextBg, setNextBg] = useState<string | null>(null)
  const currentBgRef = useRef(currentBg)
  useEffect(() => { currentBgRef.current = currentBg }, [currentBg])

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getRandomPhoto(currentBgRef.current)
      setNextBg(next)
      setTimeout(() => {
        setCurrentBg(next)
        currentBgRef.current = next
        setNextBg(null)
      }, 1200)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    window.__lenis?.start()
  }, [])

  useEffect(() => {
    const unlock = () => {
      document.querySelectorAll('audio').forEach(a => {
        a.play().catch(() => {})
      })
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const participantPictures: Record<string, string | null> = {}
  if (roomData.participants) for (const p of roomData.participants) {
    if (p.profile_picture_url) {
      participantPictures[p.display_name] = p.profile_picture_url
      participantPictures[p.identity] = p.profile_picture_url
    }
  }

  useEffect(() => { chatApi.fetchMessages(roomData.id).then(setMessages).catch(console.error) }, [roomData.id])

  useEffect(() => {
    if (!room) return
    const handler = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload))

        if (msg.type === "chat") {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            identity: msg.identity,
            display_name: msg.display_name,
            text: msg.text,
            created_at: new Date().toISOString()
          }])
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)

          if (msg.identity !== (localParticipant?.identity || '')) {
            playSound(SoundEvent.CHAT_MESSAGE)
            if (!showChat) {
              setUnreadCount(prev => prev + 1)
            }
          }
        } else if (msg.type === "mute" && msg.targetIdentity === localParticipant?.identity) {
          localParticipant?.setMicrophoneEnabled(false)
          setIsMuted(true)
        } else if (msg.type === "mute-all" && !isAdmin) {
          localParticipant?.setMicrophoneEnabled(false)
          setIsMuted(true)
        } else if (msg.type === "mic_change") {
          if (msg.identity !== localParticipant?.identity) {
            playSound(msg.isMuted ? SoundEvent.MIC_OFF : SoundEvent.MIC_ON)
          }
        } else if (msg.type === "leave") {
          playSound(SoundEvent.PARTICIPANT_LEAVE)
        } else if (msg.type === "room_ended") {
          try { room.disconnect() } catch {}
          router.push("/")
          onLeave()
        }
      } catch {}
    }
    room.on("dataReceived", handler)
    return () => { room.off("dataReceived", handler) }
  }, [room, localParticipant, isAdmin, showChat, onLeave, router])

  useEffect(() => {
    playSound(SoundEvent.ROOM_JOIN)
  }, [])

  useEffect(() => { if (roomData.room_code) window.history.replaceState(null, "", `/room/${roomData.room_code}`) }, [roomData.room_code])

  useEffect(() => {
    if (!localParticipant) return

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => { stream.getTracks().forEach(t => t.stop()); setMicError(null) })
      .catch(() => setMicError("Microphone not available. You can still listen."))

    if (!localParticipant.isMicrophoneEnabled) {
      localParticipant.setMicrophoneEnabled(true)
        .then(() => setIsMuted(false))
        .catch(err => {
          console.warn("Mic enable failed:", err)
          setIsMuted(true)
        })
    }
  }, [localParticipant])

  useEffect(() => {
    const createdMs = roomData.created_at 
      ? new Date(roomData.created_at).getTime()
      : Date.now()
    
    const serverNowMs = (roomData as any).server_time 
      ? new Date((roomData as any).server_time).getTime()
      : Date.now()
    
    const elapsedOffset = serverNowMs - createdMs
    const initialNow = Date.now()
    const roomStart = initialNow - elapsedOffset

    const timer = setInterval(() => {
      const diff = Math.floor((Date.now() - roomStart) / 1000)
      setElapsed(
        `${Math.floor(diff/3600).toString().padStart(2,"0")}:` +
        `${Math.floor((diff%3600)/60).toString().padStart(2,"0")}:` +
        `${(diff%60).toString().padStart(2,"0")}`
      )
    }, 1000)
    
    return () => clearInterval(timer)
  }, [roomData.created_at, (roomData as any).server_time])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) setAdminMenuOpen(false) }
    if (adminMenuOpen) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [adminMenuOpen])

  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = "auto"
      chatInputRef.current.style.height = `${Math.min(chatInputRef.current.scrollHeight, 160)}px`
    }
  }, [chatInput])

  useEffect(() => {
    if (showChat) setUnreadCount(0)
  }, [showChat])

  const toggleMute = useCallback(async () => {
    if (!localParticipant) return
    try {
      const currentlyMuted = isMuted
      const shouldEnable = currentlyMuted
      await localParticipant.setMicrophoneEnabled(shouldEnable)
      setIsMuted(!shouldEnable)

      playSound(shouldEnable ? SoundEvent.MIC_ON : SoundEvent.MIC_OFF)

      if (room.localParticipant) {
        room.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify({
            type: "mic_change",
            identity: localParticipant.identity,
            isMuted: !shouldEnable
          })),
          { reliable: true }
        ).catch(console.error)
      }
    } catch (err) {
      console.error("Mic toggle failed:", err)
    }
  }, [localParticipant, isMuted, room])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: roomData.name,
      artist: `Hosted by ${roomData.creator.username}`,
      album: 'GameCall',
      artwork: [
        { src: '/gamecall-logo.png', sizes: '96x96', type: 'image/png' },
        { src: '/gamecall-logo.png', sizes: '128x128', type: 'image/png' },
        { src: '/gamecall-logo.png', sizes: '256x256', type: 'image/png' }
      ]
    })

    const action: MediaSessionAction = 'togglemicrophone' as MediaSessionAction
    navigator.mediaSession.setActionHandler(action, () => toggleMute())

    return () => {
      navigator.mediaSession.setActionHandler(action, null)
      navigator.mediaSession.metadata = null
    }
  }, [roomData, toggleMute])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        const activeTag = document.activeElement?.tagName
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || 
            (document.activeElement as HTMLElement)?.isContentEditable) {
          return
        }
        e.preventDefault()
        toggleMute()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleMute])

  const handleLeave = useCallback(async () => {
      setIsLeaving(true)
      playSound(SoundEvent.PARTICIPANT_LEAVE)

      const identity = localParticipant?.identity || roomData.participants?.[0]?.identity

      if (room.localParticipant && identity) {
        try {
          await room.localParticipant.publishData(
            new TextEncoder().encode(JSON.stringify({ type: "leave", identity })),
            { reliable: true }
          )
        } catch {}
      }

      try {
        if (identity) {
          await api.leaveRoom(roomData.id, identity)
        }
      } catch {}

      try { await room.disconnect() } catch {}

      router.push("/")
      onLeave()
  }, [room, onLeave, router, localParticipant, roomData])

  const copyRoomCode = () => {
    navigator.clipboard.writeText(`game-call.vercel.app/room/${roomData.room_code}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const muteParticipant = useCallback(async (identity: string) => {
    fetchWithAuth(`/rooms/${roomData.id}/mute/`, { method: "POST", body: JSON.stringify({ identity }) }).catch(console.error)
    if (room.localParticipant) await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ type: "mute", targetIdentity: identity })), { reliable: true })
  }, [room, roomData.id])

  const muteAll = useCallback(async () => {
    fetchWithAuth(`/rooms/${roomData.id}/mute-all/`, { method: "POST" }).catch(console.error)
    if (room.localParticipant) await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ type: "mute-all" })), { reliable: true })
    setAdminMenuOpen(false)
  }, [room, roomData.id])

  const disconnectParticipant = async (identity: string) => {
    try { await fetchWithAuth(`/rooms/${roomData.id}/disconnect/`, { method: "POST", body: JSON.stringify({ identity }) }) }
    catch (err) { console.error("Disconnect participant failed:", err) }
  }

  const endRoom = async () => {
    if (!window.confirm("Are you sure you want to end this room for everyone?")) return
    try {
      if (room.localParticipant) {
        await room.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify({ type: "room_ended" })),
          { reliable: true }
        ).catch(() => {})
      }
      await fetchWithAuth(`/rooms/${roomData.id}/end/`, { method: "POST" })
      setAdminMenuOpen(false)
      router.push("/")
      onLeave()
    } catch (err) { console.error("End room failed:", err) }
  }

  const handleVolumeChange = useCallback((identity: string, value: number) => {
    setVolumes(prev => ({ ...prev, [identity]: value }))
    const participant = participants.find(p => p.identity === identity)
    if (participant && !participant.isLocal) {
      participant.setVolume(value / 100)
    }
  }, [participants])

  useEffect(() => { participants.forEach(p => { if (!volumes[p.identity]) setVolumes(prev => ({ ...prev, [p.identity]: 100 })) }) }, [participants, volumes])

  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;

    const identity = localParticipant?.identity || roomData.participants?.[0]?.identity || `guest-${Date.now()}`;
    const displayName = localParticipant?.name || roomData.participants?.[0]?.display_name || "Guest";

    const tempMsg: ChatMessage = {
      id: Date.now().toString(),
      identity,
      display_name: displayName,
      text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setChatInput("");
    if (chatInputRef.current) chatInputRef.current.style.height = "auto";

    playSound(SoundEvent.CHAT_MESSAGE)

    try { await chatApi.sendMessage(roomData.id, identity, displayName, text); }
    catch (err) { console.error("Failed to save message:", err); }

    try {
      if (room.localParticipant) {
        const payload = JSON.stringify({ type: "chat", identity, display_name: displayName, text });
        await room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
      }
    } catch (err) {
      console.warn("Data channel send failed:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => setShowChat(prev => !prev)

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[#04070E]">
      {isLeaving && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#0F7C9D] mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Leaving room...</p>
          </div>
        </div>
      )}

      <div className="relative z-30 shrink-0 bg-gray-950/90 backdrop-blur-md border-b border-slate-800 px-3 md:px-6 py-3 flex items-center gap-2 md:gap-6">
        <div className="flex items-center gap-2 md:gap-3">
          <img src="/gamecall-logo.png" className="w-5 h-5 md:w-6 md:h-6" alt="GameCall" />
          <div className="flex flex-col">
            <span className="text-white font-bold text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{roomData.name}</span>
            <span className="text-white/40 text-[10px] md:text-xs">Hosted by {roomData.creator.username}</span>
          </div>
        </div>
        <div className="hidden md:block h-8 w-px bg-slate-700" />
        <div className="hidden md:flex items-center gap-2 bg-gray-900/80 border border-slate-700 rounded-lg px-3 py-1.5 cursor-pointer hover:border-slate-600" onClick={copyRoomCode}>
          <span className="text-[#0F7C9D] font-mono text-xs font-semibold truncate max-w-[200px]">game-call.vercel.app/room/{roomData.room_code}</span>
          {copied ? <Check className="h-3.5 w-3.5 text-green-400 shrink-0" /> : <Copy className="h-3.5 w-3.5 text-white/40 shrink-0" />}
        </div>
        {copied && <span className="hidden md:inline text-green-400 text-xs">Copied!</span>}
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <Clock className="h-3 w-3 md:h-4 md:w-4 text-white/40" /><span className="text-white/80 font-mono text-[10px] md:text-xs">{elapsed}</span>
          <Users className="h-3 w-3 md:h-4 md:w-4 text-white/40" /><span className="text-white/80 text-[10px] md:text-xs">{participants.length}</span>
        </div>
      </div>

      {micError && <div className="relative z-30 shrink-0 bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-400 text-xs"><AlertTriangle className="h-4 w-4" />{micError}</div>}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img src={currentBg} aria-hidden="true"
            className={`absolute inset-[-20px] h-[calc(100%+40px)] w-[calc(100%+40px)] object-cover object-center blur-[10px] scale-105 transition-opacity duration-[1200ms] ease-in-out ${nextBg ? "opacity-0" : "opacity-100"}`} />
          {nextBg && (
            <img src={nextBg} aria-hidden="true"
              className="absolute inset-[-20px] h-[calc(100%+40px)] w-[calc(100%+40px)] object-cover object-center blur-[10px] scale-105 opacity-100 transition-opacity duration-[1200ms] ease-in-out" />
          )}
          <div className="absolute inset-0 bg-[#080B16]/65" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
        </div>

        <div className="relative z-10 flex h-full min-h-0 w-full overflow-hidden">
          <main className="relative min-w-0 flex-1 overflow-auto">
            <div className="flex min-h-full w-full items-center justify-center p-2 md:p-4 lg:p-8">
              <div className={`w-full grid gap-2 md:gap-4 auto-rows-fr ${getGridClass(participants.length)}`}>
                {participants.map(p => {
                  const isLocal = p.identity === localParticipant?.identity
                  const isSpeaking = p.isSpeaking
                  const isMuted = !p.isMicrophoneEnabled
                  const isAdminUser = p.identity.startsWith(`user-${roomData.creator.id}`)
                  const profilePic = participantPictures[p.name || ""]
                  const vol = volumes[p.identity] ?? 100
                  return (
                    <div key={p.sid || `${p.identity}-${p.name}`}
                      className={`relative min-h-[120px] md:min-h-[180px] bg-[#252538]/55 backdrop-blur-sm rounded-xl md:rounded-2xl overflow-hidden border transition-all duration-300 group flex flex-col items-center justify-center p-3 md:p-6 ${isSpeaking ? "border-green-400 ring-2 ring-green-400/40 shadow-[0_0_30px_rgba(34,197,94,0.25)]" : "border-white/5 hover:border-white/10"}`}>
                      {isAdmin && !isLocal && (
                        <div className="absolute top-2 right-2 md:top-3 md:right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button onClick={() => muteParticipant(p.identity)} className="p-1 md:p-1.5 rounded-lg bg-black/40 text-white/70 hover:text-orange-400 hover:bg-black/60" title="Mute"><MicOffIcon className="h-3 w-3 md:h-4 md:w-4" /></button>
                          <button onClick={() => disconnectParticipant(p.identity)} className="p-1 md:p-1.5 rounded-lg bg-black/40 text-white/70 hover:text-red-400 hover:bg-black/60" title="Kick"><VolumeX className="h-3 w-3 md:h-4 md:w-4" /></button>
                        </div>
                      )}
                      <div className="relative">
                        <div className={`w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-2 md:border-4 transition-all duration-300 ${isSpeaking ? "border-green-400 scale-105" : "border-white/10"}`}>
                          {profilePic ? <img src={profilePic} className="w-full h-full object-cover" alt={p.name} /> : <div className="w-full h-full flex items-center justify-center bg-[#3b3b52] text-white text-lg md:text-2xl font-bold">{p.name?.charAt(0).toUpperCase() || "?"}</div>}
                        </div>
                        {isAdminUser && <div className="absolute -top-1 -left-1 w-4 h-4 md:w-6 md:h-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg border-2 border-[#1a1a2e]"><Crown className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 text-black" /></div>}
                      </div>
                      <div className="mt-2 md:mt-4 flex items-center gap-1 md:gap-1.5"><span className="text-white font-semibold text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{p.name || p.identity}</span>{isLocal && <span className="text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">You</span>}</div>
                      <div className="flex items-center gap-1 mt-0.5 md:mt-1">{isSpeaking ? <Volume2 className="h-3 w-3 md:h-3.5 md:w-3.5 text-green-400 animate-pulse" /> : isMuted ? <VolumeX className="h-3 w-3 md:h-3.5 md:w-3.5 text-red-400" /> : <Volume2 className="h-3 w-3 md:h-3.5 md:w-3.5 text-white/30" />}<span className="text-[10px] md:text-xs text-white/40">{isMuted ? "Muted" : isSpeaking ? "Speaking" : "Connected"}</span></div>
                      {isSpeaking && <div className="absolute top-2 left-2 md:top-3 md:left-3 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full bg-green-500/20 border border-green-400/30 text-green-400 text-[8px] md:text-[10px] font-semibold">Speaking</div>}
                      <div className="mt-auto pt-2 md:pt-4 opacity-0 group-hover:opacity-100 transition-opacity w-full flex items-center gap-1 md:gap-1.5">
                        <Volume2 className="h-2.5 w-2.5 md:h-3 md:w-3 text-white/60 shrink-0" />
                        <input type="range" min="0" max="100" value={vol} onChange={e => handleVolumeChange(p.identity, Number(e.target.value))} className="flex-1 h-1 accent-[#0F7C9D] bg-slate-600 rounded-full appearance-none cursor-pointer" />
                        <span className="text-[8px] md:text-[10px] text-white/60 w-5 md:w-6 text-right">{vol}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </main>

          {showChat && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" 
                onClick={toggleChat}
              />
              
              <aside className="
                fixed z-50 bg-gray-950 flex flex-col
                inset-0 md:inset-auto
                md:relative md:z-20 md:w-[340px] md:shrink-0 md:border-l md:border-slate-800
                animate-in slide-in-from-right duration-200
                pb-24 md:pb-0
              ">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
                  <h3 className="text-white/80 text-sm font-semibold">Room Chat</h3>
                  <button 
                    onClick={toggleChat} 
                    className="text-white/50 hover:text-white p-1"
                    aria-label="Close chat"
                  >
                    <X className="h-5 w-5 md:hidden" />
                    <ChevronDown className="h-5 w-5 hidden md:block" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white/80 shrink-0">
                        {msg.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium">{msg.display_name}</span>
                          <span className="text-white/40 text-xs">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-white/70 text-sm mt-0.5 break-words">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                
                <div className="shrink-0 p-4 border-t border-slate-800 bg-gray-950/50">
                  <div className="flex items-end gap-2">
                    <textarea 
                      ref={chatInputRef} 
                      placeholder="Type a message..." 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      onKeyDown={handleKeyDown} 
                      rows={1}
                      className="flex-1 max-h-[160px] px-4 py-2 bg-gray-900 border border-slate-700 rounded-lg text-white text-sm focus:border-[#0F7C9D] focus:ring-1 focus:ring-[#0F7C9D]/30 placeholder:text-white/30 resize-none overflow-y-auto" 
                    />
                    <button 
                      onClick={handleSendMessage} 
                      className="h-10 w-10 flex items-center justify-center bg-[#0F7C9D] hover:bg-[#0E6A87] text-white rounded-lg shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </aside>
            </>
          )}
        </div>
      </div>

      <div className="relative z-30 shrink-0 bg-gray-950/90 backdrop-blur-md border-t border-slate-800 px-3 md:px-6 py-3 md:py-4 flex items-center justify-center gap-3 md:gap-6 pb-[env(safe-area-inset-bottom,16px)]">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden md:block text-[10px] text-white/30 font-mono">Ctrl+Space</span>
          <button
            onClick={toggleMute}
            disabled={!!micError}
            title="Toggle Microphone (Ctrl+Space)"
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${isMuted ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:shadow-red-500/20" : "bg-gray-800 text-white hover:bg-gray-700 hover:shadow-gray-500/20"}`}
          >
            {isMuted ? <MicOff className="h-4 w-4 md:h-5 md:w-5" /> : <Mic className="h-4 w-4 md:h-5 md:w-5" />}
          </button>
          <button onClick={toggleChat}
            className={`relative flex items-center gap-1 md:gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all duration-300 cursor-pointer ${showChat ? "bg-[#0F7C9D]/20 border border-[#0F7C9D]/30 text-[#0F7C9D]" : "bg-gray-800 border border-slate-700 text-white/60 hover:bg-gray-700 hover:text-white"}`}>
            <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="text-xs md:text-sm font-medium">Chat</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] md:min-w-[18px] md:h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] md:text-[10px] font-bold px-1">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
        <button onClick={handleLeave} className="flex items-center gap-1 md:gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-300 cursor-pointer ml-4 md:ml-8">
          <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 rotate-135" /><span className="text-xs md:text-sm font-medium">Leave</span>
        </button>
        {isAdmin && (
          <div className="absolute right-3 md:right-6 bottom-3 md:bottom-4" ref={adminMenuRef}>
            <button onClick={() => setAdminMenuOpen(!adminMenuOpen)} className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-md bg-gray-800/80 border border-slate-700 text-white/70 hover:bg-gray-700 text-xs md:text-sm backdrop-blur-sm cursor-pointer transition-all">
              <Settings className="h-3 w-3 md:h-4 md:w-4" /> Admin <ChevronDown className="h-2.5 w-2.5 md:h-3 md:w-3 ml-0.5 md:ml-1" />
            </button>
            {adminMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-36 md:w-44 bg-gray-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-sm">
                <button onClick={muteAll} className="w-full text-left px-3 py-2 md:px-4 md:py-2.5 text-white/70 hover:bg-gray-800 text-xs md:text-sm cursor-pointer flex items-center gap-2"><MicOffIcon className="h-3 w-3 md:h-4 md:w-4" /> Mute All</button>
                <button onClick={endRoom} className="w-full text-left px-3 py-2 md:px-4 md:py-2.5 text-red-400/80 hover:bg-gray-800 text-xs md:text-sm cursor-pointer flex items-center gap-2"><Phone className="h-3 w-3 md:h-4 md:w-4 rotate-135" /> End Room</button>
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
    <LiveKitRoom serverUrl={roomData.livekit.url} token={roomData.livekit.token} connect audio video={false}
      style={{ position: "fixed", inset: 0, zIndex: 9999, width: "100vw", height: "100vh" }}>
      <RoomInterface roomData={roomData} onLeave={onLeave} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  )
}