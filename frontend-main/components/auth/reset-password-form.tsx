"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AnimatedBackground } from "./animated-background"
import { forgotPasswordApi } from "@/lib/api"
import { Loader2, Lock } from "lucide-react"

interface ResetPasswordFormProps {
  token: string
  onSuccess: () => void
}

export function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState("")
  const [newPassword2, setNewPassword2] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const isPasswordValid = newPassword.length >= 8
  const doPasswordsMatch = newPassword === newPassword2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPasswordValid) { setError("Password must be at least 8 characters"); return }
    if (!doPasswordsMatch) { setError("Passwords do not match"); return }
    setError("")
    setIsLoading(true)
    try {
      await forgotPasswordApi.resetPassword(token, newPassword, newPassword2)
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatedBackground>
      <div className="w-full max-w-2xl px-4">
        <div className="bg-gray-950/80 backdrop-blur-sm border-4 border-slate-900 rounded-xl p-10">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center">
              <img src="/gamecall-logo.png" alt="GameCall" className="w-10 h-10 object-contain" />
            </div>
            <p>
              <span className="text-white text-2xl font-bold">Game</span>
              <span className="text-[#0F7C9D] text-2xl font-bold">Call</span>
            </p>
          </div>

          <h2 className="text-white text-3xl font-bold text-center mb-2">Set New Password</h2>
          <p className="text-white/60 text-base text-center mb-8">Enter your new password below</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}

            <div className="space-y-3">
              <Label htmlFor="reset-new-password" className="text-white/70 text-base font-medium">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  id="reset-new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-14 h-12 bg-gray-900 border-slate-700 text-white text-base rounded-lg focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20"
                />
              </div>
              {newPassword && !isPasswordValid && <p className="text-sm text-red-400">Minimum 8 characters</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="reset-confirm-password" className="text-white/70 text-base font-medium">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  id="reset-confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                  className="pl-14 h-12 bg-gray-900 border-slate-700 text-white text-base rounded-lg focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20"
                />
              </div>
              {newPassword2 && !doPasswordsMatch && <p className="text-sm text-red-400">Passwords do not match</p>}
            </div>

            <Button type="submit" disabled={!isPasswordValid || !doPasswordsMatch || isLoading} className="w-full h-12 bg-[#0F7C9D] hover:bg-[#0E6A87] text-white font-semibold text-base rounded-lg transition-all duration-300 cursor-pointer">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}
            </Button>
          </form>
        </div>
      </div>
    </AnimatedBackground>
  )
}