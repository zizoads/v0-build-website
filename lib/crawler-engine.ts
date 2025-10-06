// BrandCore Intelligent Crawler Engine
// نظام الزحف الذكي - يتعلم ويتكيف مع احتياجات المستخدم

interface CrawlerSource {
  id: string
  type: "github" | "api" | "web"
  url: string
  priority: number
  successRate: number
  lastUsed: Date
  totalUses: number
}

interface UserInteraction {
  filters: any
  selectedResults: string[]
  rejectedResults: string[]
  timestamp: Date
}

interface WordResult {
  word: string
  type: string
  meaning: string
  rarity: number
  industries: string[]
  source: string
  quality: number
  availability: number // 0-100: احتمالية توفر النطاق .com
}

class CrawlerEngine {
  private sources: CrawlerSource[] = []
  private interactions: UserInteraction[] = []
  // private cache: Map<string, { data: WordResult[]; timestamp: number }> = new Map()
  // private readonly CACHE_DURATION = 1000 * 60 * 30 // 30 minutes

  private readonly BLACKLIST = new Set([
    "anus",
    "anilingus",
    "ass",
    "bastard",
    "bitch",
    "cock",
    "crap",
    "damn",
    "dick",
    "fag",
    "fuck",
    "hell",
    "piss",
    "porn",
    "sex",
    "shit",
    "slut",
    "whore",
    "kill",
    "death",
    "murder",
    "rape",
    "hate",
    "nazi",
    "slave",
    "terror",
    "weapon",
    "drug",
    "cocaine",
    "heroin",
  ])

  private readonly COMMON_PREFIXES = [
    "un",
    "re",
    "in",
    "dis",
    "en",
    "non",
    "pre",
    "pro",
    "anti",
    "de",
    "over",
    "mis",
    "sub",
    "inter",
    "fore",
    "super",
    "trans",
    "semi",
    "auto",
    "co",
    "ex",
  ]
  private readonly COMMON_SUFFIXES = [
    "ed",
    "ing",
    "ly",
    "er",
    "est",
    "tion",
    "ness",
    "ment",
    "ful",
    "less",
    "able",
    "ible",
    "ous",
    "ive",
    "al",
    "ial",
    "ic",
    "ish",
    "like",
  ]

  constructor() {
    this.initializeSources()
  }

  private initializeSources() {
    // GitHub word list repositories
    this.sources = [
      {
        id: "github-english-words",
        type: "github",
        url: "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt",
        priority: 10,
        successRate: 0.95,
        lastUsed: new Date(),
        totalUses: 0,
      },
      {
        id: "github-common-words",
        type: "github",
        url: "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt",
        priority: 9,
        successRate: 0.92,
        lastUsed: new Date(),
        totalUses: 0,
      },
      {
        id: "github-word-list",
        type: "github",
        url: "https://raw.githubusercontent.com/sindresorhus/word-list/main/words.txt",
        priority: 8,
        successRate: 0.9,
        lastUsed: new Date(),
        totalUses: 0,
      },
    ]
  }

