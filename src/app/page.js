import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-5xl font-bold mb-4">SORDO</h1>
      <p className="text-gray-400 text-lg mb-10">Communication without barriers</p>

      <div className="flex gap-4">
        <Link href="/login">
          <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition">
            Login
          </button>
        </Link>
        <Link href="/signup">
          <button className="px-8 py-3 border border-white hover:bg-white hover:text-black rounded-xl font-semibold transition">
            Sign Up
          </button>
        </Link>
      </div>
    </main>
  )
}