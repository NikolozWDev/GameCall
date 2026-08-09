import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy – GameCall",
  description: "How we handle your data and protect your privacy."
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#04070E] pt-24 pb-16">
      <div className="container mx-auto max-w-3xl px-4 md:px-8 prose prose-invert">
        <h1 className="text-4xl font-extrabold text-white mb-8">Privacy Policy</h1>
        <p className="text-white/60 mb-6">Last updated: {new Date().getFullYear()}-01-01</p>

        <h2 className="text-white text-2xl font-semibold mt-8 mb-4">What Information We Collect</h2>
        <p className="text-white/70 leading-relaxed mb-4">
          When you create an account, we collect your email address and the username you choose.
          If you upload a profile picture, that's stored as well.
        </p>
        <p className="text-white/70 leading-relaxed mb-4">
          When you create or join a room, we store basic room information (name, creator, participants)
          to make the service work. We also log technical data like IP addresses and browser type for security and debugging.
        </p>

        <h2 className="text-white text-2xl font-semibold mt-8 mb-4">How We Use Your Information</h2>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-4">
          <li>To provide, maintain, and improve GameCall services.</li>
          <li>To authenticate you and manage your account.</li>
          <li>To create and manage voice rooms you're part of.</li>
          <li>To keep the platform secure and stable.</li>
        </ul>

        <h2 className="text-white text-2xl font-semibold mt-8 mb-4">Voice Data</h2>
        <p className="text-white/70 leading-relaxed mb-4">
          GameCall uses WebRTC for real-time voice communication. Voice data is transmitted
          peer-to-peer or via a secure relay server (LiveKit), but it is <strong>not stored</strong> or
          recorded by GameCall.
        </p>

        <h2 className="text-white text-2xl font-semibold mt-8 mb-4">Cookies</h2>
        <p className="text-white/70 leading-relaxed mb-4">
          We use essential cookies for authentication (JWT tokens) and to remember your
          guest session. No third-party tracking cookies are used.
        </p>

        <h2 className="text-white text-2xl font-semibold mt-8 mb-4">Data Retention</h2>
        <p className="text-white/70 leading-relaxed mb-4">
          Rooms and participant data are automatically deleted when the last person leaves
          the room. Account information is kept until you delete your account.
        </p>

        <h2 className="text-white text-2xl font-semibold mt-8 mb-4">Your Rights</h2>
        <p className="text-white/70 leading-relaxed mb-4">
          You can request a copy of your data, ask us to correct it, or delete your account
          at any time by contacting us.
        </p>

        <h2 className="text-white text-2xl font-semibold mt-8 mb-4">Contact</h2>
        <p className="text-white/70 leading-relaxed">
        For privacy-related questions, email us at{" "}
        <a href="mailto:gigiashvilinikoloz@gmail.com" className="text-[#0F7C9D]">gigiashvilinikoloz@gmail.com</a>.
        </p>
      </div>
    </div>
  )
}