import type { NextRequest } from "next/server"
import { crawlerEngine } from "@/lib/crawler-engine"

interface GenerationConfig {
  mode: "fast" | "advanced"
  industries: string[]
  lengthRange: [number, number]
  rarityRange: [number, number]
  wordTypes?: string[]
  brandabilityScore?: number
  startingLetters?: string[]
  qualityThreshold?: number
  semanticDepth?: "low" | "medium" | "high"
  phoneticPreferences?: string[]
  patternType?: "any" | "vowel-heavy" | "consonant-heavy" | "balanced"
  domainExtensions?: string[]
  enableWebCrawling?: boolean
}

interface DomainResult {
  name: string
  available: boolean
  score: number
  category: string
  brandability?: number
  wordType?: string
  availability?: number // إضافة نسبة التوفر من محرك الزحف
}

function getCategoryForIndustry(industries: string[]): string {
  if (industries.includes("technology")) return "Technology"
  if (industries.includes("business")) return "Business"
  if (industries.includes("creative")) return "Creative"
  if (industries.includes("science")) return "Science"
  return "General"
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const config: GenerationConfig = await request.json()

        console.log("[v0] Starting intelligent crawl with config:", {
          mode: config.mode,
          industries: config.industries,
          lengthRange: config.lengthRange,
          rarityRange: config.rarityRange,
          wordTypes: config.wordTypes,
          startingLetters: config.startingLetters,
          brandabilityScore: config.brandabilityScore,
          enableWebCrawling: config.enableWebCrawling,
        })

        let crawlResults
        try {
          crawlResults = await crawlerEngine.intelligentSearch({
            mode: config.mode,
            industries: config.industries,
            lengthRange: config.lengthRange,
            rarityRange: config.rarityRange,
            wordTypes: config.wordTypes,
            startingLetters: config.startingLetters,
            brandabilityMin: config.brandabilityScore,
            qualityThreshold: config.qualityThreshold,
            enableWebCrawling: config.enableWebCrawling || config.mode === "advanced",
          })
        } catch (crawlError) {
          console.error("[v0] Crawl error:", crawlError)
          const errorData = `data: ${JSON.stringify({
            done: true,
            error: "Failed to crawl sources. Please try again.",
          })}\n\n`
          controller.enqueue(encoder.encode(errorData))
          controller.close()
          return
        }

        console.log(`[v0] Crawler returned ${crawlResults.length} results`)

        if (crawlResults.length === 0) {
          console.log("[v0] No results found with current filters")
          const noResultsData = `data: ${JSON.stringify({
            done: true,
            message: "No results found. Try adjusting your filters or using a different mode.",
          })}\n\n`
          controller.enqueue(encoder.encode(noResultsData))
          controller.close()
          return
        }

        const delayPerResult = config.mode === "fast" ? 150 : 250

        for (const wordResult of crawlResults) {
          const result: DomainResult = {
            name: wordResult.word,
            available: wordResult.availability >= 95,
            score: wordResult.quality,
            category: getCategoryForIndustry(wordResult.industries),
            brandability: Math.round(wordResult.quality * 0.95),
            wordType: wordResult.type,
            availability: wordResult.availability,
          }

          const data = `data: ${JSON.stringify({ result })}\n\n`
          controller.enqueue(encoder.encode(data))

          console.log(
            `[v0] Streamed result: ${result.name} (Quality: ${result.score}%, Availability: ${result.availability}%)`,
          )

          await new Promise((resolve) => setTimeout(resolve, delayPerResult))
        }

        const doneData = `data: ${JSON.stringify({ done: true })}\n\n`
        controller.enqueue(encoder.encode(doneData))

        console.log("[v0] Stream completed successfully")
        controller.close()
      } catch (error) {
        console.error("[v0] Stream error:", error)
        const errorData = `data: ${JSON.stringify({
          done: true,
          error: "An unexpected error occurred. Please try again.",
        })}\n\n`
        controller.enqueue(encoder.encode(errorData))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
