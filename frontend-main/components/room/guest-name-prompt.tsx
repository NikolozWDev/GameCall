"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { User } from "lucide-react"

interface GuestNamePromptProps {
  onComplete: () => void
  roomCode?: string
}

export function GuestNamePrompt({ onComplete, roomCode }: GuestNamePromptProps) {
  const { setGuestName } = useAuth()
  const [name, setName] = useState("")

  const isNameValid = name.trim().length >= 2

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isNameValid) return

    setGuestName(name.trim())
    onComplete()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Enter Your Name</CardTitle>
          <CardDescription>
            {roomCode ? `Please enter your name to join room ${roomCode}` : "Please enter your name to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                autoFocus
                required
              />
              {name && !isNameValid && <p className="text-xs text-red-500">Name must be at least 2 characters</p>}
            </div>

            <Button type="submit" className="w-full" disabled={!isNameValid}>
              Continue
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              This name will be saved and used for all voice rooms
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
