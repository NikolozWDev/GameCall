"use client"

import { createContext, useContext, useState } from "react"

const RoomContext = createContext<{
  isVoiceRoomActive: boolean
  setVoiceRoomActive: (active: boolean) => void
}>({
  isVoiceRoomActive: false,
  setVoiceRoomActive: () => {},
})

export const useRoomContext = () => useContext(RoomContext)

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [isVoiceRoomActive, setVoiceRoomActive] = useState(false)
  return (
    <RoomContext.Provider value={{ isVoiceRoomActive, setVoiceRoomActive }}>
      {children}
    </RoomContext.Provider>
  )
}