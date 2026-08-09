"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Loader2 } from "lucide-react"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/contact/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message })
      })

      if (!res.ok) throw new Error("Failed to send message")
      
      setSent(true)
    } catch (err) {
      setError("Something went wrong. Please try again or email us directly at gigiashvilinikoloz@gmail.com")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#04070E] pt-24 pb-16">
      <div className="container mx-auto max-w-2xl px-4 md:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Need a hand?
          </h1>
          <p className="text-white/60 text-lg">
            Have a question, found something that isn't working, or just want to get in touch?
            Send us a message and we'll get back to you.
          </p>
        </div>

        {sent ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-white text-2xl font-bold mb-2">Message sent!</h2>
            <p className="text-white/60">We'll get back to you as soon as possible.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 border border-white/10 rounded-2xl p-8">
            {error && (
              <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>
            )}
            
            <div>
              <label className="text-white/80 text-sm font-medium mb-1.5 block">Name</label>
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 bg-gray-900 border-slate-700 text-white rounded-lg"
              />
            </div>
            <div>
              <label className="text-white/80 text-sm font-medium mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-gray-900 border-slate-700 text-white rounded-lg"
              />
            </div>
            <div>
              <label className="text-white/80 text-sm font-medium mb-1.5 block">Subject</label>
              <Input
                placeholder="What can we help with?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="h-12 bg-gray-900 border-slate-700 text-white rounded-lg"
              />
            </div>
            <div>
              <label className="text-white/80 text-sm font-medium mb-1.5 block">Message</label>
              <textarea
                placeholder="Tell us what's going on..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="w-full p-4 bg-gray-900 border border-slate-700 rounded-lg text-white resize-none focus:border-[#0F7C9D] focus:ring-2 focus:ring-[#0F7C9D]/20"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 bg-[#0F7C9D] hover:bg-[#0E6A87] text-white font-semibold rounded-lg">
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Mail className="h-5 w-5 mr-2" />}
              {loading ? "Sending..." : "Send Message"}
            </Button>

            <p className="text-white/40 text-xs text-center">
              For bug reports: tell us what happened, what you were doing, and your device/browser.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}