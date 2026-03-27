"use client"

import { useRouter } from "next/navigation"
import {ArrowRight} from "lucide-react"
export default function WelcomePage() {
    const router = useRouter()
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
                <h1 className="text-6xl font-extrabold mb-6 tracking-tight animate-fadeIn">
                Welcome to <span className="text-blue-400">Manim AI</span>
            </h1>
            <p className="text-lg text-gray-400 mb-8">
                Generate beautiful mathematical videos with 
            </p>
            <button onClick={() => router.push("/auth")}
            className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition cursor-pointer">
                Start creating <ArrowRight className="ml-2"/>
            </button>
        </main>
    )
}





