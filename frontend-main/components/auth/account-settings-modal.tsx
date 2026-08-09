"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { profileApi, uploadProfilePicture, type UserProfile } from "@/lib/api"
import { Loader2, Camera, User, Save, X, LogOut } from "lucide-react"
import { playSound, SoundEvent } from '@/lib/sounds'

interface AccountSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountSettingsModal({ open, onOpenChange }: AccountSettingsModalProps) {
  const { user, refreshUser, logout } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [username, setUsername] = useState("")
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [profileSuccess, setProfileSuccess] = useState("")

  const [usernameError, setUsernameError] = useState("")

  const validateUsername = (value: string) => {
    const trimmed = value.trim()
    if (trimmed.length < 3) return "Username must be at least 3 characters."
    if (trimmed.length > 30) return "Username must be at most 30 characters."
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return "Only letters, numbers and underscores allowed."
    return ""
  }

  useEffect(() => {
    if (open && user) loadProfile()
  }, [open, user])

  useEffect(() => {
    if (open) window.__lenis?.stop()
    return () => { window.__lenis?.start() }
  }, [open])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !open) return
    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation()
      el.scrollTop += e.deltaY
    }
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [open])

  const loadProfile = async () => {
    try {
      const data = await profileApi.getProfile()
      setProfile(data)
      setUsername(data.username)
      setPreviewUrl(data.profile_picture_url)
    } catch (err: any) {
      setProfileError(err.message)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Image must be less than 5MB")
      return
    }
    if (!file.type.startsWith("image/")) {
      setProfileError("File must be an image")
      return
    }
    setProfilePicture(file)
    setPreviewUrl(URL.createObjectURL(file))
    setProfileError("")
  }

  const removeProfilePicture = () => {
    setProfilePicture(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSaveProfile = async () => {
    const uError = validateUsername(username)
    if (uError) {
      setUsernameError(uError)
      return
    }
    setUsernameError("")

    setProfileError("")
    setProfileSuccess("")
    setIsProfileLoading(true)
    try {
      let pictureUrl = profile?.profile_picture_url ?? null
      if (profilePicture) {
        pictureUrl = await uploadProfilePicture(profilePicture)
      }

      const updated = await profileApi.updateProfile({
        username,
        profile_picture_url: pictureUrl ?? undefined,
      })
      setProfile(updated)
      setPreviewUrl(pictureUrl)
      setProfilePicture(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      await refreshUser()
      playSound(SoundEvent.PROFILE_UPDATE)
      setProfileSuccess("Profile updated successfully!")
      setTimeout(() => setProfileSuccess(""), 3000)
    } catch (err: any) {
      setProfileError(err.message)
    } finally {
      setIsProfileLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="
        w-[calc(100%-32px)] max-w-lg mx-auto
        bg-gray-950 border-2 border-slate-800 rounded-xl 
        p-0 gap-0 
        max-h-[90vh] md:max-h-[85vh] 
        flex flex-col
        fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        z-[100]
      ">
        <div className="shrink-0 px-6 md:px-8 pt-6 md:pt-8 pb-4">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#0F7C9D] flex items-center justify-center shadow-lg shadow-[#0F7C9D]/30">
                <User className="h-6 w-6 md:h-7 md:w-7 text-white" />
              </div>
              <div>
                <h2 className="text-white text-xl md:text-2xl font-bold">Account Settings</h2>
                <p className="text-white/50 text-sm mt-1">Manage your profile</p>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-6 md:px-8 pb-8 space-y-6 md:space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-gray-800 border-2 border-slate-700 flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-white/30" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0F7C9D] flex items-center justify-center shadow-lg hover:bg-[#0E6A87] transition-colors cursor-pointer"
              >
                <Camera className="h-4 w-4 text-white" />
              </button>
              {previewUrl && previewUrl !== profile?.profile_picture_url && (
                <button 
                  onClick={removeProfilePicture} 
                  className="absolute top-0 right-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg cursor-pointer"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <span className="text-white/50 text-xs">Click the camera to upload (max 5MB)</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-username" className="text-white/70 text-sm font-medium">Username</Label>
              <Input
                id="settings-username"
                type="text"
                placeholder="Your username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setUsernameError("") }}
                className="h-12 bg-gray-900 border-slate-700 text-white rounded-lg focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20"
              />
              {usernameError && <p className="text-xs text-red-400 mt-1">{usernameError}</p>}
            </div>
            
            {profileError && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                {profileError}
              </div>
            )}
            
            {profileSuccess && (
              <div className="p-3 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg">
                {profileSuccess}
              </div>
            )}
            
            <Button 
              onClick={handleSaveProfile} 
              disabled={isProfileLoading} 
              className="w-full h-12 bg-[#0F7C9D] hover:bg-[#0E6A87] text-white font-semibold rounded-lg cursor-pointer"
            >
              {isProfileLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Save Profile</>
              )}
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <Button
              onClick={logout}
              variant="ghost"
              className="w-full h-12 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}