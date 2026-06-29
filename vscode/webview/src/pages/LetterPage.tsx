import { useState } from "react"
import type { LetterResponse } from "@shared/types"

export default function LetterPage() {
  const [text, setText] = useState("")
  const [response, setResponse] = useState<LetterResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!text.trim()) return

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const res = await fetch("http://localhost:5000/api/letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      const data: LetterResponse = await res.json()
      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col p-6">
      <h1 className="mb-6 text-xl font-bold">Letter API</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter your text here..."
        rows={10}
        className="w-full resize-none rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-3 text-sm text-[#e6edf3] placeholder-[#8b949e] outline-none transition-colors focus:border-[#58a6ff]"
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !text.trim()}
        className="mt-4 self-start rounded-lg bg-[#238636] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>

      {error && (
        <div className="mt-4 rounded-lg border border-[#f85149]/30 bg-[#f85149]/10 p-3 text-sm text-[#f85149]">
          {error}
        </div>
      )}

      {response && (
        <div className="mt-4 rounded-lg border border-[#30363d] bg-[#161b22] p-4">
          <h2 className="mb-2 text-sm font-semibold text-[#8b949e]">Response</h2>
          <pre className="overflow-x-auto text-sm text-[#e6edf3]">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
