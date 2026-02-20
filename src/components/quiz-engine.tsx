"use client"

import { useState, useTransition } from "react"
import { submitQuizAttempt } from "@/app/actions/quizzes"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronRight, Loader2, Trophy, XCircle } from "lucide-react"
import Link from "next/link"
import confetti from "canvas-confetti"

type Option = { id: string; text: string }

type Question = {
    id: string
    text: string
    optionsJson: string
    order: number
}

interface QuizEngineProps {
    quizId: string
    title: string
    description?: string | null
    questions: Question[]
    backUrl: string
}

export function QuizEngine({ quizId, title, description, questions, backUrl }: QuizEngineProps) {
    const [currentStep, setCurrentStep] = useState(-1) // -1 is intro
    const [answers, setAnswers] = useState<Record<string, string>>({}) // questionId -> optionId
    const [isPending, startTransition] = useTransition()
    const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)

    const questionLimit = questions.length
    const currentQuestion = currentStep >= 0 && currentStep < questionLimit ? questions[currentStep] : null
    const options: Option[] = currentQuestion ? JSON.parse(currentQuestion.optionsJson) : []

    const handleSelectOption = (optionId: string) => {
        if (!currentQuestion) return
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }))
    }

    const handleNext = () => {
        if (currentStep < questionLimit - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            handleSubmit()
        }
    }

    const handleSubmit = () => {
        startTransition(async () => {
            const answerPayload = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
                questionId, selectedOptionId
            }))

            const res = await submitQuizAttempt({ quizId, answers: answerPayload })
            if (res.success && res.score !== undefined) {
                setResult({ score: res.score, passed: !!res.passed })
                if (res.passed) {
                    triggerConfetti()
                }
            } else {
                alert("Ocorreu um erro ao enviar o quiz.")
            }
        })
    }

    const triggerConfetti = () => {
        const duration = 3000
        const end = Date.now() + duration

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ["#ff6a1a", "#ffffff"]
            })
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ["#ff6a1a", "#ffffff"]
            })

            if (Date.now() < end) {
                requestAnimationFrame(frame)
            }
        }
        frame()
    }

    if (result) {
        return (
            <div className="flex flex-col items-center text-center max-w-lg mx-auto p-8 border border-white/10 rounded-2xl bg-[#09090b] shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl border-4 ${result.passed ? "border-[#ff6a1a] bg-[#ff6a1a]/10" : "border-red-500 bg-red-500/10"}`}>
                    {result.passed ? <Trophy className="text-[#ff6a1a]" size={40} /> : <XCircle className="text-red-500" size={40} />}
                </div>

                <h2 className="text-3xl font-black text-white mb-2">
                    {result.passed ? "Parabéns!" : "Não foi dessa vez..."}
                </h2>
                <p className="text-zinc-400 mb-6">
                    {result.passed ? "Você atingiu a pontuação necessária e passou neste teste." : "Você não alcançou a nota mínima (70%). Revise o conteúdo e tente novamente."}
                </p>

                <div className="text-5xl font-black text-white mb-8 bg-black/40 px-8 py-4 rounded-xl border border-white/5">
                    {result.score}%
                </div>

                <div className="flex gap-4 w-full">
                    {!result.passed && (
                        <Button
                            onClick={() => {
                                setAnswers({})
                                setCurrentStep(-1)
                                setResult(null)
                            }}
                            variant="outline"
                            className="flex-1 border-[#ff6a1a]/40 bg-[#ff6a1a]/5 text-[#ff6a1a] hover:bg-[#ff6a1a]/10 h-12 font-bold"
                        >
                            Tentar Novamente
                        </Button>
                    )}
                    <Button asChild className="flex-1 bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 h-12 font-bold shadow-lg shadow-[#ff6a1a]/20">
                        <Link href={backUrl}>Voltar para Aula</Link>
                    </Button>
                </div>
            </div>
        )
    }

    if (currentStep === -1) {
        return (
            <div className="max-w-2xl mx-auto p-1 border border-white/5 rounded-3xl bg-gradient-to-b from-[#ff6a1a]/10 to-transparent">
                <div className="bg-[#09090b] rounded-[22px] p-8 md:p-12 text-center h-full">
                    <div className="w-16 h-16 rounded-full bg-[#ff6a1a]/10 flex items-center justify-center mx-auto mb-6">
                        <Trophy className="text-[#ff6a1a]" size={32} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">{title}</h1>
                    <p className="text-zinc-400 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                        {description || "Responda as perguntas a seguir para testar seus conhecimentos e liberar os próximos conteúdos."}
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-10 text-sm font-medium text-zinc-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-[#ff6a1a]" />
                            {questions.length} Perguntas
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-[#ff6a1a]" />
                            Nota Mínima: 70%
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <Button asChild variant="ghost" className="text-zinc-400 hover:text-white h-14 px-8">
                            <Link href={backUrl}>Voltar</Link>
                        </Button>
                        <Button
                            onClick={() => setCurrentStep(0)}
                            className="bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 h-14 px-10 text-lg font-bold shadow-lg shadow-[#ff6a1a]/25 transition-transform hover:scale-105"
                        >
                            Começar Teste
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (!currentQuestion) return null

    const hasAnsweredCurrent = !!answers[currentQuestion.id]
    const progress = Math.round(((currentStep) / questionLimit) * 100)

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-10 w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                    className="h-full bg-[#ff6a1a] transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="mb-6 flex items-center justify-between text-zinc-500 font-bold uppercase tracking-widest text-xs">
                <span>Pergunta {currentStep + 1} de {questionLimit}</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-10 leading-snug">
                {currentQuestion.text}
            </h2>

            <div className="space-y-3 mb-12">
                {options.map((opt) => {
                    const isSelected = answers[currentQuestion.id] === opt.id
                    return (
                        <button
                            key={opt.id}
                            onClick={() => handleSelectOption(opt.id)}
                            className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center justify-between group ${isSelected
                                    ? "border-[#ff6a1a] bg-[#ff6a1a]/5 shadow-[0_0_15px_rgba(255,106,26,0.1)]"
                                    : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                                }`}
                        >
                            <span className={`text-base font-medium ${isSelected ? "text-white" : "text-zinc-300 group-hover:text-white"}`}>
                                {opt.text}
                            </span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "border-[#ff6a1a] bg-[#ff6a1a]" : "border-zinc-600"
                                }`}>
                                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                        </button>
                    )
                })}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-white/10">
                <Button
                    variant="ghost"
                    className="text-zinc-400 hover:text-white font-medium"
                    onClick={() => currentStep > 0 && setCurrentStep(prev => prev - 1)}
                    disabled={currentStep === 0 || isPending}
                >
                    Anterior
                </Button>

                <Button
                    onClick={handleNext}
                    disabled={!hasAnsweredCurrent || isPending}
                    className="bg-white text-black hover:bg-zinc-200 h-12 px-8 font-bold gap-2"
                >
                    {isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            {currentStep === questionLimit - 1 ? "Finalizar" : "Próxima"}
                            <ChevronRight className="w-4 h-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
