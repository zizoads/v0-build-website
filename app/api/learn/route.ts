import type { NextRequest } from "next/server"
import { crawlerEngine } from "@/lib/crawler-engine"

interface LearnRequest {
  filters: any
  selectedResults: string[]
  rejectedResults: string[]
}

export async function POST(request: NextRequest) {
  try {
    const data: LearnRequest = await request.json()

    console.log("[v0] Learning from user interaction:", {
      selected: data.selectedResults.length,
      rejected: data.rejectedResults.length,
    })

    // تسجيل التفاعل في محرك الزحف
    crawlerEngine.learnFromInteraction({
      filters: data.filters,
      selectedResults: data.selectedResults,
      rejectedResults: data.rejectedResults,
      timestamp: new Date(),
    })

    if (Math.random() < 0.05) {
      await crawlerEngine.discoverNewSources()
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Learn error:", error)
    return Response.json({ error: "Failed to learn" }, { status: 500 })
  }
}
