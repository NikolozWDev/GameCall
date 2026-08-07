"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AnimatedBackground } from "./animated-background"
import { forgotPasswordApi } from "@/lib/api"
import { Loader2, Mail, ArrowLeft, ShieldCheck } from "lucide-react"

interface ForgotPasswordFormProps {
  onBack: () => void
  onResetToken: (token: string) => void
}

export function ForgotPasswordForm({ onBack, onResetToken }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"email" | "code">("email")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [codeExpiresAt, setCodeExpiresAt] = useState<number>(0)
  const [remaining, setRemaining] = useState<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timer
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (step === "code" && codeExpiresAt > 0) {
      const update = () => {
        const now = Date.now()
        const left = Math.max(0, codeExpiresAt - now)
        setRemaining(left)
        if (left <= 0) {
          if (timerRef.current) clearInterval(timerRef.current)
          setError("Code expired. Please request a new one.")
          setStep("email")
          setCode("")
        }
      }
      update()
      timerRef.current = setInterval(update, 200)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [step, codeExpiresAt])

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateEmail(email)) { setError("Valid email required"); return }
    setError("")
    setIsLoading(true)
    try {
      await forgotPasswordApi.requestCode(email.trim().toLowerCase())
      setCodeExpiresAt(Date.now() + 60000) // 1 minute
      setStep("code")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6 || !/^\d{6}$/.test(code)) { setError("Code must be 6 digits"); return }
    setError("")
    setIsLoading(true)
    try {
      const data = await forgotPasswordApi.verifyCode(email.trim().toLowerCase(), code)
      onResetToken(data.reset_token)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setError("")
    setIsLoading(true)
    try {
      await forgotPasswordApi.requestCode(email.trim().toLowerCase())
      setCodeExpiresAt(Date.now() + 60000)
      setCode("")
      setError("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (ms: number) => {
    const secs = Math.ceil(ms / 1000)
    return `00:${secs.toString().padStart(2, "0")}`
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

          <h2 className="text-white text-3xl font-bold text-center mb-2">Reset Password</h2>
          <p className="text-white/60 text-base text-center mb-8">
            {step === "email" ? "Enter your email to receive a code" : "Enter the 6‑digit code sent to your email"}
          </p>

          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              {error && <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}
              <div className="space-y-3">
                <Label htmlFor="reset-email" className="text-white/70 text-base font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-14 h-12 bg-gray-900 border-slate-700 text-white text-base rounded-lg focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20"
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-12 bg-[#0F7C9D] hover:bg-[#0E6A87] text-white font-semibold text-base rounded-lg transition-all duration-300 cursor-pointer">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              {error && <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}
              <div className="space-y-3">
                <Label htmlFor="reset-code" className="text-white/70 text-base font-medium">Verification Code</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0,6))}
                    className="pl-14 h-12 bg-gray-900 border-slate-700 text-white text-center text-2xl tracking-[0.5em] font-mono rounded-lg focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20"
                  />
                </div>
                <p className="text-white/40 text-sm text-center">
                  {remaining > 0 ? `Expires in ${formatTime(remaining)}` : "Code expired"}
                </p>
              </div>
              <Button type="submit" disabled={isLoading || code.length !== 6} className="w-full h-12 bg-[#0F7C9D] hover:bg-[#0E6A87] text-white font-semibold text-base rounded-lg transition-all duration-300 cursor-pointer">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Code"}
              </Button>
              <button type="button" onClick={handleResend} disabled={isLoading || remaining > 50000} className="w-full text-center text-sm text-[#0F7C9D] hover:text-[#5DAEC4] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                Resend code
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button onClick={onBack} className="text-white/50 hover:text-white flex items-center justify-center gap-1 mx-auto cursor-pointer">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </button>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  )
}