  // الزحف إلى GitHub للحصول على قوائم الكلمات
  private async crawlGitHub(source: CrawlerSource): Promise<string[]> {
    try {
      console.log(`[v0] Crawling ${source.id}...`)
      const response = await fetch(source.url, {
        headers: {
          "User-Agent": "BrandCore-Crawler/5.0",
          Accept: "text/plain, application/json",
        },
      })

      if (!response.ok) {
        console.error(`[v0] Failed to fetch ${source.id}: ${response.status}`)
        throw new Error(`Failed to fetch from ${source.id}`)
      }

      const text = await response.text()
      const words = text
        .split(/[\n\r,\s]+/)
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length > 0 && /^[a-z]+$/.test(w))

      // تحديث معدل النجاح
      this.updateSourceSuccess(source.id, true)
      console.log(`[v0] Successfully crawled ${words.length} words from ${source.id}`)

      return words
    } catch (error) {
      console.error(`[v0] Crawler error for ${source.id}:`, error)
      this.updateSourceSuccess(source.id, false)
      return []
    }
  }

  // استخدام APIs الخارجية للحصول على معلومات الكلمات
  private async enrichWordData(word: string): Promise<Partial<WordResult> | null> {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(3000), // تضمين timeout لتجنب التعليق
      })

      if (!response.ok) {
        return this.fallbackEnrichment(word)
      }

      const data = await response.json()
      const entry = data[0]

      if (!entry) return this.fallbackEnrichment(word)

      const meanings = entry.meanings || []
      const partOfSpeech = meanings[0]?.partOfSpeech || "noun"
      const definition = meanings[0]?.definitions[0]?.definition || ""

      const sentiment = this.analyzeSentiment(definition)

      return {
        type: partOfSpeech,
        meaning: sentiment,
        quality: sentiment === "positive" ? 95 : sentiment === "neutral" ? 85 : 60,
      }
    } catch (error) {
      return this.fallbackEnrichment(word)
    }
  }

  private fallbackEnrichment(word: string): Partial<WordResult> {
    // تحليل بسيط بناءً على بنية الكلمة
    const type = this.guessWordType(word)
    return {
      type,
      meaning: "neutral",
      quality: 75,
    }
  }

  private guessWordType(word: string): string {
    if (word.endsWith("ing") || word.endsWith("ed") || word.endsWith("ize")) return "verb"
    if (word.endsWith("ly")) return "adverb"
    if (word.endsWith("ful") || word.endsWith("less") || word.endsWith("ous") || word.endsWith("ive"))
      return "adjective"
    return "noun"
  }

  // تحليل المشاعر للتأكد من المعاني الإيجابية أو المحايدة
  private analyzeSentiment(text: string): "positive" | "neutral" | "negative" {
    const positiveWords = [
      "good",
      "great",
      "excellent",
      "beautiful",
      "wonderful",
      "amazing",
      "perfect",
      "best",
      "success",
      "happy",
      "joy",
      "love",
      "bright",
      "smart",
      "strong",
      "powerful",
      "creative",
      "innovative",
    ]
    const negativeWords = [
      "bad",
      "terrible",
      "awful",
      "horrible",
      "worst",
      "fail",
      "failure",
      "sad",
      "angry",
      "hate",
      "dark",
      "weak",
      "poor",
      "sick",
      "death",
      "kill",
      "destroy",
    ]

    const lowerText = text.toLowerCase()

    const hasPositive = positiveWords.some((word) => lowerText.includes(word))
    const hasNegative = negativeWords.some((word) => lowerText.includes(word))

    if (hasNegative) return "negative"
    if (hasPositive) return "positive"
    return "neutral"
  }

  // تصنيف الكلمة حسب الصناعة
  private categorizeIndustry(word: string, definition: string): string[] {
    const industries: string[] = []
    const lowerWord = word.toLowerCase()
    const lowerDef = definition.toLowerCase()

    // Technology
    if (
      /tech|digital|cyber|data|code|soft|net|web|app|cloud|ai|smart/.test(lowerWord) ||
      /technology|computer|software|digital/.test(lowerDef)
    ) {
      industries.push("technology")
    }

    // Business
    if (
      /capital|profit|market|trade|corp|biz|pro|prime|elite|exec/.test(lowerWord) ||
      /business|commerce|financial|economic/.test(lowerDef)
    ) {
      industries.push("business")
    }

    // Creative
    if (
      /art|design|create|craft|studio|pixel|color|draw|paint/.test(lowerWord) ||
      /creative|artistic|design/.test(lowerDef)
    ) {
      industries.push("creative")
    }

    // Science
    if (
      /bio|eco|geo|astro|quantum|atom|lab|gene|neuro/.test(lowerWord) ||
      /science|scientific|natural/.test(lowerDef)
    ) {
      industries.push("science")
    }

    if (industries.length === 0) industries.push("general")

    return industries
  }

  // حساب الندرة بناءً على طول الكلمة وتكرارها
  private calculateRarity(word: string, frequency = 0): number {
    const length = word.length

    // الكلمات القصيرة نادرة أكثر
    if (length <= 4) return 9
    if (length === 5) return 7
    if (length === 6) return 5
    if (length === 7) return 4
    if (length === 8) return 3
    return 2
  }

  // التعلم من تفاعلات المستخدم
  public learnFromInteraction(interaction: UserInteraction) {
    this.interactions.push(interaction)

    // تحليل الأنماط في اختيارات المستخدم
    const patterns = this.analyzeUserPatterns()

    // تحديث أولويات المصادر بناءً على النجاح
    this.adjustSourcePriorities(patterns)
  }

  private analyzeUserPatterns(): any {
    if (this.interactions.length === 0) return {}

    const recentInteractions = this.interactions.slice(-10)

    // تحليل الأنماط المفضلة
    const preferredLengths: number[] = []
    const preferredTypes: string[] = []
    const preferredIndustries: string[] = []

    recentInteractions.forEach((interaction) => {
      interaction.selectedResults.forEach((result) => {
        preferredLengths.push(result.length)
        // يمكن إضافة المزيد من التحليل هنا
      })
    })

    return {
      avgLength: preferredLengths.reduce((a, b) => a + b, 0) / preferredLengths.length || 6,
      preferredTypes,
      preferredIndustries,
    }
  }

  private adjustSourcePriorities(patterns: any) {
    // تعديل أولويات المصادر بناءً على الأنماط المكتشفة
    this.sources.forEach((source) => {
      if (source.successRate > 0.9) {
        source.priority = Math.min(10, source.priority + 0.1)
      } else if (source.successRate < 0.5) {
        source.priority = Math.max(1, source.priority - 0.2)
      }
    })

    // إعادة ترتيب المصادر حسب الأولوية
    this.sources.sort((a, b) => b.priority - a.priority)
  }

  private updateSourceSuccess(sourceId: string, success: boolean) {
    const source = this.sources.find((s) => s.id === sourceId)
    if (!source) return

    source.totalUses++
    source.lastUsed = new Date()

    // تحديث معدل النجاح باستخدام المتوسط المتحرك
    const weight = 0.2 // وزن التحديث الجديد
    source.successRate = source.successRate * (1 - weight) + (success ? 1 : 0) * weight
  }

  // البحث الذكي عن الكلمات
  public async intelligentSearch(filters: {
    mode: "fast" | "advanced"
    industries: string[]
    lengthRange: [number, number]
    rarityRange: [number, number]
    wordTypes?: string[]
    startingLetters?: string[]
    brandabilityMin?: number
    qualityThreshold?: number
    enableWebCrawling?: boolean
  }): Promise<WordResult[]> {
    console.log("[v0] Starting fresh intelligent crawl with config:", filters)

    const results: WordResult[] = []
    const [minLength, maxLength] = filters.lengthRange
    const [minRarity, maxRarity] = filters.rarityRange

    const isDefaultSearch =
      (!filters.wordTypes || filters.wordTypes.length === 0 || filters.wordTypes.includes("any")) &&
      (!filters.startingLetters || filters.startingLetters.length === 0)

    const sourcesToUse =
      filters.mode === "fast"
        ? this.sources.slice(0, 2).sort((a, b) => b.priority - a.priority)
        : this.sources.sort((a, b) => b.priority - a.priority)

    console.log(`[v0] Using ${sourcesToUse.length} sources for ${filters.mode} mode`)

    let successfulSources = 0

    for (const source of sourcesToUse) {
      try {
        const words = await this.crawlGitHub(source)

        if (words.length === 0) {
          console.log(`[v0] Source ${source.id} returned no words, trying next source`)
          continue
        }

        successfulSources++

        let filteredWords = words.filter(
          (word) =>
            word.length >= minLength &&
            word.length <= maxLength &&
            /^[a-z]+$/.test(word) &&
            this.isValidBrandWord(word),
        )

        if (isDefaultSearch) {
          filteredWords = this.ensureDiverseStartingLetters(filteredWords)
        } else if (filters.startingLetters && filters.startingLetters.length > 0) {
          filteredWords = filteredWords.filter((word) => filters.startingLetters!.includes(word[0].toLowerCase()))
        }

        console.log(`[v0] Filtered to ${filteredWords.length} valid brand words from ${source.id}`)

        const sampleSize = filters.mode === "fast" ? 150 : 400
        const randomSeed = Date.now() + Math.random()
        console.log(`[v0] Using random seed: ${randomSeed} for unique results`)
        const sample = this.selectRandomSample(filteredWords, sampleSize, randomSeed)

        const processedWords = await this.processWordsWithDiversity(sample, filters, isDefaultSearch, results.length)

        for (const wordData of processedWords) {
          const { word, enrichedData, rarity, brandability, availability, industries, quality } = wordData

          // التحقق من الفلاتر
          if (filters.brandabilityMin && brandability < filters.brandabilityMin) continue
          if (rarity < minRarity || rarity > maxRarity) continue
          if (availability < 92) continue
          if (filters.qualityThreshold && quality < filters.qualityThreshold) continue

          // فلترة الصناعات
          if (filters.industries.length > 0 && !filters.industries.includes("general")) {
            const hasMatchingIndustry = industries.some((ind) =>
              filters.industries.some((filterInd) => {
                const filterKey = filterInd.toLowerCase().split("/")[0].trim()
                return ind.includes(filterKey)
              }),
            )
            if (!hasMatchingIndustry && !industries.includes("general")) continue
          }

          if (!isDefaultSearch && filters.wordTypes && filters.wordTypes.length > 0) {
            const hasAny = filters.wordTypes.includes("any")
            if (!hasAny && !filters.wordTypes.includes(enrichedData?.type || "noun")) continue
          }

          results.push({
            word,
            type: enrichedData?.type || "noun",
            meaning: enrichedData?.meaning || "neutral",
            rarity,
            industries,
            source: source.id,
            quality,
            availability,
          })

          const targetCount = filters.mode === "fast" ? 25 : 50
          if (results.length >= targetCount) break
        }

        if (results.length >= (filters.mode === "fast" ? 25 : 50)) break
      } catch (error) {
        console.error(`[v0] Error processing source ${source.id}:`, error)
        continue
      }
    }

    if (results.length < 10 && successfulSources < sourcesToUse.length) {
      console.log("[v0] Insufficient results, attempting to discover new sources...")
      await this.discoverNewSources()

      const newSources = this.sources.filter((s) => !sourcesToUse.find((us) => us.id === s.id))
      if (newSources.length > 0) {
        console.log(`[v0] Found ${newSources.length} new sources, retrying...`)

        for (const source of newSources.slice(0, 2)) {
          try {
            const words = await this.crawlGitHub(source)
            if (words.length === 0) continue

            let filteredWords = words.filter(
              (word) =>
                word.length >= minLength &&
                word.length <= maxLength &&
                /^[a-z]+$/.test(word) &&
                this.isValidBrandWord(word),
            )

            if (isDefaultSearch) {
              filteredWords = this.ensureDiverseStartingLetters(filteredWords)
            } else if (filters.startingLetters && filters.startingLetters.length > 0) {
              filteredWords = filteredWords.filter((word) => filters.startingLetters!.includes(word[0].toLowerCase()))
            }

            const sample = this.selectRandomSample(filteredWords, 50)

            const processedWords = await this.processWordsWithDiversity(
              sample,
              filters,
              isDefaultSearch,
              results.length,
            )

            for (const wordData of processedWords) {
              const { word, enrichedData, rarity, brandability, availability, industries, quality } = wordData

              if (filters.brandabilityMin && brandability < filters.brandabilityMin) continue
              if (rarity < minRarity || rarity > maxRarity) continue
              if (availability < 92) continue
              if (filters.qualityThreshold && quality < filters.qualityThreshold) continue

              if (filters.industries.length > 0 && !filters.industries.includes("general")) {
                const hasMatchingIndustry = industries.some((ind) =>
                  filters.industries.some((filterInd) => {
                    const filterKey = filterInd.toLowerCase().split("/")[0].trim()
                    return ind.includes(filterKey)
                  }),
                )
                if (!hasMatchingIndustry && !industries.includes("general")) continue
              }

              if (!isDefaultSearch && filters.wordTypes && filters.wordTypes.length > 0) {
                const hasAny = filters.wordTypes.includes("any")
                if (!hasAny && !filters.wordTypes.includes(enrichedData?.type || "noun")) continue
              }

              results.push({
                word,
                type: enrichedData?.type || "noun",
                meaning: enrichedData?.meaning || "neutral",
                rarity,
                industries,
                source: source.id,
                quality,
                availability,
              })

              if (results.length >= 15) break
            }
          } catch (error) {
            console.error(`[v0] Error with new source ${source.id}:`, error)
            continue
          }
        }
      }
    }

    if (isDefaultSearch) {
      results.sort((a, b) => {
        const brandA = this.calculateBrandability(a.word)
        const brandB = this.calculateBrandability(b.word)

        const sentimentBonusA = a.meaning === "positive" ? 10 : a.meaning === "neutral" ? 5 : 0
        const sentimentBonusB = b.meaning === "positive" ? 10 : b.meaning === "neutral" ? 5 : 0

        const typeDiversityBonus = this.calculateTypeDiversityBonus(a.type, results)

        const scoreA = a.availability * 0.4 + a.quality * 0.3 + brandA * 0.2 + sentimentBonusA
        const scoreB = b.availability * 0.4 + b.quality * 0.3 + brandB * 0.2 + sentimentBonusB

        const randomFactorA = (Math.random() - 0.5) * 15
        const randomFactorB = (Math.random() - 0.5) * 15

        return scoreB + randomFactorB - (scoreA + randomFactorA + typeDiversityBonus)
      })
    } else {
      results.sort((a, b) => {
        const brandA = this.calculateBrandability(a.word)
        const brandB = this.calculateBrandability(b.word)

        const sentimentBonusA = a.meaning === "positive" ? 10 : a.meaning === "neutral" ? 5 : 0
        const sentimentBonusB = b.meaning === "positive" ? 10 : b.meaning === "neutral" ? 5 : 0

        const scoreA = a.availability * 0.4 + a.quality * 0.3 + brandA * 0.2 + sentimentBonusA
        const scoreB = b.availability * 0.4 + b.quality * 0.3 + brandB * 0.2 + sentimentBonusB

        const randomFactorA = (Math.random() - 0.5) * 5
        const randomFactorB = (Math.random() - 0.5) * 5

        return scoreB + randomFactorB - (scoreA + randomFactorA)
      })
    }

    console.log(`[v0] Fresh crawl complete: ${results.length} unique brand words found`)

    return results
  }

  private ensureDiverseStartingLetters(words: string[]): string[] {
    // تجميع الكلمات حسب الحرف الأول
    const wordsByLetter = new Map<string, string[]>()

    for (const word of words) {
      const firstLetter = word[0].toLowerCase()
      if (!wordsByLetter.has(firstLetter)) {
        wordsByLetter.set(firstLetter, [])
      }
      wordsByLetter.get(firstLetter)!.push(word)
    }

    // اختيار كلمات متنوعة من كل حرف
    const diverseWords: string[] = []
    const letters = Array.from(wordsByLetter.keys()).sort(() => Math.random() - 0.5)

    // نأخذ عدد متساوي من كل حرف
    const wordsPerLetter = Math.ceil(words.length / Math.min(letters.length, 20))

    for (const letter of letters) {
      const letterWords = wordsByLetter.get(letter)!
      const shuffled = letterWords.sort(() => Math.random() - 0.5)
      diverseWords.push(...shuffled.slice(0, wordsPerLetter))
    }

    return diverseWords
  }

  private async processWordsWithDiversity(
    words: string[],
    filters: any,
    isDefaultSearch: boolean,
    currentResultCount: number,
  ): Promise<any[]> {
    const processed: any[] = []

    const targetTypeCounts = isDefaultSearch
      ? {
          noun: Math.ceil(words.length * 0.4), // 40% أسماء
          verb: Math.ceil(words.length * 0.25), // 25% أفعال
          adjective: Math.ceil(words.length * 0.25), // 25% صفات
          adverb: Math.ceil(words.length * 0.1), // 10% ظروف
        }
      : null

    const typeCounts = { noun: 0, verb: 0, adjective: 0, adverb: 0 }

    for (const word of words) {
      const brandability = this.calculateBrandability(word)

      let enrichedData: Partial<WordResult> | null = null

      if (filters.mode === "advanced" && filters.enableWebCrawling && processed.length < 20) {
        enrichedData = await this.enrichWordData(word)
        if (enrichedData?.meaning === "negative") continue
      } else {
        enrichedData = this.fallbackEnrichment(word)
      }

      if (enrichedData?.meaning === "negative") continue

      const wordType = enrichedData?.type || "noun"

      if (isDefaultSearch && targetTypeCounts) {
        const currentTypeCount = typeCounts[wordType as keyof typeof typeCounts] || 0
        const targetCount = targetTypeCounts[wordType as keyof typeof targetTypeCounts] || 0

        // إذا وصلنا للحد المطلوب من هذا النوع، نتخطاه
        if (currentTypeCount >= targetCount) continue

        typeCounts[wordType as keyof typeof typeCounts]++
      }

      const rarity = this.calculateRarity(word)
      const availability = this.calculateDomainAvailability(word, rarity)
      const industries = this.categorizeIndustry(word, enrichedData?.meaning || "")
      const quality = enrichedData?.quality || this.calculateQuality(word, rarity, brandability)

      processed.push({
        word,
        enrichedData,
        rarity,
        brandability,
        availability,
        industries,
        quality,
      })

      if (processed.length >= words.length * 0.3) break
    }

    return processed
  }

  private calculateTypeDiversityBonus(type: string, existingResults: WordResult[]): number {
    const typeCounts = existingResults.reduce(
      (acc, result) => {
        acc[result.type] = (acc[result.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const currentTypeCount = typeCounts[type] || 0
    const totalCount = existingResults.length

    // إذا كان هذا النوع قليل التمثيل، نعطيه مكافأة
    if (totalCount === 0) return 0

    const typeRatio = currentTypeCount / totalCount

    // إذا كان النوع أقل من 20% من النتائج، نعطيه مكافأة
    if (typeRatio < 0.2) return 10
    if (typeRatio < 0.3) return 5

    return 0
  }

  // اكتشاف مصادر جديدة تلقائياً
  public async discoverNewSources() {
    console.log("[v0] Discovering new sources...")

    const potentialSources = [
      {
        url: "https://raw.githubusercontent.com/sindresorhus/word-list/main/words.txt",
        id: "sindresorhus-words",
      },
      {
        url: "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt",
        id: "dwyl-english",
      },
      {
        url: "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt",
        id: "google-10k",
      },
    ]

    for (const potentialSource of potentialSources) {
      const exists = this.sources.some((s) => s.url === potentialSource.url || s.id === potentialSource.id)
      if (!exists) {
        try {
          console.log(`[v0] Testing new source: ${potentialSource.url}`)
          const response = await fetch(potentialSource.url, {
            headers: {
              "User-Agent": "BrandCore-Crawler/5.0",
            },
            signal: AbortSignal.timeout(5000),
          })

          if (response.ok) {
            const text = await response.text()
            const wordCount = text.split(/[\n\r]+/).length

            if (wordCount > 100) {
              this.sources.push({
                id: potentialSource.id,
                type: "github",
                url: potentialSource.url,
                priority: 6,
                successRate: 0.7,
                lastUsed: new Date(),
                totalUses: 0,
              })
              console.log(`[v0] ✓ New source added: ${potentialSource.id} (${wordCount} words)`)
            }
          }
        } catch (error) {
          console.log(`[v0] ✗ Source test failed: ${potentialSource.url}`)
        }
      }
    }

    console.log(`[v0] Total sources available: ${this.sources.length}`)
  }

  private isValidBrandWord(word: string): boolean {
    // تصفية الكلمات غير المناسبة
    if (this.BLACKLIST.has(word.toLowerCase())) return false

    // تصفية الكلمات التي تحتوي على أجزاء من الكلمات غير المناسبة
    for (const badWord of this.BLACKLIST) {
      if (word.includes(badWord)) return false
    }

    // يجب أن تحتوي الكلمة على حرف صوتي واحد على الأقل
    if (!/[aeiou]/i.test(word)) return false

    // تصفية الاختصارات (كلمات قصيرة جداً بدون حروف صوتية كافية)
    if (word.length <= 4) {
      const vowelCount = (word.match(/[aeiou]/gi) || []).length
      if (vowelCount < 1) return false
    }

    // تصفية الكلمات التي تحتوي على أحرف متكررة كثيرة (مثل: aaaa، bbbb)
    if (/(.)\1{2,}/.test(word)) return false

    // تصفية الكلمات التي تبدأ أو تنتهي بأحرف غير شائعة
    const firstChar = word[0]
    const lastChar = word[word.length - 1]
    if (/[qxz]/.test(firstChar) && word.length < 6) return false

    return true
  }

  private calculateDomainAvailability(word: string, rarity: number): number {
    let availability = 50 // نبدأ من 50%

    // الكلمات النادرة لها احتمالية توفر أعلى
    availability += rarity * 4 // الندرة من 1-10، تضيف حتى 40%

    // الكلمات الطويلة (7+ أحرف) لها احتمالية توفر أعلى
    if (word.length >= 7) availability += 15
    else if (word.length === 6) availability += 10
    else if (word.length === 5) availability += 5
    else if (word.length === 4) availability -= 5 // الكلمات القصيرة جداً غالباً محجوزة

    // الكلمات ذات الأحرف الفريدة لها احتمالية توفر أعلى
    const uniqueChars = new Set(word).size
    const uniqueRatio = uniqueChars / word.length
    if (uniqueRatio > 0.85) availability += 10
    else if (uniqueRatio > 0.7) availability += 5

    // الكلمات التي تحتوي على أحرف غير شائعة (q, x, z) لها احتمالية توفر أعلى
    if (/[qxz]/i.test(word)) availability += 8

    // الكلمات التي تحتوي على أنماط غير شائعة
    if (/[aeiou]{2,}/i.test(word)) availability += 5 // حروف صوتية متتالية

    // عقوبة للكلمات الشائعة جداً (كلمات قصيرة بأحرف شائعة)
    if (word.length <= 5 && !/[qxzjkv]/i.test(word)) availability -= 10

    // التأكد من أن النتيجة بين 0-100
    availability = Math.max(0, Math.min(100, availability))

    // نستهدف نطاق 95-100% للكلمات عالية الجودة
    // نضيف مكافأة للكلمات التي تجاوزت 85%
    if (availability >= 85) {
      availability = 85 + (availability - 85) * 2 // تضخيم النطاق العالي
      availability = Math.min(100, availability)
    }

    return Math.round(availability)
  }

  private calculateBrandability(word: string): number {
    let score = 50 // نبدأ من 50

    // الطول المثالي للبراند (5-7 أحرف)
    if (word.length >= 5 && word.length <= 7) score += 20
    else if (word.length === 4 || word.length === 8) score += 10
    else if (word.length === 9) score += 5
    else if (word.length < 4)
      score -= 15 // قصير جداً
    else if (word.length > 9) score -= 10 // طويل جداً

    // سهولة النطق (نسبة الحروف الصوتية)
    const vowelCount = (word.match(/[aeiou]/gi) || []).length
    const vowelRatio = vowelCount / word.length
    if (vowelRatio >= 0.3 && vowelRatio <= 0.5)
      score += 15 // نسبة مثالية
    else if (vowelRatio < 0.2)
      score -= 10 // صعب النطق
    else if (vowelRatio > 0.6) score -= 5 // كثير من الحروف الصوتية

    // التفرد (أحرف فريدة)
    const uniqueChars = new Set(word).size
    const uniqueRatio = uniqueChars / word.length
    if (uniqueRatio > 0.8) score += 15
    else if (uniqueRatio > 0.6) score += 10
    else if (uniqueRatio < 0.5) score -= 5

    // سهولة التذكر (تجنب الأنماط المعقدة)
    if (!/[qxz]{2,}|[bcdfghjklmnpqrstvwxyz]{4,}/i.test(word)) score += 10

    // مكافأة للكلمات التي تبدأ بأحرف قوية
    if (/^[a-z]/i.test(word[0])) score += 5

    // مكافأة للكلمات التي تنتهي بأحرف قوية
    if (/[a-z]$/i.test(word[word.length - 1])) score += 5

    // عقوبة للأنماط المتكررة
    if (/(.)\1{2,}/.test(word)) score -= 15

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  private calculateQuality(word: string, rarity: number, brandability: number): number {
    // الجودة = مزيج من الندرة والبراندابيليتي والطول
    let quality = 0

    // الندرة تساهم بـ 30%
    quality += (rarity / 10) * 30

    // البراندابيليتي تساهم بـ 40%
    quality += (brandability / 100) * 40

    // الطول المثالي يساهم بـ 20%
    if (word.length >= 5 && word.length <= 7) quality += 20
    else if (word.length === 4 || word.length === 8) quality += 15
    else if (word.length === 9) quality += 10
    else quality += 5

    // سهولة النطق تساهم بـ 10%
    const vowelCount = (word.match(/[aeiou]/gi) || []).length
    const vowelRatio = vowelCount / word.length
    if (vowelRatio >= 0.3 && vowelRatio <= 0.5) quality += 10
    else if (vowelRatio >= 0.2 && vowelRatio <= 0.6) quality += 5

    return Math.max(0, Math.min(100, Math.round(quality)))
  }

  private selectRandomSample<T>(array: T[], size: number, seed?: number): T[] {
    // استخدام seed للحصول على عشوائية مختلفة في كل مرة
    const shuffled = [...array].sort(() => {
      const random = seed ? Math.sin(seed++) * 10000 : Math.random()
      return (random % 1) - 0.5
    })
    return shuffled.slice(0, size)
  }
}

// تصدير نسخة واحدة من المحرك (Singleton)
export const crawlerEngine = new CrawlerEngine()
