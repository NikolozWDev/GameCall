import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service – GameCall",
  description: "The rules for using GameCall."
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#04070E] pt-24 pb-16">
      <div className="container mx-auto max-w-3xl px-4 md:px-8 prose prose-invert">
        <h1 className="text-4xl font-extrabold text-white mb-8">Terms of Service</h1>
        <p className="text-white/60 mb-6">Last updated: {new Date().getFullYear()}-01-01</p>

        <h2 className="text-white text-2xl font-semibold mt-8 mb-4">Using GameCall</h2>
        <p className="text-white/70 leading-relaxed mb-4">
          By using GameCall, you agree to use the service responsibly and follow these terms.
        </p>

        <h2 className="text-white text-2xl font-semibold mt-8 mb-4">You may not:</h2>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-4">
          <li>Use the service for any illegal activity.</li>
          <li>Harass, abuse, or harm other users.</li>
          <li>Distribute malicious content.</li>
          <li>Attempt to compromise the service's security.</li>
          <li>Use bots or automation to abuse the platform.</li>
          <li>Impersonate others or gain unauthorized access to accounts.</li>
        </ul>

        <h2 className="text-white text-2xl font-semibold mt-8 mb-4">Rooms</h2>
        <p className="text-white/70 leading-relaxed mb-4">
          Room creators are responsible for the activity in their rooms to a reasonable extent.
          GameCall reserves the right to terminate any room that violates these terms.
        </p>

        <h2 className="text-white text-2xl font-semibold mt-8 mb-4">Moderation</h2>
        <p className="text-white/70 leading-relaxed mb-4">
          We may suspend or terminate accounts that repeatedly violate our policies.
        </p>

        <h2 className="text-white text-2xl font-semibold mt-8 mb-4">Availability</h2>
        <p className="text-white/70 leading-relaxed mb-4">
          We work to keep GameCall available and reliable, but we cannot guarantee uninterrupted service.
        </p>

        <h2 className="text-white text-2xl font-semibold mt-8 mb-4">Account Termination</h2>
        <p className="text-white/70 leading-relaxed mb-4">
          We may suspend or delete accounts for violations of these terms.
        </p>

        <h2 className="text-white text-2xl font-semibold mt-8 mb-4">Changes</h2>
        <p className="text-white/70 leading-relaxed mb-4">
          We may update these terms from time to time. Continued use of GameCall after changes
          means you accept the new terms.
        </p>

        <h2 className="text-white text-2xl font-semibold mt-8 mb-4">Contact</h2>
        <p className="text-white/70 leading-relaxed">
        For questions, reach us at{" "}
        <a href="mailto:gigiashvilinikoloz@gmail.com" className="text-[#0F7C9D]">gigiashvilinikoloz@gmail.com</a>.
        </p>
      </div>
    </div>
  )
}