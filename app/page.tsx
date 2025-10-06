"use client"

import { useState, useEffect } from "react"
import {
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  Globe,
  Copy,
  Check,
  Download,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type GenerationMode = "fast" | "advanced"
type SemanticDepth = "low" | "medium" | "high"
type PatternType = "any" | "vowel-heavy" | "consonant-heavy" | "balanced"
type WordType = "noun" | "verb" | "adjective" | "adverb" | "any"

interface GenerationConfig {
  mode: GenerationMode
  industries: string[]
  lengthRange: [number, number]
  rarityRange: [number, number]
  wordTypes?: WordType[]
  brandabilityScore?: number
  startingLetters?: string[]
  qualityThreshold?: number
  semanticDepth?: SemanticDepth
  phoneticPreferences?: string[]
  patternType?: PatternType
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
  availability?: number // إضافة نسبة التوفر
  realCheck?: boolean // لإضافة خاصية التحقق الفعلي
}

export default function HomePage() {
  const [mode, setMode] = useState<GenerationMode>("fast")
  const [industries, setIndustries] = useState<string[]>(["general"])
  const [lengthRange, setLengthRange] = useState<[number, number]>([4, 9])
  const [rarityRange, setRarityRange] = useState<[number, number]>([1, 10])
  const [wordTypes, setWordTypes] = useState<WordType[]>(["any"])
  const [brandabilityScore, setBrandabilityScore] = useState(70)
  const [startingLetters, setStartingLetters] = useState<string[]>([])
  const [startingLetterInput, setStartingLetterInput] = useState("")
  const [qualityThreshold, setQualityThreshold] = useState(85)
  const [semanticDepth, setSemanticDepth] = useState<SemanticDepth>("medium")
  const [phoneticPreferences, setPhoneticPreferences] = useState<string[]>(["pronounceable"])
  const [patternType, setPatternType] = useState<PatternType>("any")
  const [domainExtensions, setDomainExtensions] = useState<string[]>([".com"])
  const [enableWebCrawling, setEnableWebCrawling] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<DomainResult[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [selectedResults, setSelectedResults] = useState<string[]>([])
  const [currentFilters, setCurrentFilters] = useState<GenerationConfig | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [stats, setStats] = useState({ totalCrawled: 0, sourcesUsed: 0, avgQuality: 0 })

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        if (!isGenerating) handleGenerate()
      }
      if (e.key === "Escape" && isGenerating) {
        setIsGenerating(false)
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isGenerating])

  const industryOptions = [
    { id: "general", label: "General English" },
    { id: "technology", label: "Technology / Computing" },
    { id: "business", label: "Business / Finance" },
    { id: "creative", label: "Creative / Design" },
    { id: "science", label: "Science / Nature" },
  ]

  const wordTypeOptions = [
    { id: "any" as WordType, label: "Any Type" },
    { id: "noun" as WordType, label: "Noun" },
    { id: "verb" as WordType, label: "Verb" },
    { id: "adjective" as WordType, label: "Adjective" },
    { id: "adverb" as WordType, label: "Adverb" },
  ]

  const phoneticOptions = [
    { id: "pronounceable", label: "Easy to pronounce" },
    { id: "memorable", label: "Memorable sounds" },
    { id: "short-syllables", label: "Short syllables" },
    { id: "no-repetition", label: "No letter repetition" },
  ]

  const extensionOptions = [
    { id: ".com", label: ".com" },
    { id: ".io", label: ".io" },
    { id: ".ai", label: ".ai" },
    { id: ".co", label: ".co" },
    { id: ".app", label: ".app" },
  ]

  const toggleIndustry = (industryId: string) => {
    setIndustries((prev) =>
      prev.includes(industryId) ? prev.filter((id) => id !== industryId) : [...prev, industryId],
    )
  }

  const toggleWordType = (typeId: WordType) => {
    setWordTypes((prev) => {
      if (typeId === "any") {
        return ["any"]
      }
      const filtered = prev.filter((t) => t !== "any")
      if (filtered.includes(typeId)) {
        const newTypes = filtered.filter((t) => t !== typeId)
        return newTypes.length === 0 ? ["any"] : newTypes
      }
      return [...filtered, typeId]
    })
  }

  const togglePhoneticPreference = (prefId: string) => {
    setPhoneticPreferences((prev) => (prev.includes(prefId) ? prev.filter((id) => id !== prefId) : [...prev, prefId]))
  }

  const toggleDomainExtension = (extId: string) => {
    setDomainExtensions((prev) => (prev.includes(extId) ? prev.filter((id) => id !== extId) : [...prev, extId]))
  }

  const handleAddStartingLetter = () => {
    const letter = startingLetterInput.trim().toLowerCase()
    if (letter && letter.length === 1 && /[a-z]/.test(letter) && !startingLetters.includes(letter)) {
      setStartingLetters([...startingLetters, letter])
      setStartingLetterInput("")
    }
  }

  const removeStartingLetter = (letter: string) => {
    setStartingLetters(startingLetters.filter((l) => l !== letter))
  }

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)

      // تسجيل الاختيار للتعلم
      if (!selectedResults.includes(text)) {
        setSelectedResults((prev) => [...prev, text])
      }

      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error("[v0] Copy failed:", error)
    }
  }

  const [copiedAll, setCopiedAll] = useState(false)

  const handleCopyAll = async () => {
    try {
      const allDomains = results.map((r) => `${r.name}.com`).join("\n")
      await navigator.clipboard.writeText(allDomains)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    } catch (error) {
      console.error("[v0] Copy all failed:", error)
    }
  }

  const openNamecheap = (domain: string) => {
    const url = `https://www.namecheap.com/domains/registration/results/?domain=${domain}.com`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const [checkingAvailability, setCheckingAvailability] = useState<Set<number>>(new Set())

  const checkDomainAvailability = async (domain: string, index: number) => {
    setCheckingAvailability((prev) => new Set(prev).add(index))

    try {
      const response = await fetch("/api/check-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: `${domain}.com` }),
      })

      const data = await response.json()

      // تحديث النتيجة بحالة التوفر الحقيقية
      setResults((prev) => prev.map((r, i) => (i === index ? { ...r, available: data.available, realCheck: true } : r)))
    } catch (error) {
      console.error("[v0] Domain check failed:", error)
    } finally {
      setCheckingAvailability((prev) => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
  }

  const sendLearningData = async () => {
    if (!currentFilters || selectedResults.length === 0) return

    try {
      console.log("[v0] Sending learning data...")
      await fetch("/api/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: currentFilters,
          selectedResults,
          rejectedResults: results.map((r) => r.name).filter((name) => !selectedResults.includes(name)),
        }),
      })
      console.log("[v0] Learning data sent successfully")
    } catch (error) {
      console.error("[v0] Failed to send learning data:", error)
    }
  }

  const handleExport = () => {
    const csv = [
      ["Domain", "Available", "Quality Score", "Brandability", "Category", "Word Type", "Availability %"],
      ...results.map((r) => [
        r.name,
        r.available ? "Yes" : "No",
        r.score,
        r.brandability || "-",
        r.category,
        r.wordType || "-",
        r.availability || "-",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `brandcore-domains-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleGenerate = async () => {
    setErrorMessage(null)

    if (selectedResults.length > 0) {
      await sendLearningData()
      setSelectedResults([])
    }

    setIsGenerating(true)
    setHasGenerated(true)
    setResults([])

    const config: GenerationConfig = {
      mode,
      industries,
      lengthRange,
      rarityRange,
      wordTypes: wordTypes.includes("any") ? undefined : wordTypes,
      brandabilityScore,
      startingLetters: startingLetters.length > 0 ? startingLetters : undefined,
      ...(mode === "advanced" && {
        qualityThreshold,
        semanticDepth,
        phoneticPreferences,
        patternType,
        domainExtensions,
        enableWebCrawling,
      }),
    }

    setCurrentFilters(config)

    try {
      console.log("[v0] Starting generation with config:", config)

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error("No reader available")

      let buffer = ""
      let resultCount = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")

        // الاحتفاظ بالسطر الأخير غير المكتمل
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.result) {
                console.log("[v0] Received result:", data.result.name)
                resultCount++
                setResults((prev) => [...prev, data.result])
                setStats((prev) => ({
                  ...prev,
                  totalCrawled: resultCount,
                  avgQuality: Math.round((prev.avgQuality * (resultCount - 1) + data.result.score) / resultCount),
                }))
              } else if (data.done) {
                console.log("[v0] Generation complete")
                if (data.error) {
                  setErrorMessage(data.error)
                } else if (data.message) {
                  setErrorMessage(data.message)
                }
                setIsGenerating(false)
              } else if (data.error) {
                setErrorMessage(data.error)
                setIsGenerating(false)
              }
            } catch (e) {
              console.error("[v0] Failed to parse SSE data:", e)
            }
          }
        }
      }
    } catch (error) {
      console.error("[v0] Generation error:", error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please check your connection and try again.",
      )
      setResults([])
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-10 w-10" />
              <h1 className="text-4xl font-bold tracking-tight">BrandCore</h1>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge variant="secondary" className="gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                AI-Powered
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                95-100% Available
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Premium Quality
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance">
              The fastest and most powerful platform for discovering brandable domains
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-pretty">
              Generate unique, meaningful English words from modern dictionaries with advanced AI analysis. Choose
              between fast generation or deep analysis for premium results.
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-[400px_1fr] gap-6">
            {/* Left Panel - Configuration */}
            <Card className="p-6 space-y-6 h-fit">
              {/* Generation Mode */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Generation Mode</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Fast Mode */}
                  <button
                    onClick={() => setMode("fast")}
                    className={cn(
                      "relative rounded-lg border-2 p-4 text-left transition-all hover:border-primary/50",
                      mode === "fast" ? "border-primary bg-primary/5" : "border-border bg-card",
                    )}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-foreground p-2">
                          <Zap className="h-5 w-5 text-background" />
                        </div>
                        <div>
                          <div className="font-semibold">Fast Mode</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            ~10-30s
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Quick generation using local sources with optimized filters
                      </p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">✓</span>
                          <span>Local GitHub sources only</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">✓</span>
                          <span>Relaxed filtering criteria</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">✓</span>
                          <span>Instant results streaming</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">✓</span>
                          <span>Good quality (70-85%)</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Advanced Mode */}
                  <button
                    onClick={() => setMode("advanced")}
                    className={cn(
                      "relative rounded-lg border-2 p-4 text-left transition-all hover:border-primary/50",
                      mode === "advanced" ? "border-primary bg-primary/5" : "border-border bg-card",
                    )}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-foreground p-2">
                          <Target className="h-5 w-5 text-background" />
                        </div>
                        <div>
                          <div className="font-semibold">Advanced Mode</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            ~1-3min
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Deep analysis with web scraping and strict quality filters
                      </p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">✓</span>
                          <span>All sources + Web APIs</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">✓</span>
                          <span>Strict quality filtering</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">✓</span>
                          <span>Deep semantic analysis</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">✓</span>
                          <span>Premium quality (85-100%)</span>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Industry Fields */}
              <div className="space-y-3">
                <h3 className="font-semibold">Industry Fields</h3>
                <div className="space-y-2">
                  {industryOptions.map((industry) => (
                    <div key={industry.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={industry.id}
                        checked={industries.includes(industry.id)}
                        onCheckedChange={() => toggleIndustry(industry.id)}
                      />
                      <Label htmlFor={industry.id} className="text-sm font-normal cursor-pointer">
                        {industry.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Word Type</h3>
                <p className="text-xs text-muted-foreground">Filter by part of speech</p>
                <div className="space-y-2">
                  {wordTypeOptions.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`wordtype-${type.id}`}
                        checked={wordTypes.includes(type.id)}
                        onCheckedChange={() => toggleWordType(type.id)}
                      />
                      <Label htmlFor={`wordtype-${type.id}`} className="text-sm font-normal cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Length Range */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    Length Range: {lengthRange[0]} - {lengthRange[1]} characters
                  </h3>
                </div>
                <Slider
                  min={3}
                  max={12}
                  step={1}
                  value={lengthRange}
                  onValueChange={(value) => setLengthRange(value as [number, number])}
                  className="w-full"
                />
              </div>

              {/* Rarity Range */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    Rarity Range: {rarityRange[0]} - {rarityRange[1]}
                  </h3>
                </div>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={rarityRange}
                  onValueChange={(value) => setRarityRange(value as [number, number])}
                  className="w-full"
                />
              </div>

              {/* Brandability Score */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Brandability Score: {brandabilityScore}%</h3>
                </div>
                <p className="text-xs text-muted-foreground">Minimum brandability score for generated names</p>
                <Slider
                  min={50}
                  max={100}
                  step={5}
                  value={[brandabilityScore]}
                  onValueChange={(value) => setBrandabilityScore(value[0])}
                  className="w-full"
                />
              </div>

              {/* Starting Letter */}
              <div className="space-y-3">
                <h3 className="font-semibold">Starting Letter</h3>
                <p className="text-xs text-muted-foreground">Filter by first letter (leave empty for any)</p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter letter (a-z)"
                    value={startingLetterInput}
                    onChange={(e) => setStartingLetterInput(e.target.value.toLowerCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddStartingLetter()
                      }
                    }}
                    maxLength={1}
                    className="flex-1"
                  />
                  <Button onClick={handleAddStartingLetter} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                {startingLetters.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {startingLetters.map((letter) => (
                      <Badge
                        key={letter}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeStartingLetter(letter)}
                      >
                        {letter.toUpperCase()} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {mode === "advanced" && (
                <>
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Web Crawling
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Enable web scraping for enhanced domain discovery
                        </p>
                      </div>
                      <Checkbox
                        checked={enableWebCrawling}
                        onCheckedChange={(checked) => setEnableWebCrawling(!!checked)}
                      />
                    </div>
                  </div>

                  {/* Quality Threshold */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Quality Threshold: {qualityThreshold}%</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">Minimum quality score for generated domains</p>
                    <Slider
                      min={70}
                      max={100}
                      step={5}
                      value={[qualityThreshold]}
                      onValueChange={(value) => setQualityThreshold(value[0])}
                      className="w-full"
                    />
                  </div>

                  {/* Semantic Analysis Depth */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Semantic Analysis Depth</h3>
                    <p className="text-xs text-muted-foreground">Depth of AI semantic analysis</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["low", "medium", "high"] as SemanticDepth[]).map((depth) => (
                        <button
                          key={depth}
                          onClick={() => setSemanticDepth(depth)}
                          className={cn(
                            "rounded-md border-2 px-3 py-2 text-sm font-medium transition-all capitalize",
                            semanticDepth === depth
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          {depth}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phonetic Preferences */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Phonetic Preferences</h3>
                    <p className="text-xs text-muted-foreground">Sound and pronunciation rules</p>
                    <div className="space-y-2">
                      {phoneticOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`phonetic-${option.id}`}
                            checked={phoneticPreferences.includes(option.id)}
                            onCheckedChange={() => togglePhoneticPreference(option.id)}
                          />
                          <Label htmlFor={`phonetic-${option.id}`} className="text-sm font-normal cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pattern Type */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Pattern Type</h3>
                    <p className="text-xs text-muted-foreground">Letter pattern preferences</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["any", "vowel-heavy", "consonant-heavy", "balanced"] as PatternType[]).map((pattern) => (
                        <button
                          key={pattern}
                          onClick={() => setPatternType(pattern)}
                          className={cn(
                            "rounded-md border-2 px-3 py-2 text-xs font-medium transition-all capitalize",
                            patternType === pattern
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          {pattern.replace("-", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Domain Extensions */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Domain Extensions</h3>
                    <p className="text-xs text-muted-foreground">Check availability for these TLDs</p>
                    <div className="flex flex-wrap gap-2">
                      {extensionOptions.map((ext) => (
                        <button
                          key={ext.id}
                          onClick={() => toggleDomainExtension(ext.id)}
                          className={cn(
                            "rounded-md border-2 px-3 py-1.5 text-sm font-medium transition-all font-mono",
                            domainExtensions.includes(ext.id)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          {ext.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || industries.length === 0}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Spinner className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Domains
                  </>
                )}
              </Button>
            </Card>

            {/* Right Panel - Results */}
            <Card className="p-8">
              {!hasGenerated ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center space-y-4">
                  <div className="relative">
                    <Sparkles className="h-24 w-24 text-muted-foreground/30" />
                    <div className="absolute -top-2 -right-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xl">+</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold">Ready to Discover</h3>
                  <p className="text-muted-foreground max-w-md text-pretty">
                    Select your generation mode, configure your preferences, and let our AI discover the perfect
                    brandable domain names for your project.
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">⌘K</kbd>
                    <span>to generate</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Generated Domains</h3>
                    <div className="flex items-center gap-2">
                      {isGenerating && <Spinner className="h-4 w-4" />}
                      <Badge variant="secondary">{results.length} results</Badge>
                      {results.length > 0 && (
                        <Button size="sm" variant="outline" onClick={handleExport} className="gap-2 bg-transparent">
                          <Download className="h-4 w-4" />
                          Export
                        </Button>
                      )}
                    </div>
                  </div>

                  {errorMessage && (
                    <Card className="p-4 border-destructive/50 bg-destructive/5">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <h4 className="font-semibold text-destructive">Error</h4>
                          <p className="text-sm text-muted-foreground">{errorMessage}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setErrorMessage(null)} className="h-6 w-6 p-0">
                          ×
                        </Button>
                      </div>
                    </Card>
                  )}

                  {results.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.totalCrawled}</div>
                        <div className="text-xs text-muted-foreground">Total Found</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.avgQuality}%</div>
                        <div className="text-xs text-muted-foreground">Avg Quality</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {Math.round((results.filter((r) => r.available).length / results.length) * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Available</div>
                      </div>
                    </div>
                  )}

                  {results.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                      <div className="text-sm text-muted-foreground">
                        Copy all {results.length} domains to clipboard
                      </div>
                      <Button size="sm" variant="outline" onClick={handleCopyAll} className="gap-2 bg-transparent">
                        {copiedAll ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied All
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy All
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {results.length > 0 ? (
                    <div className="grid gap-3">
                      {results.map((result, index) => (
                        <Card
                          key={index}
                          className="p-4 hover:border-primary/50 transition-all duration-200 hover:shadow-md animate-in fade-in slide-in-from-bottom-2"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() => openNamecheap(result.name)}
                                  className="font-mono font-semibold text-lg hover:text-primary transition-colors flex items-center gap-1.5 group"
                                  title="Check availability on Namecheap"
                                >
                                  {result.name}
                                  <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                                {result.available && (
                                  <Badge variant="secondary" className="text-xs">
                                    Available
                                  </Badge>
                                )}
                                {result.wordType && (
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {result.wordType}
                                  </Badge>
                                )}
                                {result.availability && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs gap-1"
                                    title="Domain availability probability"
                                  >
                                    <Globe className="h-3 w-3" />
                                    {result.availability}%
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                <span className="capitalize">{result.category}</span>
                                <span>•</span>
                                <span>Quality: {result.score}%</span>
                                {result.brandability && (
                                  <>
                                    <span>•</span>
                                    <span>Brand: {result.brandability}%</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(result.name, index)}
                                className="gap-2"
                              >
                                {copiedIndex === index ? (
                                  <>
                                    <Check className="h-4 w-4" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : isGenerating ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                      <Spinner className="h-12 w-12" />
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold">
                          {mode === "fast" ? "Fast Generation in Progress..." : "Deep Analysis in Progress..."}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {mode === "fast"
                            ? "Crawling GitHub sources for quality brand names..."
                            : "Deep web crawling with dictionary verification..."}
                        </p>
                        {mode === "advanced" && enableWebCrawling && (
                          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Globe className="h-3 w-3 animate-pulse" />
                            Web crawling active
                          </p>
                        )}
                        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden mx-auto mt-4">
                          <div className="h-full bg-primary animate-pulse" style={{ width: "60%" }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                      <div className="text-muted-foreground/50 text-6xl">∅</div>
                      <h3 className="text-xl font-semibold">No Results Found</h3>
                      <p className="text-muted-foreground max-w-md">
                        Try adjusting your filters or selecting different options to get better results.
                      </p>
                      <Button onClick={handleGenerate} variant="outline" className="mt-4 bg-transparent">
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-2">
            <h4 className="font-semibold">BrandCore Intelligence v5.0 - Dual Mode Edition</h4>
            <p className="text-sm text-muted-foreground">
              Fast Mode: Instant Results • Advanced Mode: Premium Quality • Web Scraping • AI Analysis • Real-time
              Availability
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
