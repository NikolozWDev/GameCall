"use client"

import { useEffect, useRef, useCallback } from "react"

const PARTICLE_COUNT = 200
const MAX_CONNECTIONS = 4
const CONNECTION_DISTANCE = 180
const DAMPING = 0.95
const HOME_FORCE = 0.0005
const MAX_WANDER = 60
const GRID_CELL_SIZE = 150
const LINE_OPACITY_MAX = 0.15
const PARTICLE_OPACITY = 0.5

interface Particle {
  x: number
  y: number
  homeX: number
  homeY: number
  vx: number
  vy: number
  connections: number[]
  connectionTimer: number
}

interface GridCell {
  particles: number[]
}

function createGrid(particles: Particle[], width: number, height: number, cellSize: number): GridCell[] {
  const cols = Math.ceil(width / cellSize)
  const rows = Math.ceil(height / cellSize)
  const grid: GridCell[] = Array.from({ length: cols * rows }, () => ({ particles: [] }))

  particles.forEach((p, i) => {
    const col = Math.floor(p.x / cellSize)
    const row = Math.floor(p.y / cellSize)
    const idx = row * cols + col
    if (idx >= 0 && idx < grid.length) {
      grid[idx].particles.push(i)
    }
  })
  return grid
}

function getNeighbors(
  particleIndex: number,
  particles: Particle[],
  grid: GridCell[],
  cols: number,
  cellSize: number,
  height: number
): number[] {
  const p = particles[particleIndex]
  const col = Math.floor(p.x / cellSize)
  const row = Math.floor(p.y / cellSize)
  const neighbors: number[] = []

  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r < 0 || r >= Math.ceil(height / cellSize) || c < 0 || c >= cols) continue
      const idx = r * cols + c
      if (idx < grid.length) {
        neighbors.push(...grid[idx].particles.filter(i => i !== particleIndex))
      }
    }
  }
  return neighbors
}

export function AnimatedBackground({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameId = useRef<number>(0)
  const isVisibleRef = useRef(true)
  const timeRef = useRef(0)
  const initializedRef = useRef(false)

  const resize = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const width = container.clientWidth
    const height = container.clientHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext("2d")
    if (ctx) ctx.scale(dpr, dpr)
  }, [])

  const initParticles = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const width = container.clientWidth
    const height = container.clientHeight
    const particles: Particle[] = []

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      particles.push({
        x,
        y,
        homeX: x,
        homeY: y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        connections: [],
        connectionTimer: Math.random() * 4,
      })
    }
    particlesRef.current = particles
    initializedRef.current = true
  }, [])

  const animate = useCallback(
    (timestamp: number) => {
      if (!isVisibleRef.current) return
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const width = container.clientWidth
      const height = container.clientHeight
      const dt = Math.min(100, timestamp - (timeRef.current || timestamp)) / 16.667
      timeRef.current = timestamp

      const particles = particlesRef.current
      if (particles.length === 0) {
        if (!initializedRef.current) {
          initParticles()
        }
        animationFrameId.current = requestAnimationFrame(animate)
        return
      }

      const cols = Math.ceil(width / GRID_CELL_SIZE)
      const grid = createGrid(particles, width, height, GRID_CELL_SIZE)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

  
        const dxHome = p.homeX - p.x
        const dyHome = p.homeY - p.y
        p.vx += dxHome * HOME_FORCE
        p.vy += dyHome * HOME_FORCE

        p.vx *= DAMPING
        p.vy *= DAMPING

        const distFromHome = Math.sqrt(dxHome * dxHome + dyHome * dyHome)
        if (distFromHome > MAX_WANDER) {
          p.vx += dxHome * 0.01
          p.vy += dyHome * 0.01
        }

        p.vx += (Math.random() - 0.5) * 0.05
        p.vy += (Math.random() - 0.5) * 0.05

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        const maxSpeed = 0.8
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed
          p.vy = (p.vy / speed) * maxSpeed
        }

        p.x += p.vx * dt
        p.y += p.vy * dt
      }

      for (const p of particles) {
        p.connectionTimer -= dt * 0.016
        if (p.connectionTimer <= 0) {
          const idx = particles.indexOf(p)
          const neighbors = getNeighbors(idx, particles, grid, cols, GRID_CELL_SIZE, height)
          const candidates = neighbors
            .map(j => ({ index: j, dist: Math.hypot(particles[j].x - p.x, particles[j].y - p.y) }))
            .filter(c => c.dist < CONNECTION_DISTANCE)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, MAX_CONNECTIONS)
          p.connections = candidates.map(c => c.index)
          p.connectionTimer = 2 + Math.random() * 4
        }
      }

      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        for (const j of p.connections) {
          if (j < particles.indexOf(p)) continue
          const other = particles[j]
          const dx = other.x - p.x
          const dy = other.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const alpha = LINE_OPACITY_MAX * (1 - dist / CONNECTION_DISTANCE)
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(other.x, other.y)
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`
          ctx.lineWidth = 0.4
          ctx.stroke()
        }
      }

      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${PARTICLE_OPACITY})`
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${PARTICLE_OPACITY * 0.2})`
        ctx.fill()
      }

      animationFrameId.current = requestAnimationFrame(animate)
    },
    [initParticles]
  )

  useEffect(() => {
    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [])

  useEffect(() => {
    resize()
    initParticles()
    animationFrameId.current = requestAnimationFrame(animate)

    const handleResize = () => {
      resize()
      initParticles()
    }
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrameId.current)
    }
  }, [animate, initParticles, resize])

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#04070E] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="relative z-10 flex items-center justify-center min-h-screen">{children}</div>
    </div>
  )
}