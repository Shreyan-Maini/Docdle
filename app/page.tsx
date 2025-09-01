"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HelpCircle, RotateCcw, Lightbulb, Stethoscope, Share2 } from "lucide-react"

// ---------- Types ----------
type GuessResult = "correct" | "present" | "absent"
type Difficulty = "easy" | "medium" | "hard"

type WordEntry = {
  word: string
  hint?: string
  difficulty: Difficulty
}

type MedicalWordBank = {
  cardiovascular: WordEntry[]
  respiratory: WordEntry[]
  nervous: WordEntry[]
  skeletal: WordEntry[]
  muscular: WordEntry[]
}

type BodySystem = keyof MedicalWordBank

interface GameState {
  currentWord: string
  currentHint: string
  currentDifficulty: Difficulty
  guesses: string[]
  currentGuess: string
  gameStatus: "playing" | "won" | "lost"
  selectedSystem: BodySystem | null
}

// ---------- Fallback (small) inlined data ----------
// Only used if /medical-words.json is not found (e.g., first run).
const FALLBACK_WORDS: MedicalWordBank = {
  cardiovascular: [
    { word: "HEART", hint: "Muscular organ that pumps blood", difficulty: "easy" },
    { word: "AORTA", hint: "Largest artery in the body", difficulty: "medium" },
    { word: "VALVE", hint: "Controls blood flow direction", difficulty: "easy" },
    { word: "SYSTOLE", hint: "Contraction phase of heart", difficulty: "hard" },
    { word: "MURMUR", hint: "Abnormal heart sound", difficulty: "medium" },
  ],
  respiratory: [
    { word: "LUNGS", hint: "Paired organs for gas exchange", difficulty: "easy" },
    { word: "ALVEOLI", hint: "Tiny air sacs where gas exchange occurs", difficulty: "medium" },
    { word: "BRONCHI", hint: "Main airways leading to lungs", difficulty: "medium" },
    { word: "DIAPHRAGM", hint: "Primary breathing muscle", difficulty: "hard" },
    { word: "ASTHMA", hint: "Chronic airway inflammation", difficulty: "easy" },
  ],
  nervous: [
    { word: "BRAIN", hint: "Control center of the nervous system", difficulty: "easy" },
    { word: "NEURON", hint: "Basic nerve cell", difficulty: "easy" },
    { word: "SYNAPSE", hint: "Junction between neurons", difficulty: "medium" },
    { word: "MYELIN", hint: "Insulating sheath on axons", difficulty: "medium" },
    { word: "AMYGDALA", hint: "Emotion processing center", difficulty: "hard" },
  ],
  skeletal: [
    { word: "BONES", hint: "Hard structures of the skeleton", difficulty: "easy" },
    { word: "FEMUR", hint: "Longest bone in body", difficulty: "easy" },
    { word: "OSTEON", hint: "Basic unit of compact bone", difficulty: "hard" },
    { word: "LIGAMENT", hint: "Connects bone to bone", difficulty: "medium" },
    { word: "PATELLA", hint: "Kneecap", difficulty: "easy" },
  ],
  muscular: [
    { word: "MUSCLE", hint: "Contracts to produce movement", difficulty: "easy" },
    { word: "BICEPS", hint: "Anterior upper arm muscle", difficulty: "easy" },
    { word: "SARCOMERE", hint: "Contractile unit of muscle", difficulty: "hard" },
    { word: "TENDON", hint: "Connects muscle to bone", difficulty: "easy" },
    { word: "MYOSIN", hint: "Thick filament protein", difficulty: "medium" },
  ],
}

