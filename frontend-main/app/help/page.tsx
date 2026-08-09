import { Metadata } from "next"
import Link from "next/link"
import { UserPlus, Mic, DoorOpen, User } from "lucide-react"

export const metadata: Metadata = {
  title: "Help Center – GameCall",
  description: "Find quick answers to common questions about using GameCall."
}

const categories = [
  {
    title: "Getting Started",
    icon: UserPlus,
    articles: [
      { title: "Creating a room", href: "/help/creating-a-room" },
      { title: "Joining a room", href: "/help/joining-a-room" },
      { title: "Inviting friends", href: "/help/inviting-friends" },
      { title: "Joining as a guest", href: "/help/guest-access" }
    ]
  },
  {
    title: "Voice & Microphone",
    icon: Mic,
    articles: [
      { title: "Allowing microphone access", href: "/help/mic-permissions" },
      { title: "Turning your microphone on/off", href: "/help/mic-toggle" },
      { title: "Microphone not working", href: "/help/mic-troubleshooting" },
      { title: "Connection problems", href: "/help/connection-issues" }
    ]
  },
  {
    title: "Rooms",
    icon: DoorOpen,
    articles: [
      { title: "Room links", href: "/help/room-links" },
      { title: "Leaving a room", href: "/help/leaving-a-room" },
      { title: "Room automatically closing", href: "/help/room-cleanup" },
      { title: "Admin controls", href: "/help/admin-controls" }
    ]
  },
  {
    title: "Account",
    icon: User,
    articles: [
      { title: "Creating an account", href: "/help/register" },
      { title: "Logging in", href: "/help/login" },
      { title: "Updating your profile", href: "/help/profile" },
      { title: "Account settings", href: "/help/account-settings" }
    ]
  }
]

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-[#04070E] pt-24 pb-16">
      <div className="container mx-auto max-w-5xl px-4 md:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            How can we help?
          </h1>
          <p className="text-white/60 text-lg">Find quick answers to common questions about using GameCall.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {categories.map((cat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <cat.icon className="h-6 w-6 text-[#0F7C9D]" />
                <h2 className="text-white font-semibold text-lg">{cat.title}</h2>
              </div>
              <ul className="space-y-2">
                {cat.articles.map((article, j) => (
                  <li key={j}>
                    <Link href={article.href} className="text-white/60 hover:text-[#0F7C9D] text-sm transition-colors">
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}