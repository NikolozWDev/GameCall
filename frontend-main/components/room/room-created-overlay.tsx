"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { profileApi } from "@/lib/api"
import type { Room } from "@/lib/api"
import { ArrowRight, Crown, User } from "lucide-react"

interface RoomCreatedOverlayProps {
  room: Room
  onEnterRoom: () => void
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  )
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}

function SteamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.979 0C5.678 0 .511 5.164.511 11.467c0 5.311 3.601 9.803 8.473 11.132l3.998-5.771c.176-.253.504-.377.835-.288l1.412.381c.387.104.737-.005.912-.248l.8-1.117c.201-.28.206-.644.014-.937l-2.162-3.274c-.184-.281-.512-.426-.849-.37l-1.902.318c-.449.075-.885-.031-1.121-.362l-.736-1.031c-.185-.263-.18-.601.014-.859l2.441-3.247c.177-.234.487-.358.79-.325l3.148.357c1.281.146 2.531.536 3.669 1.157 0 0-3.999-4.931-10.116-4.966v-.005zm7.81 15.769c-.649.629-1.476.919-2.314.762-.787-.147-1.374-.645-1.717-1.109-.307-.416-.416-.946-.307-1.435.11-.483.396-.867.769-1.161.424-.334.975-.521 1.573-.439.535.073 1.005.346 1.329.707.391.44.56 1.002.466 1.609-.09.54-.41 1.023-.917 1.383-.356.253-.727.398-.882.533l.009-.007c.223.24.495.511.662.619.016.01.04.02.04.02.017.011.096-.092.254-.295.36-.461.791-1.01 1.465-1.383.784-.434 1.642-.451 2.488-.005.839.443 1.316 1.197 1.461 2.015.016.089.02.177.02.266 0 .754-.401 1.451-1.048 1.828l-.009.006zm-2.981-1.778c-.199.097-.393.124-.577.111-.296-.021-.533-.182-.609-.439-.029-.098-.046-.21-.029-.336.018-.163.082-.319.194-.447.107-.123.237-.198.367-.229.212-.05.434.008.6.151.107.092.183.197.193.307.011.134-.028.252-.1.365-.069.11-.16.198-.25.255l.007-.006c.097.028.158.122.155.242 0 .12-.005.215-.026.26l-.001.003c.045-.029.086-.065.076-.167v.002l.006.003c.025.059.023.133-.006.215z"/>
    </svg>
  )
}

export function RoomCreatedOverlay({ room, onEnterRoom }: RoomCreatedOverlayProps) {
  const { user, isAuthenticated } = useAuth()
  const [copied, setCopied] = useState(false)
  const [isEntering, setIsEntering] = useState(false)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)

  const roomUrl = `gamecall.com/room/${room.room_code}`

  const loadProfilePicture = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const profile = await profileApi.getProfile()
      setProfilePicture(profile.profile_picture_url)
    } catch {}
  }, [isAuthenticated])

  useEffect(() => {
    loadProfilePicture()
  }, [loadProfilePicture])

  const handleCopy = () => {
    navigator.clipboard.writeText(roomUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEnter = async () => {
    setIsEntering(true)
    onEnterRoom()
  }

  const shareLinks = [
    { name: "Discord", icon: DiscordIcon, url: `https://discord.com` },
    { name: "Telegram", icon: TelegramIcon, url: `https://t.me/share/url?url=${encodeURIComponent(roomUrl)}` },
    { name: "WhatsApp", icon: WhatsAppIcon, url: `https://wa.me/?text=${encodeURIComponent(roomUrl)}` },
    { name: "Steam", icon: SteamIcon, url: `https://steamcommunity.com` },
  ]

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <div className="relative w-full max-w-sm bg-gray-950 border-2 border-slate-800 rounded-2xl p-8 text-center shadow-2xl shadow-[#0F7C9D]/10 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 border-2 border-slate-600 flex items-center justify-center">
              {profilePicture ? (
                <img src={profilePicture} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-white/50" />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-gray-950" />
            {isAuthenticated && user && (
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg border-2 border-gray-950">
                <Crown className="h-3 w-3 text-black" />
              </div>
            )}
          </div>

          <ArrowRight className="h-6 w-6 text-white/40" />

          <div className="w-16 h-16 rounded-2xl bg-[#0F7C9D] flex items-center justify-center shadow-lg shadow-[#0F7C9D]/30">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h3 className="text-white text-lg font-bold mb-2 tracking-wide">ROOM READY</h3>
        <p className="text-white/50 text-sm mb-6 leading-relaxed">
          Your game room is live and waiting.<br />Share the link or jump right in
        </p>

        <div className="bg-gray-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-3 mb-6">
          <code className="text-white/60 text-xs font-mono tracking-wider truncate">{roomUrl}</code>
          <Button
            size="sm"
            className="bg-sky-950 border border-slate-700 text-cyan-300 hover:bg-sky-900 hover:text-cyan-200 text-[10px] px-3 py-1 h-auto rounded-md shrink-0 cursor-pointer"
            onClick={handleCopy}
          >
            {copied ? "COPIED" : "COPY"}
          </Button>
        </div>

        <Button
          className="w-full h-12 bg-[#0F7C9D] hover:bg-[#0E6A87] text-white font-bold rounded-lg transition-all duration-300 shadow-lg shadow-[#0F7C9D]/30 mb-6 cursor-pointer"
          onClick={handleEnter}
          disabled={isEntering}
        >
          {isEntering ? "ENTERING..." : "ENTER ROOM"}
        </Button>

        <div className="flex justify-center gap-4">
          {shareLinks.map((platform) => (
            <a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-white/40 hover:text-white/80 transition-colors no-underline cursor-pointer"
              title={`Share on ${platform.name}`}
            >
              <platform.icon className="w-5 h-5" />
              <span className="text-[9px]">{platform.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}