import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Trash2, Sparkles } from 'lucide-react'
import { askClaude } from '../lib/supabase'

const SYSTEM = `Sei Lex, l'assistente AI dello Studio Mazzella, studio di commercialisti italiani.
Sei esperto in: rateizzazioni AdE, rottamazioni quinquies/quater, IVA, IRPEF, IRES, IMU, scadenze fiscali italiane, pratiche e adempimenti.
Rispondi sempre in italiano, in modo professionale ma chiaro e conciso. Max 3-4 paragrafi.`

const QUICK = ['Scadenze IRPEF 2025', 'Requisiti rottamazione', 'Rate AdE decadenza', 'IMU prima casa']

export default function LexAI() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([{
    role: 'ai',
    text: 'Ciao! Sono **Lex**, il tuo assistente fiscale.\nChiedimi qualcosa su rateizzazioni, rottamazioni, scadenze o adempimenti fiscali.',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function send(q) {
    const text = (q || input).trim()
    if (!text || loading) return
    setInput('')
    setMsgs(m => [...m, { role: 'user', text }])
    setLoading(true)
    const risposta = await askClaude(text, SYSTEM)
    setMsgs(m => [...m, { role: 'ai', text: risposta }])
    setLoading(false)
  }

  function renderText(t) {
    return t.split('\n').map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return <p key={i} style={{ margin: i > 0 && line ? '6px 0 0' : 0 }} dangerouslySetInnerHTML={{ __html: bold || '&nbsp;' }} />
    })
  }

  return (
    <>
      {/* Toggle */}
      <button onClick={() => setOpen(!open)} style={{
        position: 'fixed', right: 22, bottom: 22,
        width: 50, height: 50, borderRadius: '50%',
        background: open
          ? 'var(--bg)'
          : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        border: open ? '1.5px solid var(--border2)' : 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50,
        boxShadow: open ? '0 2px 8px rgba(30,58,138,0.1)' : '0 6px 20px rgba(37,99,235,0.4), 0 2px 8px rgba(37,99,235,0.2)',
        transition: 'all .2s',
        color: open ? 'var(--text2)' : '#ffffff',
      }}>
        {open ? <X size={18} /> : <Bot size={20} />}
      </button>

      {open && (
        <div style={{
          position: 'fixed', right: 22, bottom: 84,
          width: 360, height: 490,
          background: 'var(--bg)',
          border: '1.5px solid var(--border2)',
          borderRadius: 20, zIndex: 49,
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp .2s cubic-bezier(.16,1,.3,1)',
          boxShadow: '0 24px 64px rgba(13,27,46,0.16)',
        }}>
          {/* Header */}
          <div style={{ padding: '13px 16px', borderBottom: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg2)', borderRadius: '18px 18px 0 0' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            }}>
              <Sparkles size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 750, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Lex AI</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>Assistente Fiscale · Claude AI</div>
            </div>
            <button onClick={() => setMsgs([{ role: 'ai', text: 'Ciao! Come posso aiutarti?' }])} title="Nuova chat"
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', borderRadius: 7, padding: 5, transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text3)' }}>
              <Trash2 size={13} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 13px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'ai' && (
                  <div style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: 'var(--accent-dim)', border: '1.5px solid var(--accent-glow)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginRight: 8, marginTop: 2,
                  }}>
                    <Bot size={12} color="var(--accent2)" />
                  </div>
                )}
                <div style={{
                  maxWidth: '82%', padding: '9px 13px',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, #1e3a8a, #2563eb)'
                    : 'var(--bg2)',
                  color: m.role === 'user' ? '#ffffff' : 'var(--text2)',
                  fontSize: 13, lineHeight: 1.55,
                  fontWeight: m.role === 'user' ? 500 : 400,
                  border: m.role === 'ai' ? '1.5px solid var(--border)' : 'none',
                  wordBreak: 'break-word',
                  boxShadow: m.role === 'user' ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                }}>
                  {m.role === 'ai' ? renderText(m.text) : m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--accent-dim)', border: '1.5px solid var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={12} color="var(--accent2)" />
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '4px 14px 14px 14px', background: 'var(--bg2)', border: '1.5px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent2)', display: 'inline-block', animation: `bounce .9s ${i * .2}s infinite ease-in-out` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {msgs.length <= 1 && (
            <div style={{ padding: '0 13px 8px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {QUICK.map(q => (
                <button key={q} onClick={() => send(q)} style={{
                  padding: '5px 11px', borderRadius: 20,
                  background: 'var(--bg2)', border: '1.5px solid var(--border)',
                  cursor: 'pointer', fontSize: 11, color: 'var(--text3)',
                  fontFamily: 'inherit', transition: 'all .15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-glow)'; e.currentTarget.style.color = 'var(--accent2)'; e.currentTarget.style.background = 'var(--accent-dim)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'var(--bg2)' }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1.5px solid var(--border)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Chiedi qualcosa..."
              style={{
                flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)',
                borderRadius: 10, padding: '8px 12px', color: 'var(--text1)',
                fontSize: 13, outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent2)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            <button onClick={() => send()} disabled={!input.trim() || loading} style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: input.trim() ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : 'var(--bg3)',
              border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
              boxShadow: input.trim() ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
            }}>
              <Send size={14} color={input.trim() ? '#ffffff' : 'var(--text4)'} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
