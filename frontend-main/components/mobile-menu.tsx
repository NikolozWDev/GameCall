"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Plus, Users, User } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { profileApi } from "@/lib/api"

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  onOpenSettings?: () => void
}

export function MobileMenu({ open, onClose, onOpenSettings }: MobileMenuProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [profilePicture, setProfilePicture] = useState<string | null>(null)

  const loadProfilePicture = useCallback(async () => {
    if (!isAuthenticated || !user) return
    try {
      const profile = await profileApi.getProfile()
      setProfilePicture(profile.profile_picture_url)
    } catch {}
  }, [isAuthenticated, user])

  useEffect(() => {
    if (open) loadProfilePicture()
  }, [open, loadProfilePicture])

  const handleNavigate = (path: string) => {
    router.push(path)
    onClose()
  }

  const handleSettingsClick = () => {
    onClose()
    setTimeout(() => {
      onOpenSettings?.()
    }, 150)
  }

  if (!open) return null

  return (
    <div className="md:hidden fixed inset-x-0 top-[72px] z-50 bg-gray-950/95 backdrop-blur-xl border-b border-slate-800 animate-in slide-in-from-top-2 duration-200">
      <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
        {isAuthenticated && (
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 border border-slate-600 flex items-center justify-center">
              {profilePicture ? (
                <img src={profilePicture} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-white/60" />
              )}
            </div>
            <span className="text-white font-medium">{user?.username}</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {isAuthenticated ? (
            <>
              <Button
                className="w-full h-12 bg-[#0F7C9D] hover:bg-[#0E6A87] text-white font-semibold rounded-lg"
                onClick={() => handleNavigate("/?create=true")}
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Room
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 border-slate-700 text-white hover:bg-white/10"
                onClick={() => handleNavigate("/?join=true")}
              >
                <Users className="h-5 w-5 mr-2" />
                Join Room
              </Button>
            </>
          ) : (
            <>
              <Button
                className="w-full h-12 bg-[#0F7C9D] hover:bg-[#0E6A87] text-white font-semibold rounded-lg"
                onClick={() => handleNavigate("/?create=true")}
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Room
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 border-slate-700 text-white hover:bg-white/10"
                onClick={() => handleNavigate("/?join=true")}
              >
                <Users className="h-5 w-5 mr-2" />
                Join Room
              </Button>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="ghost"
                  className="flex-1 h-12 border border-slate-700 text-white/70 hover:text-white"
                  onClick={() => handleNavigate("/?auth=login")}
                >
                  Login
                </Button>
                <Button
                  className="flex-1 h-12 bg-white/10 border border-slate-700 text-white hover:bg-white/20"
                  onClick={() => handleNavigate("/?auth=register")}
                >
                  Sign Up
                </Button>
              </div>
            </>
          )}

          {isAuthenticated && (
            <Button
              variant="ghost"
              className="w-full h-12 text-white/70 hover:text-white border border-slate-700 mt-2"
              onClick={handleSettingsClick}
            >
              <User className="h-5 w-5 mr-2" />
              Account Settings
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}