// ---------- Component ----------
export default function MedicalWordle() {
  console.log("MedicalWordle component rendered")
  const [bank, setBank] = useState<MedicalWordBank | null>(null)

  const [gameState, setGameState] = useState<GameState>({
    currentWord: "",
    currentHint: "",
    currentDifficulty: "easy",
    guesses: [],
    currentGuess: "",
    gameStatus: "playing",
    selectedSystem: null,
  })

  const [showHint, setShowHint] = useState<boolean>(false)
  const [revealedLetters, setRevealedLetters] = useState<Set<string>>(new Set())
  const [shakeRow, setShakeRow] = useState<number | null>(null)

  // Monitor bank state changes
  useEffect(() => {
    console.log("Bank state changed:", bank ? "loaded" : "null")
    if (bank) {
      console.log("Bank keys:", Object.keys(bank))
      console.log("Sample words:", bank.cardiovascular?.slice(0, 3))
    }
  }, [bank])

  // Load external wordbank from /medical-words.json (place this file in /public)
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log("Not in browser environment, skipping fetch")
      return
    }
    
    console.log("useEffect triggered - starting to load medical words")
    
    const load = async (retryCount = 0) => {
      try {
        console.log(`Attempting to load medical-words.json (attempt ${retryCount + 1})...`)
        console.log("Current URL:", window.location.href)
        console.log("Fetching from:", "/medical-words.json")
        
        // Simple fetch call
        const res = await fetch("/medical-words.json", { 
          cache: "no-store"
        })
        console.log("Fetch response:", res.status, res.statusText, res.headers.get('content-type'))
        
        if (!res.ok) {
          console.error("Response not ok:", res.status, res.statusText)
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }
        
        const data: MedicalWordBank = await res.json()
        console.log("Successfully loaded medical words:", data)
        console.log("Data keys:", Object.keys(data))
        console.log("Sample cardiovascular words:", data.cardiovascular?.slice(0, 3))
        
        // Validate that we have some data
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          // Check if all required keys exist
          const requiredKeys = ['cardiovascular', 'respiratory', 'nervous', 'skeletal', 'muscular']
          const hasAllKeys = requiredKeys.every(key => key in data && Array.isArray(data[key as keyof MedicalWordBank]))
          
          if (hasAllKeys) {
            console.log("Setting bank with loaded data")
            console.log("Data before setBank:", data)
            setBank(data)
            console.log("setBank called")
            return // Success, exit early
          } else {
            console.error("Missing required keys:", requiredKeys.filter(key => !(key in data && Array.isArray(data[key as keyof MedicalWordBank]))))
            throw new Error("Invalid data structure - missing required keys")
          }
        } else {
          throw new Error("Empty or invalid data received")
        }
      } catch (error) {
        console.warn(`Failed to load medical-words.json (attempt ${retryCount + 1}):`, error)
        
        // Retry up to 3 times with exponential backoff
        if (retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 500 // 500ms, 1000ms, 2000ms
          console.log(`Retrying in ${delay}ms...`)
          setTimeout(() => load(retryCount + 1), delay)
          return
        }
        
        // All retries failed, use fallback
        console.log("All retries failed, setting bank with fallback words")
        setBank(FALLBACK_WORDS)
      }
    }
    
    // Start loading immediately
    load()
    
    // Cleanup function
    return () => {
      console.log("useEffect cleanup - component unmounting")
    }
  }, [])

  // Initialize game with selected body system
  const startNewGame = (system: BodySystem) => {
    console.log("startNewGame called with system:", system)
    console.log("Current bank:", bank ? "loaded" : "fallback")
    const source = bank ?? FALLBACK_WORDS
    console.log("Using source:", source === bank ? "loaded bank" : "fallback words")
    const words = source[system]
    console.log("Words for system:", words?.length || 0)
    const randomWord = words[Math.floor(Math.random() * words.length)]

    setGameState({
      currentWord: randomWord.word.toUpperCase(),
      currentHint: randomWord.hint ?? "",
      currentDifficulty: randomWord.difficulty,
      guesses: [],
      currentGuess: "",
      gameStatus: "playing",
      selectedSystem: system,
    })
    setShowHint(false)
    setRevealedLetters(new Set())
    setShakeRow(null)
  }

  // Handle key input
  const handleKeyPress = (key: string) => {
    if (gameState.gameStatus !== "playing") return

    if (key === "ENTER") {
      if (gameState.currentGuess.length === gameState.currentWord.length) {
        submitGuess()
      } else {
        setShakeRow(gameState.guesses.length)
        setTimeout(() => setShakeRow(null), 600)
      }
      return
    }

    if (key === "BACKSPACE") {
      setGameState((prev: GameState) => ({
        ...prev,
        currentGuess: prev.currentGuess.slice(0, -1),
      }))
      return
    }

    if (/^[A-Z]$/.test(key) && gameState.currentGuess.length < gameState.currentWord.length) {
      setGameState((prev: GameState) => ({
        ...prev,
        currentGuess: prev.currentGuess + key,
      }))
    }
  }

  // Submit current guess
  const submitGuess = () => {
    if (gameState.currentGuess.length !== gameState.currentWord.length) {
      setShakeRow(gameState.guesses.length)
      setTimeout(() => setShakeRow(null), 600)
      return
    }

    const newGuesses = [...gameState.guesses, gameState.currentGuess]
    const isCorrect = gameState.currentGuess === gameState.currentWord
    const isGameOver = newGuesses.length >= 6

    const newRevealedLetters = new Set(revealedLetters)
    gameState.currentGuess.split("").forEach((letter) => {
      newRevealedLetters.add(letter)
    })
    setRevealedLetters(newRevealedLetters)

    setGameState((prev: GameState) => ({
      ...prev,
      guesses: newGuesses,
      currentGuess: "",
      gameStatus: isCorrect ? "won" : isGameOver ? "lost" : "playing",
    }))
  }

  // Per-letter status (green/yellow/gray)
  const getLetterStatus = (letter: string, position: number, guess: string): GuessResult => {
    if (gameState.currentWord[position] === letter) return "correct"
    if (gameState.currentWord.includes(letter)) {
      const targetCount = gameState.currentWord.split("").filter((l) => l === letter).length
      let correctCount = 0
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === letter && gameState.currentWord[i] === letter) correctCount++
      }
      let beforeCount = 0
      for (let i = 0; i < position; i++) {
        if (guess[i] === letter && gameState.currentWord[i] !== letter) beforeCount++
      }
      if (correctCount + beforeCount < targetCount) return "present"
    }
    return "absent"
  }

  // Keyboard key best status across guesses
  const getKeyboardLetterStatus = (letter: string): GuessResult | null => {
    let bestStatus: GuessResult | null = null
    for (const guess of gameState.guesses) {
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === letter) {
          const status = getLetterStatus(letter, i, guess)
          if (status === "correct") return "correct"
          if (status === "present" && bestStatus !== "correct") bestStatus = "present"
          if (status === "absent" && bestStatus === null) bestStatus = "absent"
        }
      }
    }
    return bestStatus
  }

  // Physical keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleKeyPress("ENTER")
      else if (e.key === "Backspace") handleKeyPress("BACKSPACE")
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase())
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.gameStatus, gameState.guesses.length, gameState.currentGuess, gameState.currentWord])

  // Share functionality
  const shareResults = () => {
    const guessCount = gameState.gameStatus === "won" ? gameState.guesses.length : "X"
    const systemName = gameState.selectedSystem?.replace(/([A-Z])/g, " $1").trim()
    let grid = ""
    gameState.guesses.forEach((guess) => {
      let row = ""
      for (let i = 0; i < guess.length; i++) {
        const status = getLetterStatus(guess[i], i, guess)
        row += status === "correct" ? "🟩" : status === "present" ? "🟨" : "⬜"
      }
      grid += row + "\n"
    })
    const shareText = `Docdle ${systemName} ${guessCount}/6\n\n${grid}\nPlay at: ${window.location.href}`
    if (navigator.share) {
      navigator.share({ title: "Docdle Results", text: shareText }).catch(() => {
        navigator.clipboard.writeText(shareText)
      })
    } else {
      navigator.clipboard.writeText(shareText)
    }
  }

  // --------- UI ---------
  console.log("Component render - bank state:", bank ? "loaded" : "null")
  
  if (!bank) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-6">
          <div>Loading word bank…</div>
          <div className="text-sm text-muted-foreground mt-2">Check console for debug info</div>
        </Card>
      </div>
    )
  }

  if (!gameState.selectedSystem) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Stethoscope className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-primary">Docdle</h1>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Test your medical vocabulary knowledge with this educational word game
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Choose a Body System:</h2>
            <div className="grid gap-2">
              {(Object.keys(bank) as BodySystem[]).map((system, index) => (
                <Button
                  key={system}
                  onClick={() => startNewGame(system)}
                  variant="outline"
                  className="capitalize hover:scale-105 transition-all duration-200 animate-in fade-in-50 slide-in-from-left-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {system.replace(/([A-Z])/g, " $1").trim()}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const difficultyColor: Record<Difficulty, string> = {
    easy: "bg-green-500 text-white",
    medium: "bg-yellow-400 text-black",
    hard: "bg-red-500 text-white",
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto animate-in fade-in-50 slide-in-from-top-4 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-primary">Docdle</h1>
            </div>
            <div className="flex gap-2 mt-1 items-center">
              <Badge variant="secondary" className="capitalize animate-in fade-in-50 delay-100">
                {gameState.selectedSystem?.replace(/([A-Z])/g, " $1").trim()}
              </Badge>
              <Badge className={`${difficultyColor[gameState.currentDifficulty]} capitalize animate-in fade-in-50 delay-200`}>
                {gameState.currentDifficulty}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="hover:scale-110 transition-transform duration-200 bg-transparent">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
                <DialogHeader>
                  <DialogTitle>How to Play</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <p>Guess the medical term in 6 tries or less!</p>
                  <div className="space-y-2">
                    {/* Correct = GREEN */}
                    <div className="flex items-center gap-2 animate-in fade-in-50 slide-in-from-left-4 delay-100">
                      <div className="w-8 h-8 bg-green-500 text-white rounded flex items-center justify-center font-bold">A</div>
                      <span>Correct letter in correct position</span>
                    </div>
                    {/* Present = YELLOW */}
                    <div className="flex items-center gap-2 animate-in fade-in-50 slide-in-from-left-4 delay-200">
                      <div className="w-8 h-8 bg-yellow-400 text-black rounded flex items-center justify-center font-bold">B</div>
                      <span>Correct letter in wrong position</span>
                    </div>
                    {/* Absent = GRAY */}
                    <div className="flex items-center gap-2 animate-in fade-in-50 slide-in-from-left-4 delay-300">
                      <div className="w-8 h-8 bg-muted text-muted-foreground rounded flex items-center justify-center font-bold">C</div>
                      <span>Letter not in word</span>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowHint((prev) => !prev)}
              className={`hover:scale-110 transition-all duration-200 ${showHint ? "bg-accent text-accent-foreground" : ""}`}
            >
              <Lightbulb className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setGameState((prev: GameState) => ({ ...prev, selectedSystem: null }))}
              className="hover:scale-110 transition-transform duration-200"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Hint */}
        {showHint && (
          <Card className="p-3 mb-4 bg-accent/10 animate-in fade-in-50 slide-in-from-top-2 duration-300">
            <p className="text-sm text-center">
              <strong>Hint:</strong> {gameState.currentHint || "—"}
            </p>
          </Card>
        )}

        {/* Game Grid */}
        <div className="flex flex-col items-center gap-2 mb-6">
          {Array.from({ length: 6 }, (_, rowIndex) => (
            <div key={rowIndex} className={`flex gap-2 ${shakeRow === rowIndex ? "animate-bounce" : ""}`}>
              {Array.from({ length: gameState.currentWord.length || 5 }, (_, colIndex) => {
                const guess = gameState.guesses[rowIndex]
                const isCurrentRow = rowIndex === gameState.guesses.length && gameState.gameStatus === "playing"
                const letter = guess ? guess[colIndex] : isCurrentRow ? gameState.currentGuess[colIndex] ?? "" : ""
                const status: GuessResult | null = guess ? getLetterStatus(guess[colIndex], colIndex, guess) : null
                const isRevealed = Boolean(guess && rowIndex < gameState.guesses.length)

                return (
                  <div
                    key={colIndex}
                    className={`
                      w-12 h-12 border-2 rounded flex items-center justify-center font-bold text-lg
                      transition-all duration-300 hover:scale-105
                      ${
                        status === "correct"
                          ? "bg-green-500 text-white border-green-500 animate-in zoom-in-50"
                          : status === "present"
                            ? "bg-yellow-400 text-black border-yellow-400 animate-in zoom-in-50"
                            : status === "absent"
                              ? "bg-muted text-muted-foreground border-muted animate-in zoom-in-50"
                              : letter
                                ? "border-foreground animate-pulse"
                                : "border-border"
                      }
                    `}
                    style={isRevealed ? { animationDelay: `${colIndex * 100}ms` } : {}}
                  >
                    {letter}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Game Status */}
        {gameState.gameStatus !== "playing" && (
          <Card className="p-4 text-center mb-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            {gameState.gameStatus === "won" ? (
              <div className="text-primary">
                <h3 className="font-bold text-lg animate-in zoom-in-50 duration-300">Congratulations!</h3>
                <p className="animate-in fade-in-50 delay-200">
                  You guessed the word: <strong>{gameState.currentWord}</strong>
                </p>
              </div>
            ) : (
              <div className="text-destructive">
                <h3 className="font-bold text-lg animate-in zoom-in-50 duration-300">Game Over</h3>
                <p className="animate-in fade-in-50 delay-200">
                  The word was: <strong>{gameState.currentWord}</strong>
                </p>
              </div>
            )}
            <div className="flex gap-2 justify-center mt-3">
              <Button onClick={() => startNewGame(gameState.selectedSystem!)} className="hover:scale-105 transition-transform duration-200 animate-in fade-in-50 delay-300">
                Play Again
              </Button>
              <Button variant="outline" onClick={shareResults} className="hover:scale-105 transition-transform duration-200 animate-in fade-in-50 delay-300 bg-transparent">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </Card>
        )}

        {/* Virtual Keyboard */}
        <div className="space-y-2">
          {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 justify-center">
              {rowIndex === 2 && (
                <Button variant="outline" size="sm" onClick={() => handleKeyPress("ENTER")} className="px-3 hover:scale-105 transition-all duration-200 text-xs">
                  ENTER
                </Button>
              )}
              {row.split("").map((letter) => {
                const keyStatus = getKeyboardLetterStatus(letter)
                return (
                  <Button
                    key={letter}
                    variant="outline"
                    size="sm"
                    onClick={() => handleKeyPress(letter)}
                    className={`
                      w-8 h-8 p-0 text-xs font-bold transition-all duration-200 hover:scale-110
                      ${
                        keyStatus === "correct"
                          ? "bg-green-500 text-white border-green-500"
                          : keyStatus === "present"
                            ? "bg-yellow-400 text-black border-yellow-400"
                            : keyStatus === "absent"
                              ? "bg-muted text-muted-foreground border-muted opacity-50"
                              : ""
                      }
                    `}
                  >
                    {letter}
                  </Button>
                )
              })}
              {rowIndex === 2 && (
                <Button variant="outline" size="sm" onClick={() => handleKeyPress("BACKSPACE")} className="px-3 hover:scale-105 transition-all duration-200 text-xs">
                  ⌫
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
