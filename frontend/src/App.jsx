import { useState } from 'react'
import { ChartBarIcon, LinkIcon, ClipboardDocumentCheckIcon, ClipboardIcon } from '@heroicons/react/24/outline'

function App() {
  const [activeTab, setActiveTab] = useState('shorten') // 'shorten' or 'stats'
  
  // State for Shortener
  const [longUrl, setLongUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  
  // State for Stats
  const [statsCode, setStatsCode] = useState('')
  const [statsData, setStatsData] = useState(null)
  
  // Common State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // --- HANDLERS ---

  const handleShorten = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setShortUrl(''); setCopied(false)

    try {
      const response = await fetch('http://localhost:8000/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: longUrl,
          custom_alias: customAlias.trim() || null // Send null if empty
        }),
      })

      const data = await response.json()
      
      if (!response.ok) throw new Error(data.detail || 'Failed to shorten')
      setShortUrl(data.short_url)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckStats = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setStatsData(null)

    // Extract code from URL if user pastes full link (e.g. http://localhost:8000/abc -> abc)
    const code = statsCode.split('/').pop()

    try {
      const response = await fetch(`http://localhost:8000/stats/${code}`)
      if (!response.ok) throw new Error('Link not found')
      
      const data = await response.json()
      setStatsData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-700">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            NanoLink
          </h1>
          <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest font-semibold">
            Advanced URL Analytics
          </p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-900 rounded-xl mb-6">
          <button
            onClick={() => {setActiveTab('shorten'); setError('')}}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'shorten' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Create Link
          </button>
          <button
            onClick={() => {setActiveTab('stats'); setError('')}}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'stats' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Check Stats
          </button>
        </div>

        {/* --- TAB 1: SHORTEN --- */}
        {activeTab === 'shorten' && (
          <form onSubmit={handleShorten} className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs text-slate-400 ml-1">Long URL</label>
              <input
                type="url" required placeholder="https://example.com/very-long-url"
                className="w-full p-3 mt-1 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none transition-all"
                value={longUrl} onChange={(e) => setLongUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 ml-1">Custom Alias (Optional)</label>
              <div className="flex items-center mt-1">
                <span className="p-3 bg-slate-700 border border-slate-600 border-r-0 rounded-l-lg text-slate-400 text-sm">
                  /
                </span>
                <input
                  type="text" placeholder="my-custom-name"
                  className="w-full p-3 rounded-r-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none transition-all"
                  value={customAlias} onChange={(e) => setCustomAlias(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              {loading ? 'Creating...' : 'Shorten Now'}
            </button>

            {/* Success Result */}
            {shortUrl && (
              <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-green-500/30">
                <div className="flex items-center justify-between">
                  <a href={shortUrl} target="_blank" rel="noreferrer" className="text-green-400 font-mono hover:underline truncate mr-2">
                    {shortUrl}
                  </a>
                  <button type="button" onClick={handleCopy} className="text-slate-400 hover:text-white transition-colors">
                    {copied ? <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-500"/> : <ClipboardIcon className="h-5 w-5"/>}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* --- TAB 2: STATS --- */}
        {activeTab === 'stats' && (
          <form onSubmit={handleCheckStats} className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs text-slate-400 ml-1">Enter Short Code or Full Link</label>
              <input
                type="text" required placeholder="e.g. FXsk or my-link"
                className="w-full p-3 mt-1 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none transition-all"
                value={statsCode} onChange={(e) => setStatsCode(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              {loading ? 'Checking...' : 'View Analytics'}
            </button>

            {/* Stats Result */}
            {statsData && (
              <div className="mt-6 p-5 bg-slate-900 rounded-xl border border-purple-500/30">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400 text-sm">Total Clicks</span>
                  <span className="text-3xl font-bold text-purple-400">{statsData.total_clicks}</span>
                </div>
                <div className="border-t border-slate-700 pt-3">
                  <p className="text-xs text-slate-500 mb-1">Original Destination:</p>
                  <p className="text-slate-300 text-sm truncate">{statsData.original_url}</p>
                  <p className="text-xs text-slate-500 mt-2">Created: {new Date(statsData.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Global Error */}
        {error && <div className="mt-4 p-3 bg-red-900/50 text-red-200 rounded-lg text-sm text-center">{error}</div>}
      
      </div>
    </div>
  )
}

export default App