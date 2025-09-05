"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HelpCircle, RotateCcw, Lightbulb, Stethoscope, Share2, SkipForward } from "lucide-react"

// ---------- Types ----------
type GuessResult = "correct" | "present" | "absent"
type Difficulty = "easy" | "medium" | "hard"

type WordEntry = {
  word: string
  hint?: string
  difficulty: Difficulty
  educational?: string
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
  currentEducational: string
  guesses: string[]
  currentGuess: string
  gameStatus: "playing" | "won" | "lost"
  selectedSystem: BodySystem | null
}

// ---------- Fallback (small) inlined data ----------
// Only used if /medical-words.json is not found (e.g., first run).
const FALLBACK_WORDS: MedicalWordBank = {
  cardiovascular: [
    { word: "HEART", hint: "Muscular organ that pumps blood", difficulty: "easy", educational: "The heart is a four-chambered organ that maintains systemic circulation. The right side pumps deoxygenated blood to the lungs, while the left side pumps oxygenated blood to the body. Cardiac output averages 5-6 liters per minute at rest." },
    { word: "AORTA", hint: "Largest artery in the body", difficulty: "medium", educational: "The aorta is the main conduit for oxygenated blood from the left ventricle. It has three layers: intima, media, and adventitia. The ascending aorta gives rise to coronary arteries, while the arch supplies the head and upper extremities." },
    { word: "VALVE", hint: "Controls blood flow direction", difficulty: "easy", educational: "Cardiac valves ensure unidirectional blood flow. The atrioventricular valves (tricuspid and mitral) prevent backflow during systole, while semilunar valves (pulmonary and aortic) prevent backflow during diastole. Valve dysfunction can lead to heart failure." },
    { word: "SYSTOLE", hint: "Contraction phase of heart", difficulty: "hard", educational: "Systole is the contraction phase of the cardiac cycle. Ventricular systole ejects blood into the pulmonary and systemic circulations. The first heart sound (S1) occurs when the atrioventricular valves close at the beginning of systole." },
    { word: "MURMUR", hint: "Abnormal heart sound", difficulty: "medium", educational: "Heart murmurs are caused by turbulent blood flow through the heart. They can be innocent (physiological) or pathological. Murmurs are classified by timing (systolic/diastolic), location, radiation, and intensity (grade 1-6)." },
    { word: "AVNODE", hint: "Conduction node between atria and ventricles", difficulty: "hard", educational: "The atrioventricular node (AV node) is a specialized cardiac conduction tissue located in the lower portion of the right atrium. It delays electrical impulses from the atria to the ventricles, allowing for proper ventricular filling. The AV node is the backup pacemaker of the heart, firing at 40-60 bpm if the SA node fails." },
  ],
  respiratory: [
    { word: "LUNGS", hint: "Paired organs for gas exchange", difficulty: "easy", educational: "The lungs are paired organs responsible for gas exchange. The right lung has three lobes, the left has two. They contain approximately 300 million alveoli, providing a surface area of about 70 square meters for gas exchange." },
    { word: "ALVEOLI", hint: "Tiny air sacs where gas exchange occurs", difficulty: "medium", educational: "Alveoli are the functional units of gas exchange, surrounded by pulmonary capillaries. They contain type I pneumocytes for gas exchange and type II pneumocytes that produce surfactant, which reduces surface tension and prevents alveolar collapse." },
    { word: "BRONCHI", hint: "Main airways leading to lungs", difficulty: "medium", educational: "The bronchi are the main airways that branch from the trachea. The right main bronchus is shorter and more vertical than the left. They continue branching into bronchioles, eventually reaching terminal bronchioles and respiratory bronchioles." },
    { word: "DIAPHRAGM", hint: "Primary breathing muscle", difficulty: "hard", educational: "The diaphragm is the primary muscle of inspiration. When it contracts, it flattens and increases thoracic volume, creating negative pressure that draws air into the lungs. It's innervated by the phrenic nerve (C3-C5) and separates the thoracic and abdominal cavities." },
    { word: "ASTHMA", hint: "Chronic airway inflammation", difficulty: "easy", educational: "Asthma is a chronic inflammatory airway disease characterized by reversible airway obstruction, hyperresponsiveness, and inflammation. Triggers include allergens, exercise, and irritants. Treatment involves bronchodilators and anti-inflammatory medications." },
  ],
  nervous: [
    { word: "BRAIN", hint: "Control center of the nervous system", difficulty: "easy", educational: "The brain is the central processing unit of the nervous system, containing approximately 86 billion neurons. It's divided into the cerebrum, cerebellum, and brainstem. The brain consumes about 20% of the body's oxygen and glucose despite being only 2% of body weight." },
    { word: "NEURON", hint: "Basic nerve cell", difficulty: "easy", educational: "Neurons are the basic functional units of the nervous system. They consist of a cell body (soma), dendrites for receiving signals, and an axon for transmitting signals. Neurons communicate through electrical impulses and chemical neurotransmitters at synapses." },
    { word: "SYNAPSE", hint: "Junction between neurons", difficulty: "medium", educational: "Synapses are specialized junctions where neurons communicate. They consist of a presynaptic terminal, synaptic cleft, and postsynaptic membrane. Neurotransmitters are released from vesicles in the presynaptic terminal and bind to receptors on the postsynaptic membrane." },
    { word: "MYELIN", hint: "Insulating sheath on axons", difficulty: "medium", educational: "Myelin is a fatty substance that forms an insulating sheath around axons, dramatically increasing conduction velocity. It's produced by oligodendrocytes in the CNS and Schwann cells in the PNS. Demyelination diseases like multiple sclerosis disrupt nerve conduction." },
    { word: "AMYGDALA", hint: "Emotion processing center", difficulty: "hard", educational: "The amygdala is part of the limbic system and plays a crucial role in emotional processing, particularly fear responses and emotional memory formation. It's located in the temporal lobe and has connections to the hippocampus, prefrontal cortex, and hypothalamus." },
  ],
  skeletal: [
    { word: "BONES", hint: "Hard structures of the skeleton", difficulty: "easy", educational: "Bones are living organs composed of mineralized connective tissue. They provide structural support, protect vital organs, store calcium and phosphorus, and house bone marrow for hematopoiesis. The adult skeleton contains 206 bones, while infants have approximately 270." },
    { word: "FEMUR", hint: "Longest bone in body", difficulty: "easy", educational: "The femur is the longest and strongest bone in the human body. It articulates with the acetabulum proximally and the tibia distally. The femoral head is supplied by the medial and lateral circumflex arteries, making it vulnerable to avascular necrosis." },
    { word: "OSTEON", hint: "Basic unit of compact bone", difficulty: "hard", educational: "Osteons are the basic structural units of compact bone, consisting of concentric lamellae surrounding a central canal containing blood vessels and nerves. They run parallel to the long axis of the bone and provide strength and resistance to bending forces." },
    { word: "LIGAMENT", hint: "Connects bone to bone", difficulty: "medium", educational: "Ligaments are dense, fibrous connective tissues that connect bones to other bones, providing joint stability and limiting excessive movement. They consist primarily of collagen fibers arranged in parallel bundles. Unlike tendons, they have limited blood supply, affecting healing capacity." },
    { word: "PATELLA", hint: "Kneecap", difficulty: "easy", educational: "The patella is a sesamoid bone embedded within the quadriceps tendon. It acts as a pulley, increasing the mechanical advantage of the quadriceps muscle by changing the angle of pull. It articulates with the femoral trochlea and protects the knee joint." },
  ],
  muscular: [
    { word: "MUSCLE", hint: "Contracts to produce movement", difficulty: "easy", educational: "Muscles are contractile tissues that generate force and movement. There are three types: skeletal (voluntary, striated), cardiac (involuntary, striated), and smooth (involuntary, non-striated). Skeletal muscles are attached to bones via tendons and work in antagonistic pairs." },
    { word: "BICEPS", hint: "Anterior upper arm muscle", difficulty: "easy", educational: "The biceps brachii is a two-headed muscle in the anterior compartment of the arm. Both heads originate from the scapula and insert on the radial tuberosity. It flexes the elbow and supinates the forearm, with the short head also assisting in shoulder flexion." },
    { word: "SARCOMERE", hint: "Contractile unit of muscle", difficulty: "hard", educational: "The sarcomere is the basic contractile unit of striated muscle, defined as the region between two Z-lines. It contains overlapping actin and myosin filaments. Muscle contraction occurs when myosin heads bind to actin and pull the filaments past each other, shortening the sarcomere." },
    { word: "TENDON", hint: "Connects muscle to bone", difficulty: "easy", educational: "Tendons are dense, fibrous connective tissues that connect muscles to bones, transmitting the force generated by muscle contraction to the skeleton. They consist primarily of parallel collagen fibers and have high tensile strength but limited elasticity. Tendon injuries often require prolonged healing." },
    { word: "MYOSIN", hint: "Thick filament protein", difficulty: "medium", educational: "Myosin is a motor protein that forms the thick filaments in muscle sarcomeres. It has a globular head that binds to actin and uses ATP hydrolysis to generate the power stroke during muscle contraction. Myosin heads contain ATPase activity and are responsible for the sliding filament mechanism." },
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
    currentEducational: "",
    guesses: [],
    currentGuess: "",
    gameStatus: "playing",
    selectedSystem: null,
  })

  const [showHint, setShowHint] = useState<boolean>(true)
  const [revealedLetters, setRevealedLetters] = useState<Set<string>>(new Set())
  const [shakeRow, setShakeRow] = useState<number | null>(null)
  const [aiEducationalContent, setAiEducationalContent] = useState<string>("")

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

  // Generate AI medical insight for any word
  const generateMedicalInsight = async (word: string, system: BodySystem, hint?: string) => {
    try {
      const systemName = system.replace(/([A-Z])/g, " $1").trim().toLowerCase()
      const prompt = `Generate a concise, professional medical insight for the term "${word}" in the ${systemName} system. ${hint ? `Hint: ${hint}` : ''} Provide 1-2 sentences of educational content suitable for medical students and healthcare professionals. Focus on anatomical, physiological, or clinical significance.`
      
      // For now, we'll use a simple fallback since we can't make actual API calls
      // In a real implementation, you'd call an AI service like OpenAI, Claude, etc.
      const fallbackInsights: Record<string, string> = {
        'AVNODE': 'The atrioventricular node (AV node) is a specialized cardiac conduction tissue located in the lower portion of the right atrium. It delays electrical impulses from the atria to the ventricles, allowing for proper ventricular filling. The AV node is the backup pacemaker of the heart, firing at 40-60 bpm if the SA node fails.',
        'CARDIOMYOPATHY': 'Cardiomyopathy refers to diseases of the heart muscle that affect its structure and function. It can be classified as dilated, hypertrophic, or restrictive, each with distinct pathophysiological mechanisms and clinical presentations.',
        'GASTROENTEROLOGY': 'Gastroenterology is the medical specialty focused on the digestive system and its disorders. It encompasses the esophagus, stomach, small intestine, colon, rectum, liver, gallbladder, and pancreas.',
        'NEUROLOGY': 'Neurology is the branch of medicine dealing with disorders of the nervous system, including the brain, spinal cord, and peripheral nerves. It covers conditions ranging from stroke and epilepsy to neurodegenerative diseases.',
        'PULMONOLOGY': 'Pulmonology is the medical specialty concerned with diseases of the respiratory system, including the lungs, airways, and chest wall. It encompasses conditions like asthma, COPD, pneumonia, and lung cancer.',
        'ORTHOPEDICS': 'Orthopedics is the medical specialty focused on the musculoskeletal system, including bones, joints, muscles, ligaments, and tendons. It covers both surgical and non-surgical treatment of musculoskeletal disorders.',
        'DERMATOLOGY': 'Dermatology is the branch of medicine dealing with skin, hair, and nail disorders. It encompasses both medical and surgical aspects of skin disease, including cosmetic dermatology and dermatopathology.',
        'ONCOLOGY': 'Oncology is the medical specialty focused on the diagnosis and treatment of cancer. It includes medical oncology (chemotherapy), radiation oncology, and surgical oncology, with a multidisciplinary approach to cancer care.',
        'ENDOCRINOLOGY': 'Endocrinology is the branch of medicine dealing with disorders of the endocrine system, including diabetes, thyroid disease, and adrenal disorders. It focuses on hormone regulation and metabolic processes.',
        'RHEUMATOLOGY': 'Rheumatology is the medical specialty focused on autoimmune and inflammatory disorders affecting joints, muscles, and connective tissue. It includes conditions like rheumatoid arthritis, lupus, and vasculitis.'
      }
      
      // Return a specific insight if available, otherwise generate a generic one
      const specificInsight = fallbackInsights[word.toUpperCase()]
      if (specificInsight) {
        setAiEducationalContent(specificInsight)
        return
      }
      
      // Generic insight based on system
      const genericInsights: Record<BodySystem, string> = {
        cardiovascular: `"${word}" is a cardiovascular term related to the heart and blood vessels. The cardiovascular system is responsible for circulating blood throughout the body, delivering oxygen and nutrients to tissues while removing waste products.`,
        respiratory: `"${word}" is a respiratory term related to the lungs and breathing. The respiratory system facilitates gas exchange between the body and environment, ensuring adequate oxygen supply and carbon dioxide removal.`,
        nervous: `"${word}" is a neurological term related to the nervous system. The nervous system coordinates body functions through electrical and chemical signals, including the brain, spinal cord, and peripheral nerves.`,
        skeletal: `"${word}" is a skeletal term related to bones and joints. The skeletal system provides structural support, protects vital organs, and facilitates movement through its interaction with muscles.`,
        muscular: `"${word}" is a muscular term related to muscle tissue and function. The muscular system enables movement, maintains posture, and generates heat through muscle contraction and relaxation.`
      }
      
      setAiEducationalContent(genericInsights[system] || `"${word}" is an important medical term in the ${systemName} system. Understanding medical terminology is crucial for healthcare professionals and students.`)
    } catch (error) {
      console.error('Error generating medical insight:', error)
      setAiEducationalContent(`"${word}" is an important medical term in the ${system.replace(/([A-Z])/g, " $1").trim().toLowerCase()} system. Understanding medical terminology is crucial for healthcare professionals and students.`)
    }
  }

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
      currentEducational: randomWord.educational ?? "",
      guesses: [],
      currentGuess: "",
      gameStatus: "playing",
      selectedSystem: system,
    })
    setShowHint(true)
    setRevealedLetters(new Set())
    setShakeRow(null)
    setAiEducationalContent("")
    
    // Generate AI medical insight for the word
    generateMedicalInsight(randomWord.word.toUpperCase(), system, randomWord.hint)
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
          if (status === "present" && !["correct", "present"].includes(bestStatus as string)) bestStatus = "present"
          if (status === "absent" && bestStatus === null) bestStatus = "absent"
        }
      }
    }
    return bestStatus
  }

  // Physical keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Debug: log all key events
      console.log("Key pressed:", e.key, "Game status:", gameState.gameStatus)
      
      // Only handle keys when game is active
      if (gameState.gameStatus !== "playing") return
      
      // Handle game keys
      if (e.key === "Enter") {
        e.preventDefault()
        console.log("Handling ENTER key")
        handleKeyPress("ENTER")
      } else if (e.key === "Backspace") {
        e.preventDefault()
        console.log("Handling BACKSPACE key")
        handleKeyPress("BACKSPACE")
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault()
        console.log("Handling letter key:", e.key.toUpperCase())
        handleKeyPress(e.key.toUpperCase())
      }
    }
    
    // Use passive: false to ensure preventDefault works on mobile
    window.addEventListener("keydown", handleKeyDown, { passive: false })
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
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
    <div 
      className="min-h-screen bg-background p-2 sm:p-4"
      tabIndex={0}
      onFocus={() => {}}
      onBlur={() => {}}
      onClick={(e) => {
        // Ensure the container gets focus when clicked on mobile
        if (e.currentTarget === e.target) {
          e.currentTarget.focus()
        }
      }}
    >
      <div className="max-w-md mx-auto animate-in fade-in-50 slide-in-from-top-4 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold text-primary">Docdle</h1>
            </div>
            <div className="flex gap-1 sm:gap-2 mt-1 items-center">
              <Badge variant="secondary" className="capitalize animate-in fade-in-50 delay-100 text-xs sm:text-sm">
                {gameState.selectedSystem?.replace(/([A-Z])/g, " $1").trim()}
              </Badge>
              <Badge className={`${difficultyColor[gameState.currentDifficulty]} capitalize animate-in fade-in-50 delay-200 text-xs sm:text-sm`}>
                {gameState.currentDifficulty}
              </Badge>
            </div>
          </div>

          <div className="flex gap-1 sm:gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="hover:scale-110 transition-transform duration-200 bg-transparent h-8 w-8 sm:h-10 sm:w-10">
                  <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="animate-in fade-in-50 slide-in-from-bottom-4 duration-300 max-w-sm mx-4">
                <DialogHeader>
                  <DialogTitle className="text-lg">How to Play</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <p>Guess the medical term in 6 tries or less!</p>
                  <div className="space-y-2">
                    {/* Correct = GREEN */}
                    <div className="flex items-center gap-2 animate-in fade-in-50 slide-in-from-left-4 delay-100">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 text-white rounded flex items-center justify-center font-bold text-sm sm:text-base">A</div>
                      <span className="text-xs sm:text-sm">Correct letter in correct position</span>
                    </div>
                    {/* Present = YELLOW */}
                    <div className="flex items-center gap-2 animate-in fade-in-50 slide-in-from-left-4 delay-200">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 text-black rounded flex items-center justify-center font-bold text-sm sm:text-base">B</div>
                      <span className="text-xs sm:text-sm">Correct letter in wrong position</span>
                    </div>
                    {/* Absent = GRAY */}
                    <div className="flex items-center gap-2 animate-in fade-in-50 slide-in-from-left-4 delay-300">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted text-muted-foreground rounded flex items-center justify-center font-bold text-sm sm:text-base">C</div>
                      <span className="text-xs sm:text-sm">Letter not in word</span>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowHint((prev) => !prev)}
              className={`hover:scale-110 transition-all duration-200 h-8 w-8 sm:h-10 sm:w-10 ${showHint ? "bg-accent text-accent-foreground" : ""}`}
            >
              <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (gameState.gameStatus === "playing") {
                  startNewGame(gameState.selectedSystem!)
                }
              }}
              className="hover:scale-110 transition-transform duration-200 h-8 w-8 sm:h-10 sm:w-10"
              title="Skip Word"
            >
              <SkipForward className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setGameState((prev: GameState) => ({ ...prev, selectedSystem: null }))}
              className="hover:scale-110 transition-transform duration-200 h-8 w-8 sm:h-10 sm:w-10"
              title="Change System"
            >
              <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {/* Hint */}
        {showHint && (
          <Card className="p-2 sm:p-3 mb-3 sm:mb-4 bg-accent/10 animate-in fade-in-50 slide-in-from-top-2 duration-300">
            <p className="text-xs sm:text-sm text-center">
              <strong>Hint:</strong> {gameState.currentHint || "—"}
            </p>
          </Card>
        )}

        {/* Game Grid */}
        <div className="flex flex-col items-center gap-1 sm:gap-2 mb-4 sm:mb-6 w-full px-2">
          {Array.from({ length: 6 }, (_, rowIndex) => (
            <div key={rowIndex} className={`flex gap-1 sm:gap-2 justify-center w-full ${shakeRow === rowIndex ? "animate-bounce" : ""}`} style={{ maxWidth: gameState.currentWord.length > 8 ? '100%' : '24rem' }}>
              {Array.from({ length: gameState.currentWord.length || 5 }, (_, colIndex) => {
                const guess = gameState.guesses[rowIndex]
                const isCurrentRow = rowIndex === gameState.guesses.length && gameState.gameStatus === "playing"
                const letter = guess ? guess[colIndex] : isCurrentRow ? gameState.currentGuess[colIndex] ?? "" : ""
                const status: GuessResult | null = guess ? getLetterStatus(letter, colIndex, guess) : null
                const isRevealed = Boolean(guess && rowIndex < gameState.guesses.length)

                return (
                  <div
                    key={colIndex}
                    className={`
                      border-2 rounded flex items-center justify-center font-bold
                      transition-all duration-300 hover:scale-105 flex-1
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
                    style={{
                      aspectRatio: '1',
                      minHeight: gameState.currentWord.length > 8 ? '2rem' : '2.5rem',
                      maxHeight: gameState.currentWord.length > 8 ? '2.5rem' : '3.5rem',
                      fontSize: gameState.currentWord.length > 8 ? 'clamp(0.75rem, 3vw, 1rem)' : 'clamp(0.875rem, 4vw, 1.25rem)',
                      ...(isRevealed ? { animationDelay: `${colIndex * 100}ms` } : {})
                    }}
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
          <Card className="p-3 sm:p-4 text-center mb-3 sm:mb-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            {gameState.gameStatus === "won" ? (
              <div className="text-primary">
                <h3 className="font-bold text-base sm:text-lg animate-in zoom-in-50 duration-300">Congratulations!</h3>
                <p className="animate-in fade-in-50 delay-200 text-sm sm:text-base">
                  You guessed the word: <strong>{gameState.currentWord}</strong>
                </p>
              </div>
            ) : (
              <div className="text-destructive">
                <h3 className="font-bold text-base sm:text-lg animate-in zoom-in-50 duration-300">Game Over</h3>
                <p className="animate-in fade-in-50 delay-200 text-sm sm:text-base">
                  The word was: <strong>{gameState.currentWord}</strong>
                </p>
              </div>
            )}
            
            {/* Medical Insight - Show only after game is over */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in-50 delay-300">
              <h4 className="font-semibold text-sm sm:text-base mb-3 text-blue-800 flex items-center gap-2">
                <span className="text-lg">📚</span>
                Medical Insight
              </h4>
              <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
                {gameState.currentEducational || aiEducationalContent || `"${gameState.currentWord}" is an important medical term in the ${gameState.selectedSystem?.replace(/([A-Z])/g, " $1").trim().toLowerCase()} system. Understanding medical terminology is crucial for healthcare professionals and students.`}
              </p>
            </div>
            
            <div className="flex gap-2 justify-center mt-4">
              <Button onClick={() => startNewGame(gameState.selectedSystem!)} className="hover:scale-105 transition-transform duration-200 animate-in fade-in-50 delay-300 text-sm">
                Play Again
              </Button>
              <Button variant="outline" onClick={shareResults} className="hover:scale-105 transition-transform duration-200 animate-in fade-in-50 delay-300 bg-transparent text-sm">
                <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Share
              </Button>
            </div>
          </Card>
        )}

        {/* Virtual Keyboard */}
        <div className="space-y-1 sm:space-y-2 w-full px-2">
          {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 sm:gap-1.5 justify-center w-full max-w-lg mx-auto">
              {rowIndex === 2 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleKeyPress("ENTER")} 
                  className={`px-2 sm:px-3 hover:scale-105 transition-all duration-200 text-xs font-bold ${
                    gameState.currentGuess.length === gameState.currentWord.length && gameState.gameStatus === "playing"
                      ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                      : ""
                  }`}
                  style={{
                    minWidth: '3.5rem',
                    height: '2.75rem'
                  }}
                >
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
                      p-0 text-xs font-bold transition-all duration-200 hover:scale-110 flex-1
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
                    style={{
                      height: '2.75rem',
                      minWidth: '2rem'
                    }}
                  >
                    {letter}
                  </Button>
                )
              })}
              {rowIndex === 2 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleKeyPress("BACKSPACE")} 
                  className="px-2 sm:px-3 hover:scale-105 transition-all duration-200 text-xs font-bold bg-red-50 hover:bg-red-100 border-red-200"
                  style={{
                    minWidth: '3.5rem',
                    height: '2.75rem'
                  }}
                  title="Delete letter"
                >
                  DEL
                </Button>
              )}
            </div>
          ))}
        </div>
        
        {/* Copyright */}
        <div className="mt-8 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            © 2024 Docdle. Educational medical word game.
          </p>
        </div>
      </div>
    </div>
  )
}
