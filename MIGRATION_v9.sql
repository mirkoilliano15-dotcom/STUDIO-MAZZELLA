-- ═══════════════════════════════════════════════
-- Studio Mazzella v9 — Migration SQL
-- Eseguire in Supabase SQL Editor
-- ═══════════════════════════════════════════════

-- Tabella note per cliente (diario)
CREATE TABLE IF NOT EXISTS note_clienti (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id   UUID REFERENCES clienti(id) ON DELETE CASCADE,
  testo        TEXT NOT NULL,
  tipo         TEXT DEFAULT 'nota', -- nota | chiamata | incontro | documento | urgente
  data         TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index per performance
CREATE INDEX IF NOT EXISTS note_clienti_cliente_idx ON note_clienti(cliente_id);
CREATE INDEX IF NOT EXISTS note_clienti_data_idx ON note_clienti(data DESC);

-- RLS (Row Level Security) - opzionale ma consigliato
ALTER TABLE note_clienti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesso autenticato" ON note_clienti
  FOR ALL USING (auth.role() = 'authenticated');
