"use client"

import { useEffect } from "react"
import Lenis from "@studio-freight/lenis"

declare global { interface Window { __lenis: Lenis | null } }

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    window.__lenis = lenis
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    return () => { lenis.destroy(); window.__lenis = null }
  }, [])
  return null
}