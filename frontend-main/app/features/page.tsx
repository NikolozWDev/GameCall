import { Metadata } from "next"
import { Zap, Users, UserPlus, Shield, Trash2, Monitor } from "lucide-react"

export const metadata: Metadata = {
  title: "Features – GameCall",
  description: "Everything you need for instant, private voice rooms with your team."
}

const features = [
  {
    icon: Zap,
    title: "Instant Voice Rooms",
    desc: "Create a private room in seconds and start talking without complicated setup."
  },
  {
    icon: Users,
    title: "Easy Invites",
    desc: "Share one link with your teammates. They can open it and join your room right away."
  },
  {
    icon: UserPlus,
    title: "No Account Required to Join",
    desc: "Your friends don't need to create an account just to join a room."
  },
  {
    icon: Shield,
    title: "Simple Controls",
    desc: "Turn your microphone on or off whenever you want. Room admins can also mute or remove participants."
  },
  {
    icon: Shield,
    title: "Private Rooms",
    desc: "Rooms are created for your group and aren't designed as public chat spaces."
  },
  {
    icon: Trash2,
    title: "Automatic Room Cleanup",
    desc: "When everyone leaves, the room is automatically closed and removed."
  },
  {
    icon: Monitor,
    title: "Works on Desktop & Mobile",
    desc: "Join your room from a computer, tablet, or phone without installing a separate application."
  }
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#04070E] pt-24 pb-16">
      <div className="container mx-auto max-w-6xl px-4 md:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Voice chat without the hassle.
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            GameCall makes it easy to jump into a private voice room and start talking with your teammates.
            Create a room, share the link, and you're ready to go.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <f.icon className="h-8 w-8 text-[#0F7C9D] mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}