"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Plus, User, Users, Menu, X } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { AccountSettingsModal } from "@/components/auth/account-settings-modal"
import { profileApi } from "@/lib/api"
import { MobileMenu } from "@/components/mobile-menu"

export function Header() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [showSettings, setShowSettings] = useState(false)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const loadProfilePicture = useCallback(async () => {
    if (!isAuthenticated || !user) return
    try {
      const profile = await profileApi.getProfile()
      setProfilePicture(profile.profile_picture_url)
    } catch {}
  }, [isAuthenticated, user])

  useEffect(() => {
    loadProfilePicture()
  }, [loadProfilePicture])

  const handleSettingsOpenChange = (open: boolean) => {
    setShowSettings(open)
    if (!open) loadProfilePicture()
  }

  return (
    <header className="bg-[#04070E]/40 backdrop-blur-xl sticky top-0 z-40">
      <div className="container mx-auto max-w-6xl px-4 md:px-8 py-4 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="flex items-center gap-3 cursor-pointer">
          <img src="/gamecall-logo.png" alt="GameCall" className="w-10 h-10 object-contain" />
          <p>
            <span className="text-white text-2xl font-bold">Game</span>
            <span className="text-[#0F7C9D] text-2xl font-bold">Call</span>
          </p>
        </button>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-[#0F7C9D] text-white hover:bg-[#0E6A87] hover:shadow-lg hover:shadow-[#0F7C9D]/40 active:scale-95 cursor-pointer transition-all duration-300 text-sm px-6"
                  onClick={() => router.push("/?create=true")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Room
                </Button>
                <Button
                  size="sm"
                  className="bg-white/10 text-white/80 border border-white/10 hover:bg-white/20 hover:text-white hover:border-white/20 cursor-pointer transition-all duration-300 text-sm px-5"
                  onClick={() => router.push("/?join=true")}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Join Room
                </Button>
              </div>

              <div className="w-4" />

              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1 transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 border border-slate-600 flex items-center justify-center">
                  {profilePicture ? (
                    <img src={profilePicture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-white/60" />
                  )}
                </div>
                <span className="text-sm text-white/80">
                  <span className="font-semibold text-white">{user?.username}</span>
                </span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-[#0F7C9D] text-white hover:bg-[#0E6A87] hover:shadow-lg hover:shadow-[#0F7C9D]/40 active:scale-95 cursor-pointer transition-all duration-300 text-sm px-6"
                  onClick={() => router.push("/?create=true")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Room
                </Button>
                <Button
                  size="sm"
                  className="bg-white/10 text-white/80 border border-white/10 hover:bg-white/20 hover:text-white hover:border-white/20 cursor-pointer transition-all duration-300 text-sm px-5"
                  onClick={() => router.push("/?join=true")}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Join Room
                </Button>
              </div>

              <div className="w-4" />

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-300 text-sm px-5"
                  onClick={() => router.push("/?auth=login")}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Login
                </Button>
                <Button
                  size="sm"
                  className="bg-white/10 text-white/80 border border-white/10 hover:bg-white/20 hover:text-white hover:border-white/20 cursor-pointer transition-all duration-300 text-sm px-5"
                  onClick={() => router.push("/?auth=register")}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Sign Up
                </Button>
              </div>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 text-white/70 hover:text-white"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <MobileMenu 
        open={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        onOpenSettings={() => setShowSettings(true)} 
      />

      <AccountSettingsModal open={showSettings} onOpenChange={handleSettingsOpenChange} />
    </header>
  )
}