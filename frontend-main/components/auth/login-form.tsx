"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { APIError } from "@/lib/api"
import { Loader2, Mail, Lock } from "lucide-react"
import Link from "next/link"
import { AnimatedBackground } from "./animated-background"

interface LoginFormProps {
  onSuccess?: () => void
  onRegisterClick?: () => void
  onForgotPassword?: () => void
  successMessage?: string
}

export function LoginForm({ onSuccess, onRegisterClick, onForgotPassword, successMessage }: LoginFormProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isPasswordValid = password.length >= 8
  const isFormValid = isEmailValid && isPasswordValid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    setError("")
    setIsLoading(true)
    try {
      await login(email, password)
      onSuccess?.()
    } catch (err) {
      if (err instanceof APIError) setError(err.message)
      else setError("An unexpected error occurred")
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

          <h2 className="text-white text-3xl font-bold text-center mb-2">Welcome back</h2>
          <p className="text-white/60 text-base text-center mb-8">Log in to continue to your account</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {successMessage && (
              <div className="p-4 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg">{successMessage}</div>
            )}
            {error && (
              <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>
            )}

            <div className="space-y-3">
              <Label htmlFor="email" className="text-white/70 text-base font-medium">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-14 h-12 bg-gray-900 border-slate-700 text-white text-base rounded-lg focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20"
                />
              </div>
              {email && !isEmailValid && <p className="text-sm text-red-400">Valid email required</p>}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-white/70 text-base font-medium">Password</Label>
                <span
                  onClick={onForgotPassword}
                  className="text-white/40 text-sm cursor-pointer hover:text-[#0F7C9D] transition-colors"
                >
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-14 h-12 bg-gray-900 border-neutral-800 text-white text-base rounded-lg focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20"
                />
              </div>
              {password && !isPasswordValid && <p className="text-sm text-red-400">Minimum 8 characters</p>}
            </div>

            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full h-12 bg-[#0F7C9D] hover:bg-[#0E6A87] text-white font-semibold text-base rounded-lg transition-all duration-300 cursor-pointer"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
            </Button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-neutral-500 text-sm font-semibold">or continue as guest</span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          <Link
            href="/?join=true"
            className="block w-full text-center py-3 text-white/50 text-base border border-neutral-800 rounded-lg hover:border-[#0F7C9D] hover:text-white transition-all duration-300 cursor-pointer"
          >
            Continue as Guest
          </Link>

          <p className="text-center text-base mt-6">
            <span className="text-white/50">Don&apos;t have an account?</span>{" "}
            <button onClick={onRegisterClick} className="text-[#0F7C9D] hover:text-[#5DAEC4] transition-colors font-semibold cursor-pointer">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </AnimatedBackground>
  )
}