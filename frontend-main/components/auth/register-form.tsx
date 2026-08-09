"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { APIError } from "@/lib/api"
import { Loader2, Mail, Lock, User } from "lucide-react"
import { AnimatedBackground } from "./animated-background"
import { playSound, SoundEvent } from '@/lib/sounds'
import { FadeInSection } from "@/components/fade-in-section"

interface RegisterFormProps {
  onSuccess?: () => void
  onLoginClick?: () => void
}

export function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const { register } = useAuth()
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isUsernameValid = username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username)
  const isPasswordValid = password.length >= 8
  const doPasswordsMatch = password === password2
  const isFormValid = isEmailValid && isUsernameValid && isPasswordValid && doPasswordsMatch

  const getPasswordStrength = () => {
    if (!password) return { width: "0%", color: "bg-gray-700" }
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    if (strength <= 1) return { width: "25%", color: "bg-red-500" }
    if (strength === 2) return { width: "50%", color: "bg-orange-500" }
    if (strength === 3) return { width: "75%", color: "bg-yellow-500" }
    return { width: "100%", color: "bg-green-500" }
  }

  const passwordStrength = getPasswordStrength()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setError("")
    setIsLoading(true)

    try {
      await register(email, username, password, password2)
      playSound(SoundEvent.REGISTER_SUCCESS)
      onSuccess?.()
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatedBackground>
      <div className="w-full max-w-2xl px-4">
        <FadeInSection>
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

            <h2 className="text-white text-3xl font-bold text-center mb-2">Create your account</h2>
            <p className="text-white/60 text-base text-center mb-8">Enter your details to get started</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>
              )}

              <div className="space-y-3">
                <Label htmlFor="username" className="text-white/70 text-base font-medium">Username</Label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-14 h-12 bg-gray-900 border-slate-700 text-white text-base rounded-lg focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20"
                  />
                </div>
                {username && !isUsernameValid && (
                  <p className="text-sm text-red-400">Username must be at least 3 characters (letters, numbers, underscore)</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-white/70 text-base font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-14 h-12 bg-gray-900 border-slate-700 text-white text-base rounded-lg focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20"
                  />
                </div>
                {email && !isEmailValid && <p className="text-sm text-red-400">Please enter a valid email address</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-white/70 text-base font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-14 h-12 bg-gray-900 border-slate-700 text-white text-base rounded-lg focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20"
                  />
                </div>
                {password && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className={`h-1 flex-1 rounded-full ${passwordStrength.width !== "0%" ? passwordStrength.color : "bg-gray-700"}`} />
                      <div className={`h-1 flex-1 rounded-full ${["50%", "75%", "100%"].includes(passwordStrength.width) ? passwordStrength.color : "bg-gray-700"}`} />
                      <div className={`h-1 flex-1 rounded-full ${["75%", "100%"].includes(passwordStrength.width) ? passwordStrength.color : "bg-gray-700"}`} />
                      <div className={`h-1 flex-1 rounded-full ${passwordStrength.width === "100%" ? passwordStrength.color : "bg-gray-700"}`} />
                    </div>
                    <p className="text-xs text-white/50">Password strength</p>
                  </div>
                )}
                {password && !isPasswordValid && (
                  <p className="text-sm text-red-400">Password must be at least 8 characters</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="password2" className="text-white/70 text-base font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    id="password2"
                    type="password"
                    placeholder="Confirm your password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className="pl-14 h-12 bg-gray-900 border-slate-700 text-white text-base rounded-lg focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20"
                  />
                </div>
                {password2 && !doPasswordsMatch && <p className="text-sm text-red-400">Passwords do not match</p>}
              </div>

              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full h-12 bg-[#0F7C9D] hover:bg-[#0E6A87] text-white font-semibold text-base rounded-lg transition-all duration-300 cursor-pointer"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-base mt-6">
              <span className="text-white/50">Already have an account?</span>{" "}
              <button type="button" onClick={onLoginClick} className="text-[#0F7C9D] hover:text-[#5DAEC4] transition-colors font-semibold cursor-pointer">
                Login
              </button>
            </p>
          </div>
        </FadeInSection>
      </div>
    </AnimatedBackground>
  )
}