import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

/**
 * Chiama l'API Anthropic (Claude) direttamente dal browser.
 * Richiede VITE_ANTHROPIC_API_KEY nel file .env.local
 */
export async function askClaude(prompt, system = '') {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!key) return '❌ Chiave Anthropic mancante. Aggiungi VITE_ANTHROPIC_API_KEY nel file .env.local'

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: system || 'Sei un assistente fiscale italiano professionale.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!r.ok) {
      const e = await r.json().catch(() => ({}))
      const msg = e?.error?.message || ''
      if (r.status === 401) return '❌ Chiave API non valida. Verifica VITE_ANTHROPIC_API_KEY nel .env.local'
      if (r.status === 429) return '❌ Limite richieste raggiunto. Riprova tra qualche secondo.'
      return `❌ Errore ${r.status}: ${msg || 'risposta non valida'}`
    }

    const d = await r.json()
    return d.content?.[0]?.text || '❌ Risposta vuota dal modello.'
  } catch (err) {
    return `❌ Errore di rete: ${err.message}. Controlla la connessione.`
  }
}

// Alias per compatibilità con il vecchio nome
export const askGemini = askClaude
