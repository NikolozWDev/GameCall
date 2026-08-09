import { Metadata } from "next"
import { PlusCircle, Link, UserPlus, Mic } from "lucide-react"

export const metadata: Metadata = {
  title: "How It Works – GameCall",
  description: "Create a room, share the link, start talking – all in a few seconds."
}

const steps = [
  {
    number: "01",
    icon: PlusCircle,
    title: "Create a room",
    desc: "Sign in to your GameCall account and create a new voice room."
  },
  {
    number: "02",
    icon: Link,
    title: "Share the link",
    desc: "Copy your room link and send it to your friends through Discord, game chat, Messenger, or wherever you normally talk."
  },
  {
    number: "03",
    icon: UserPlus,
    title: "Join the room",
    desc: "Your friends open the link, choose a name if they're joining as a guest, and enter the room."
  },
  {
    number: "04",
    icon: Mic,
    title: "Start talking",
    desc: "Turn on your microphone and start playing. Everyone can control their own microphone, while the room admin can manage participants."
  }
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#04070E] pt-24 pb-16">
      <div className="container mx-auto max-w-4xl px-4 md:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            From zero to voice chat in seconds.
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            No complicated setup. Just create a room, share the link, and start talking.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="text-2xl font-bold text-[#0F7C9D]">{step.number}</div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <step.icon className="h-5 w-5 text-white/80" />
                  <h3 className="text-white font-semibold">{step.title}</h3>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <a href="/?create=true" className="inline-block bg-[#0F7C9D] hover:bg-[#0E6A87] text-white font-semibold px-8 py-3 rounded-lg transition-colors">
            Create a Room
          </a>
        </div>
      </div>
    </div>
  )
}