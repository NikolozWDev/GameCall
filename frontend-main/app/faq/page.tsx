import { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQ – GameCall",
  description: "Quick answers to common questions about using GameCall."
}

const faqs = [
  {
    q: "Do I need an account to join a room?",
    a: "No. You only need an account if you want to create a room. You can join someone else's room as a guest by entering your name."
  },
  {
    q: "Do I need an account to create a room?",
    a: "Yes. Room creation is available to registered users."
  },
  {
    q: "How do I invite someone?",
    a: "Create a room, copy the room link, and send it to your friend. They can open the link and join directly."
  },
  {
    q: "Can guests join a room?",
    a: "Yes. Guests can join existing rooms without creating an account."
  },
  {
    q: "Can I turn my microphone off?",
    a: "Yes. You can turn your microphone on or off at any time while you're in a room."
  },
  {
    q: "Can the room admin mute me?",
    a: "Yes. The room admin can mute individual participants or remove them from the room."
  },
  {
    q: "What happens when everyone leaves?",
    a: "When the last person leaves the room, the room is automatically closed and removed."
  },
  {
    q: "Can I join from my phone?",
    a: "Yes. GameCall is designed to work on both desktop and mobile devices."
  },
  {
    q: "Why can't I access a room?",
    a: "The room may have been closed, deleted, or the link may no longer be valid. Try asking the room owner for a new link."
  },
  {
    q: "Why can't I use my microphone?",
    a: "Your browser may not have permission to access your microphone. Check your browser's microphone permissions and make sure the correct microphone is selected."
  }
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#04070E] pt-24 pb-16">
      <div className="container mx-auto max-w-3xl px-4 md:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-white/60 text-lg">Quick answers about using GameCall.</p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}