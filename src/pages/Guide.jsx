import { useState } from 'react'
import { BookOpen, Search, X, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info, Clock, FileText } from 'lucide-react'

const GUIDE = [
  {
    cat: 'Rateizzazioni AdE',
    color: '#60a5fa',
    icon: '📋',
    voci: [
      {
        titolo: 'Come richiedere una rateizzazione AdE',
        tags: ['rateizzazione', 'R1', 'R2', 'cartella', 'ade', 'riscossione'],
        passi: [
          { t: 'info', testo: 'La rateizzazione dilaziona il pagamento di cartelle esattoriali fino a 72 rate mensili (ordinaria) o 120 rate (straordinaria con comprovato disagio economico).' },
          { t: 'step', n: 1, testo: 'Verificare l\'importo della cartella: soglia minima €100. Controllare che non ci siano rateizzazioni precedenti decadute sulla stessa cartella.' },
          { t: 'step', n: 2, testo: 'Accedere al portale riscossione.gov.it con SPID, CIE o CNS del contribuente.' },
          { t: 'step', n: 3, testo: 'Entrare in "I miei debiti" → "Rateizza i tuoi debiti" → selezionare le cartelle da includere.' },
          { t: 'step', n: 4, testo: 'Scegliere il modulo: R1 (fino a €120.000 — semplificata, nessun documento reddituale richiesto). R2 (oltre €120.000 — straordinaria, serve ISEE aggiornato o documentazione reddituale).' },
          { t: 'step', n: 5, testo: 'Indicare il numero di rate desiderato. Il sistema calcola automaticamente l\'importo di ogni rata con gli interessi (tasso legale + 2%).' },
          { t: 'step', n: 6, testo: 'Confermare e scaricare il piano di ammortamento. Il primo bollettino è scaricabile immediatamente.' },
          { t: 'step', n: 7, testo: 'Inserire scadenza nel calendario per la 10ª rata — al mancato pagamento della 10ª si avvicina la soglia di decadenza. Aggiungere promemoria mensile per le scadenze.' },
          { t: 'warn', testo: 'DECADENZA: si perde la rateizzazione saltando 8 rate (anche non consecutive) per piani fino al 2025. Dal 2026 la soglia scende a 5 rate. Il debito torna esigibile per intero con interessi e sanzioni.' },
          { t: 'ok', testo: 'Le rate scadono il giorno 28 di ogni mese. Consigliare al cliente un addebito automatico se disponibile sul portale.' },
        ]
      },
      {
        titolo: 'Gestire la decadenza da rateizzazione',
        tags: ['decadenza', 'rimessa in termini', 'nuova rateizzazione'],
        passi: [
          { t: 'warn', testo: 'Il cliente è decaduto quando ha superato il numero massimo di rate non pagate. Il debito torna esigibile immediatamente e possono ripartire pignoramenti/fermi.' },
          { t: 'step', n: 1, testo: 'Verificare la data di decadenza accedendo al portale AdE Riscossione con le credenziali del cliente. Controllare la sezione "Piano di rateizzazione".' },
          { t: 'step', n: 2, testo: 'Verificare se il debito rientra in una sanatoria attiva (rottamazione, saldo e stralcio). Se sì, la rottamazione è preferibile alla nuova rateizzazione.' },
          { t: 'step', n: 3, testo: 'In assenza di sanatorie: richiedere una NUOVA rateizzazione per l\'importo residuo (capitale + interessi maturati). La precedente decadenza non impedisce di fare una nuova domanda.' },
          { t: 'step', n: 4, testo: 'Per accedere al piano a 120 rate (straordinaria): allegare ISEE recente che dimostri il disagio economico, o bilancio aziendale in perdita per le società.' },
          { t: 'ok', testo: 'Dal 2022: chi decade può chiedere una nuova dilazione, ma solo dopo aver saldato integralmente le rate non pagate al momento della nuova domanda.' },
        ]
      },
      {
        titolo: 'Rateizzazione: FAQ clienti',
        tags: ['faq', 'interessi', 'importo rata', 'domande frequenti'],
        passi: [
          { t: 'info', testo: 'D: Posso rateizzare anche se ho già una rateizzazione in corso?\nR: Sì, ma solo se il nuovo debito è su cartelle diverse. Non si può rateizzare due volte la stessa cartella.' },
          { t: 'info', testo: 'D: Quanto costano gli interessi?\nR: Tasso di interesse pari al tasso legale vigente + 2 punti percentuali, calcolato sul capitale residuo. Es. con tasso legale 2,5%: si paga il 4,5% annuo.' },
          { t: 'info', testo: 'D: Posso pagare in anticipo?\nR: Sì, in qualsiasi momento è possibile pagare rate anticipate o estinguere il debito residuo senza penali.' },
          { t: 'info', testo: 'D: Il fermo auto viene tolto con la rateizzazione?\nR: Sì, presentando il piano di rateizzazione all\'AdE Riscossione si può richiedere la sospensione del fermo. Non è automatico: serve richiesta esplicita.' },
          { t: 'warn', testo: 'D: Cosa succede se un mese non riesco a pagare?\nR: Contattare immediatamente lo studio. Fino alla soglia di decadenza (8 rate) il piano è ancora valido. Oltre: si decade definitivamente.' },
        ]
      },
    ]
  },
  {
    cat: 'Rottamazione Cartelle',
    color: '#34d399',
    icon: '🗂️',
    voci: [
      {
        titolo: 'Rottamazione Quinquies: procedura completa',
        tags: ['rottamazione', 'quinquies', 'DA-Q', 'cartelle', 'sanzioni'],
        passi: [
          { t: 'info', testo: 'La Rottamazione-quinquies (L. 143/2024) permette di definire i debiti con AdE Riscossione pagando solo il capitale e gli interessi originari — stralcio totale di sanzioni, interessi di mora e aggio.' },
          { t: 'step', n: 1, testo: 'VERIFICA AMMISSIBILITÀ: le cartelle devono essere state affidate all\'AdE Riscossione tra il 1/1/2000 e il 31/12/2023. Controllare le date di affidamento nel portale.' },
          { t: 'step', n: 2, testo: 'CARTELLE ESCLUSE: contributi INPS/INAIL/casse previdenziali, recupero aiuti di Stato, dazi doganali, crediti da sentenze penali, IVA all\'importazione. Verificare ogni cartella.' },
          { t: 'step', n: 3, testo: 'PROSPETTO INFORMATIVO: richiedere sul portale riscossione.gov.it nella sezione Rottamazione → "Prospetto informativo". Scaricare il PDF con l\'elenco completo delle cartelle aderibili e i relativi importi.' },
          { t: 'step', n: 4, testo: 'Analizzare il prospetto: colonna "Importo da pagare con definizione agevolata" = quanto pagherà il cliente. Confrontare con "Importo totale dovuto" per calcolare il risparmio effettivo.' },
          { t: 'step', n: 5, testo: 'COMPILAZIONE MODULO DA-Q: elencare tutte le cartelle da includere con il numero identificativo. Possibile includere tutte le cartelle o solo alcune.' },
          { t: 'step', n: 6, testo: 'INVIO DOMANDA: tramite portale web (metodo preferibile, ricevuta immediata), app EquiClick, PEC a sportello.riscossione@pec.agenziaentrateriscossione.gov.it, o uffici territoriali AdE Riscossione.' },
          { t: 'step', n: 7, testo: 'COMUNICAZIONE ESITO: entro 30 giorni dalla scadenza delle domande, l\'AdE invia la comunicazione con l\'importo dovuto, le scadenze delle rate e i moduli F24/bollettini.' },
          { t: 'step', n: 8, testo: 'PIANO RATE: prima rata entro 31 luglio, seconda entro 30 novembre dell\'anno di adesione, poi bimestrali (28 febbraio, 31 maggio, 31 luglio, 30 novembre) fino a max 10 rate totali.' },
          { t: 'warn', testo: 'DECADENZA TOTALE: anche UNA SOLA rata non pagata entro 5 giorni dalla scadenza comporta la perdita del beneficio. Il debito originario torna esigibile per intero, compresi sanzioni e interessi.' },
          { t: 'ok', testo: 'EFFETTI POSITIVI IMMEDIATI: dalla data di presentazione della domanda sono sospesi pignoramenti attivi, fermi amministrativi e ipoteche sulle cartelle incluse. Richiedere sospensione esplicitamente se ci sono procedure in corso.' },
        ]
      },
      {
        titolo: 'Quinquies vs Quater: differenze pratiche',
        tags: ['quater', 'quinquies', 'confronto', 'chi può aderire'],
        passi: [
          { t: 'info', testo: 'QUATER (L. 197/2022): cartelle affidate 1/1/2000–30/6/2022. Domande presentate nel 2023. Pagamento ancora in corso per molti clienti.' },
          { t: 'info', testo: 'QUINQUIES (L. 143/2024): cartelle affidate 1/1/2000–31/12/2023. Finestra ampliata di 18 mesi rispetto alla Quater — include debiti 2022-2023 mai rottamati.' },
          { t: 'warn', testo: 'ATTENZIONE — Chi è in Quater e ha decaduto: le cartelle per cui si è verificata la decadenza NON possono entrare nella Quinquies. Il beneficio è perso definitivamente su quelle cartelle.' },
          { t: 'ok', testo: 'Chi è in Quater e sta pagando regolarmente: le cartelle già in Quater rimangono lì. La Quinquies può coprire le cartelle aggiuntive (2022-2023) mai incluse nella Quater.' },
          { t: 'step', n: 1, testo: 'Azione pratica per ogni cliente con Quater in corso: (1) verificare stato pagamenti Quater, (2) estrarre lista cartelle 2022-2023 non incluse, (3) valutare convenienza Quinquies su quelle cartelle aggiuntive.' },
          { t: 'step', n: 2, testo: 'Calcolo risparmio Quinquies: dal prospetto informativo sottrarre "Importo da pagare con Quinquies" da "Totale dovuto senza definizione". La differenza è il risparmio netto (sanzioni + more stralciate).' },
        ]
      },
    ]
  },
  {
    cat: 'Dichiarazioni e Imposte',
    color: 'var(--amber2)',
    icon: '📄',
    voci: [
      {
        titolo: 'Checklist documenti 730 / Redditi PF',
        tags: ['730', 'redditi', 'irpef', 'documenti', 'detrazioni'],
        passi: [
          { t: 'info', testo: 'Raccogliere tutti i documenti PRIMA dell\'appuntamento col cliente. La lista è divisa per categoria.' },
          { t: 'step', n: 1, testo: 'SEMPRE NECESSARI: CU da tutti i datori di lavoro / pensione INPS, documento identità valido + codice fiscale, dichiarazione anno precedente (per riporto crediti e dati immobili).' },
          { t: 'step', n: 2, testo: 'REDDITI DA LAVORO/PENSIONE: CU lavoro dipendente, CU pensione, CU indennità disoccupazione (NASPI), CU maternità, indennità INAIL.' },
          { t: 'step', n: 3, testo: 'IMMOBILI: rendite catastali da visura (o da 730 prec.), contratti di locazione attivi con canoni percepiti, dati IMU pagata, spese condominiali straordinarie per bonus edilizi.' },
          { t: 'step', n: 4, testo: 'SPESE SANITARIE (detrazione 19% sulla parte eccedente €129,11): scontrini farmacia con CF, fatture medici/specialisti, ticket SSN, fatture dentista, spese per disabili (100% senza franchigia), spese per occhiali/lenti (€129,11 max per scontrino parlante).' },
          { t: 'step', n: 5, testo: 'MUTUO PRIMA CASA: CU dalla banca con interessi passivi pagati nell\'anno, rogito notarile (solo primo anno), contratto mutuo. Detrazione max €4.000 interessi.' },
          { t: 'step', n: 6, testo: 'RISTRUTTURAZIONI: SAL o comunicazione fine lavori al Comune, bonifici "parlanti" (con codice fiscale committente + P.IVA ditta), fatture/ricevute, visura catastale immobile. Identificare codice intervento: 50% ordinaria, 65% risparmio energetico, 110% superbonus (in esaurimento).' },
          { t: 'step', n: 7, testo: 'ISTRUZIONE: tasse universitarie statali (detrazione 19%), rette asilo nido (detrazione 19% max €632 per figlio), scuole paritarie (max €800), master/corsi post-laurea.' },
          { t: 'step', n: 8, testo: 'ASSICURAZIONI: polizze vita/infortuni (max €530 detrazione 19%), polizze rischio non autosufficienza (max €1.291). Servono quietanze di pagamento.' },
          { t: 'warn', testo: 'SCADENZE 2025: 730 precompilato — invio entro 30 settembre. Redditi PF cartacea entro 31 ottobre. Redditi PF telematica entro 30 novembre. Tardiva (entro 90 gg): sanzione 0,1% per giorno fino a max 1%.' },
        ]
      },
      {
        titolo: 'Calendario scadenze fiscali principali',
        tags: ['scadenze', 'calendario', 'f24', 'iva', 'irpef', 'imu', 'unico'],
        passi: [
          { t: 'info', testo: 'Scadenze ricorrenti da inserire nel calendario ogni anno. Le date esatte variano se cadono di sabato/domenica (slittano al lunedì successivo).' },
          { t: 'step', n: 1, testo: 'GENNAIO: 16/01 versamento IVA 4° trim. anno prec. con maggiorazione 1% (contribuenti trimestrali). 31/01 CU trasmissione telematica all\'AdE (datori di lavoro).' },
          { t: 'step', n: 2, testo: 'FEBBRAIO: 28/02 CU consegna al dipendente/pensionato. Ravvedimento operoso F24 omessi versamenti mese prec.' },
          { t: 'step', n: 3, testo: 'MARZO: 16/03 versamento IVA annuale (contribuenti trimestrali speciali). 31/03 presentazione dichiarazione IVA annuale (modello IVA).' },
          { t: 'step', n: 4, testo: 'APRILE: 30/04 invio dichiarazioni IVA (ultima data). Liquidazione IVA 1° trimestre entro 16/05.' },
          { t: 'step', n: 5, testo: 'MAGGIO: 16/05 versamento IVA 1° trimestre. Inizio campagna 730 precompilato (dal 1° maggio accesso CAF/professionisti).' },
          { t: 'step', n: 6, testo: 'GIUGNO: 16/06 saldo IRPEF + acconto IRPEF 1ª rata (da Unico/730). 16/06 IMU prima scadenza (acconto). 30/06 730 ordinario (termine CAF).' },
          { t: 'step', n: 7, testo: 'LUGLIO: 31/07 proroga versamenti IRPEF per autonomi con maggiorazione 0,4%. 16/07 versamento IVA 2° trimestre (trim. con rimborso).' },
          { t: 'step', n: 8, testo: 'AGOSTO: 20/08 versamenti con scadenza 16/08 prorogati al 20 agosto. Liquidazione IVA 2° trimestre: entro 16/08 (o 20/08 senza magg.).' },
          { t: 'step', n: 9, testo: 'SETTEMBRE: 30/09 730 precompilato termine finale invio. 16/09 versamento IVA se prorogato da agosto.' },
          { t: 'step', n: 10, testo: 'OTTOBRE: 16/10 acconto IRAP/IRES per società. 31/10 Redditi PF cartacea. Liquidazione IVA 3° trimestre entro 16/11.' },
          { t: 'step', n: 11, testo: 'NOVEMBRE: 30/11 Redditi PF telematica, saldo IRPEF 2ª rata + acconto IRPEF 2ª rata. 16/12 IMU saldo (seconda scadenza annuale).' },
          { t: 'step', n: 12, testo: 'DICEMBRE: 16/12 IMU saldo. 27/12 acconto IVA dicembre (per mensili e trimestrali). 31/12 termine per ravvedimento operoso con sanzioni ridotte.' },
          { t: 'warn', testo: 'RAVVEDIMENTO OPEROSO: la sanzione minima è 0,1% per ogni giorno di ritardo (max 1% entro 14 gg), poi 1,5% entro 30 gg, 1,67% entro 90 gg, 3,75% entro 1 anno, 4,29% entro 2 anni, 5% oltre.' },
        ]
      },
    ]
  },
  {
    cat: 'Regimi Fiscali',
    color: '#a78bfa',
    icon: '⚖️',
    voci: [
      {
        titolo: 'Regime forfettario: requisiti, calcolo e convenienze',
        tags: ['forfettario', 'flat tax', 'partita iva', 'coefficiente', 'contributi'],
        passi: [
          { t: 'info', testo: 'Il regime forfettario è il regime naturale per chi inizia un\'attività con ricavi attesi sotto €85.000. Imposta sostitutiva unica del 15% (5% per i primi 5 anni di nuova attività).' },
          { t: 'step', n: 1, testo: 'REQUISITI DI ACCESSO: ricavi/compensi anno precedente ≤ €85.000; spese per lavoro dipendente/collaboratori ≤ €20.000; non partecipare in società di persone/SRL trasparenti; non applicare IVA in regimi speciali.' },
          { t: 'step', n: 2, testo: 'CAUSE DI ESCLUSIONE: residenza fiscale fuori Italia (salvo 75% redditi in IT), redditi da lavoro dipendente/assimilati > €30.000 (con stesso datore negli ultimi 2 anni), cessione fabbricati/terreni/mezzi di trasporto.' },
          { t: 'step', n: 3, testo: 'CALCOLO IMPOSTA: Reddito imponibile = Ricavi lordi × Coefficiente redditività (varia per codice ATECO). Imposta = Reddito imponibile × 15% (o 5% startup). Esempio: artigiano con ricavi €40.000, coeff. 67% → imponibile €26.800 → imposta €4.020.' },
          { t: 'step', n: 4, testo: 'COEFFICIENTI PRINCIPALI: industria/artigianato 67%, commercio al dettaglio 40%, commercio all\'ingrosso 54%, professionisti senza cassa 78%, bar/ristoranti 40%, agenti/intermediari 62%.' },
          { t: 'step', n: 5, testo: 'CONTRIBUTI INPS: gestione separata (professionisti) 26,07%; artigiani/commercianti: fissi ~€4.208/anno + aliquota sul reddito eccedente il minimale (~€18.415). Sul regime forfettario i contributi si calcolano sul reddito imponibile forfettario.' },
          { t: 'ok', testo: 'VANTAGGI: nessun obbligo di contabilità ordinaria, esenzione IVA (non si versa, non si detrae), semplificazione dichiarativa, no studi di settore/ISA.' },
          { t: 'warn', testo: 'USCITA DAL REGIME: se nell\'anno superi €85.000 di ricavi esci dal regime dall\'anno SUCCESSIVO. Se superi €100.000 esci immediatamente nell\'anno stesso — importantissimo monitorare i ricavi mensili.' },
        ]
      },
      {
        titolo: 'ISA — Indici Sintetici di Affidabilità',
        tags: ['ISA', 'studi di settore', 'affidabilità', 'voto', 'accertamento'],
        passi: [
          { t: 'info', testo: 'Gli ISA sostituiscono gli studi di settore dal 2019. Attribuiscono un punteggio da 1 a 10 al contribuente in base alla coerenza tra ricavi dichiarati e indicatori del settore.' },
          { t: 'step', n: 1, testo: 'CHI È ESCLUSO dagli ISA: forfettari e minimi, contribuenti in primo anno di attività, ricavi/compensi oltre soglia ISA, attività con cause di esclusione specifiche (liquidazione, non normale svolgimento).' },
          { t: 'step', n: 2, testo: 'PUNTEGGI E BENEFICI PREMIALI: ≥ 8: riduzione a 2 anni dei termini di accertamento; ≥ 8,5: esonero presentazione garanzia rimborsi IVA fino a €50.000; ≥ 9: esonero visto di conformità per compensazioni fino a €70.000.' },
          { t: 'step', n: 3, testo: 'COME MIGLIORARE IL PUNTEGGIO: adeguare i ricavi agli indicatori elementari (se il software ISA li evidenzia), compilare correttamente tutti i dati contabili ed extra-contabili, dichiarare ulteriori componenti positivi.' },
          { t: 'step', n: 4, testo: 'ADEGUAMENTO RICAVI: se il cliente vuole adeguarsi agli ISA per raggiungere il punteggio 8, il maggior reddito dichiarato è soggetto a IRPEF ordinaria + 10% contributi INPS. Calcolare la convenienza caso per caso.' },
          { t: 'warn', testo: 'Punteggio < 6: aumenta il rischio di accertamento. Non è automatico ma è un indicatore di rischio. Verificare sempre la correttezza dei dati inseriti prima di presentare la dichiarazione.' },
        ]
      },
    ]
  },
  {
    cat: 'IVA e Liquidazioni',
    color: '#fb923c',
    icon: '💶',
    voci: [
      {
        titolo: 'Liquidazione IVA mensile e trimestrale',
        tags: ['iva', 'liquidazione', 'f24', 'mensile', 'trimestrale', 'versamento'],
        passi: [
          { t: 'info', testo: 'I contribuenti IVA sono divisi in mensili (volume d\'affari > €400.000 per commercio/€800.000 per servizi) e trimestrali (sotto soglia, con maggiorazione interessi 1%).' },
          { t: 'step', n: 1, testo: 'LIQUIDAZIONE MENSILE: calcolo entro il mese successivo. Versamento F24 entro il 16 del mese successivo. Es: IVA gennaio → entro 16 febbraio.' },
          { t: 'step', n: 2, testo: 'LIQUIDAZIONE TRIMESTRALE — scadenze: 1° trim. (gen-mar) → entro 16 maggio; 2° trim. (apr-giu) → entro 16 agosto o 20 agosto senza maggiorazione; 3° trim. (lug-set) → entro 16 novembre; 4° trim. → in sede di dichiarazione annuale IVA (entro 16/3 o 16/6 con proroga).' },
          { t: 'step', n: 3, testo: 'MAGGIORAZIONE TRIMESTRALI: applicare 1% di interessi sull\'IVA dovuta per ogni trimestre (tranne il 4°). Es: IVA dovuta €2.000 → versare €2.020.' },
          { t: 'step', n: 4, testo: 'CODICI F24 IVA: 6001-6012 per mensili (un codice per ogni mese). 6031-6034 per trimestrali (uno per trimestre). 6099 per versamento annuale IVA.' },
          { t: 'step', n: 5, testo: 'IVA A CREDITO: se la liquidazione è a credito, non si versa nulla. Il credito si riporta al periodo successivo o si richiede a rimborso (importi > €2.582,28 annui) o si compensa con altri tributi in F24.' },
          { t: 'warn', testo: 'OMESSO VERSAMENTO IVA: sanzione 30% + interessi legali. Con ravvedimento: 3% entro 30 giorni, 3,75% entro 1 anno. L\'omesso versamento periodico IVA è reato penale oltre €250.000 annui (D.Lgs. 74/2000).' },
        ]
      },
      {
        titolo: 'Fatturazione elettronica: obbligo e gestione',
        tags: ['fattura', 'elettronica', 'SDI', 'xml', 'forfettario', 'B2B', 'B2C'],
        passi: [
          { t: 'info', testo: 'Dal 1° gennaio 2024 la fatturazione elettronica è obbligatoria per TUTTI i contribuenti IVA, compresi i forfettari e i minimi (salvo operazioni con consumatori finali non soggetti IVA in certi casi).' },
          { t: 'step', n: 1, testo: 'EMISSIONE: la fattura XML va trasmessa allo SDI (Sistema di Interscambio) entro 12 giorni dall\'operazione per fatture immediate, o entro il 15 del mese successivo per fatture differite.' },
          { t: 'step', n: 2, testo: 'CODICE DESTINATARIO: per B2B chiedere al cliente il codice destinatario (7 caratteri) o la PEC. Per privati/consumatori finali usare "0000000" e consegnare copia cartacea o PDF.' },
          { t: 'step', n: 3, testo: 'RIFIUTO FATTURA: se lo SDI la scarta (errori formali), va ricorretta e reinviata entro 5 giorni dalla notifica di scarto. Conservare sempre la ricevuta di consegna.' },
          { t: 'step', n: 4, testo: 'CONSERVAZIONE SOSTITUTIVA: le fatture elettroniche vanno conservate digitalmente per 10 anni. L\'AdE offre il servizio di conservazione gratuito sul portale "Fatture e Corrispettivi".' },
          { t: 'ok', testo: 'FORFETTARI dal 2024: obbligo di e-fattura anche per forfettari sotto €25.000. Prima erano esentati. Chi non emette e-fattura rischia sanzione dal 5% al 10% dei corrispettivi non documentati.' },
        ]
      },
    ]
  },
  {
    cat: 'IMU e Tributi Locali',
    color: '#f87171',
    icon: '🏠',
    voci: [
      {
        titolo: 'IMU: calcolo, scadenze e casi pratici',
        tags: ['imu', 'immobili', 'prima casa', 'rendita catastale', 'aliquota', 'f24'],
        passi: [
          { t: 'info', testo: 'L\'IMU (Imposta Municipale Propria) si applica al possesso di immobili, esclusa la prima casa (abitazione principale non di lusso). Dal 2020 ha assorbito la TASI.' },
          { t: 'step', n: 1, testo: 'CALCOLO BASE IMPONIBILE: Rendita catastale rivalutata del 5% × Coefficiente moltiplicatore (fabbricati cat. A ≠ A/10: ×168; cat. B: ×140; cat. C/1: ×55; cat. C/2-6: ×126; cat. D: ×65). Es: rendita €500 → base imponibile €500×1,05×168 = €88.200.' },
          { t: 'step', n: 2, testo: 'ALIQUOTA: base × aliquota deliberata dal Comune (standard 0,86%, max 1,06% per altri immobili; prima casa — se dovuta — max 0,6%). Verificare delibera comunale ogni anno su finanze.gov.it.' },
          { t: 'step', n: 3, testo: 'SCADENZE 2025: Acconto 16 giugno (50% IMU calcolata con aliquote anno precedente). Saldo 16 dicembre (conguaglio con aliquote anno corrente). Prima casa non di lusso: ESENTE da IMU.' },
          { t: 'step', n: 4, testo: 'PRIMA CASA: esente se è l\'abitazione principale del contribuente, purché non sia classificata A/1, A/8, A/9 (abitazioni di lusso). Il Comune può deliberare aliquota ridotta per prime case di lusso.' },
          { t: 'step', n: 5, testo: 'CASI PARTICOLARI: immobile locato con cedolare secca → aliquota ridotta possibile (verificare delibera). Immobile locato con canone concordato → riduzione del 25% dell\'imposta. Comodato a figli/genitori → riduzione 50% base imponibile se requisiti.' },
          { t: 'step', n: 6, testo: 'VERSAMENTO F24: codice tributo 3912 (altri immobili), 3916 (terreni), 3925 (immobili uso produttivo cat. D — quota Stato), 3930 (D — quota Comune). Anno di riferimento = anno d\'imposta.' },
          { t: 'warn', testo: 'RAVVEDIMENTO IMU: omesso versamento entro scadenza → sanzione 30%. Con ravvedimento operoso entro 90 giorni: sanzione ridotta al 3% + interessi legali. Non è possibile compensare IMU in F24 con crediti altri tributi.' },
        ]
      },
    ]
  },
  {
    cat: 'Pratiche e Adempimenti',
    color: '#38bdf8',
    icon: '✅',
    voci: [
      {
        titolo: 'Ravvedimento operoso: come si calcola',
        tags: ['ravvedimento', 'sanzione', 'f24', 'omesso versamento', 'tardivo'],
        passi: [
          { t: 'info', testo: 'Il ravvedimento operoso permette di regolarizzare omissioni o errori pagando spontaneamente tributo, sanzione ridotta e interessi, prima che l\'AdE avvii controlli.' },
          { t: 'step', n: 1, testo: 'CALCOLO GIORNI DI RITARDO: contare i giorni dalla scadenza originaria alla data di pagamento del ravvedimento.' },
          { t: 'step', n: 2, testo: 'SANZIONE RIDOTTA in base ai giorni:\n• Entro 14 giorni: 0,1% per giorno (min 0,1%, max 1,4%)\n• Da 15 a 30 giorni: 1,5% fisso (ravvedimento breve)\n• Da 31 a 90 giorni: 1,67% fisso (ravvedimento intermedio)\n• Da 91 giorni a 1 anno: 3,75%\n• Da 1 a 2 anni: 4,29%\n• Oltre 2 anni: 5%\n• Dopo atto di contestazione: 6%' },
          { t: 'step', n: 3, testo: 'INTERESSI LEGALI: calcolare sul tributo × tasso legale annuo (verificare tasso vigente: dal 2024 è 2,5%) × giorni di ritardo / 365.' },
          { t: 'step', n: 4, testo: 'CODICI TRIBUTO F24: usare lo stesso codice del tributo originario per il versamento principale + interessi. Per le sanzioni: codice 8901 (sanzione da ravvedimento per IRPEF), 8904 (IVA), 8906 (IRAP). Verificare sempre sul sito AdE.' },
          { t: 'step', n: 5, testo: 'ESEMPIO PRATICO: IVA dovuta €1.000, scadenza 16/06, pagamento 20/07 (34 giorni di ritardo). Sanzione 1,67% → €16,70. Interessi 2,5%×34/365×€1.000 → €2,33. Totale F24: €1.000 + €16,70 + €2,33 = €1.019,03.' },
          { t: 'ok', testo: 'Il ravvedimento è ammesso finché l\'AdE non ha avviato accertamenti o inviato comunicazioni formali. Verificare sempre l\'assenza di atti prima di procedere.' },
        ]
      },
      {
        titolo: 'Apertura partita IVA: procedura passo-passo',
        tags: ['partita iva', 'apertura', 'ateco', 'inps', 'inail', 'comunicazione'],
        passi: [
          { t: 'step', n: 1, testo: 'SCELTA CODICE ATECO: identificare l\'attività principale e il codice ATECO corrispondente (tabella ISTAT). Il codice determina: categoria previdenziale, coefficiente ISA, coefficiente forfettario.' },
          { t: 'step', n: 2, testo: 'DICHIARAZIONE DI INIZIO ATTIVITÀ: modello AA9/12 (persone fisiche) o AA7/10 (società). Presentare telematicamente tramite Entratel/Fisconline o tramite il professionista abilitato.' },
          { t: 'step', n: 3, testo: 'ISCRIZIONE INPS: per artigiani → iscrizione alla Gestione Artigiani entro 30 giorni dall\'inizio attività; per commercianti → Gestione Commercianti; per professionisti senza cassa → Gestione Separata (automatica con la P.IVA); per autonomi con cassa professionale (avvocati, ingegneri) → iscrizione alla cassa specifica.' },
          { t: 'step', n: 4, testo: 'ISCRIZIONE CCIAA (se attività d\'impresa): comunicare al Registro Imprese tramite pratica SUAP o ComUnica. Costo: €168 bollo + diritti CCIAA variabili.' },
          { t: 'step', n: 5, testo: 'SCELTA REGIME FISCALE: valutare forfettario (se ricavi attesi < €85.000) vs ordinario/semplificato. Il forfettario è il regime di default per chi inizia.' },
          { t: 'step', n: 6, testo: 'PRIMO ANNO: non versare acconti IRPEF/IRAP per l\'anno di apertura (nessun reddito precedente come base). Dal secondo anno scattano gli acconti (40% prima rata, 60% seconda).' },
          { t: 'ok', testo: 'CHECKLIST FINALE: P.IVA ottenuta → iscrizione INPS → apertura conto corrente dedicato (consigliato, non obbligatorio per ditte individuali) → PEC obbligatoria per professionisti e imprese → registrazione corrispettivi/fatturazione elettronica attivata.' },
        ]
      },
    ]
  },
]

function TipIcon({ t }) {
  if (t === 'warn')  return <AlertTriangle size={14} color="#fb923c" style={{ flexShrink: 0, marginTop: 1 }} />
  if (t === 'ok')    return <CheckCircle size={14} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} />
  if (t === 'info')  return <Info size={14} color="#60a5fa" style={{ flexShrink: 0, marginTop: 1 }} />
  if (t === 'step')  return null
  return null
}

function TipBg(t) {
  if (t === 'warn')  return { bg: 'rgba(249,115,22,.07)', border: 'rgba(249,115,22,.15)', color: '#e0884a' }
  if (t === 'ok')    return { bg: 'rgba(16,185,129,.07)', border: 'rgba(16,185,129,.14)', color: '#2db88a' }
  if (t === 'info')  return { bg: 'rgba(59,130,246,.07)', border: 'rgba(59,130,246,.14)', color: '#5b9de8' }
  return { bg: 'transparent', border: 'transparent', color: 'var(--text2)' }
}

function VoceGuida({ voce, colore }) {
  const [aperta, setAperta] = useState(false)
  return (
    <div style={{ border: `1px solid ${aperta ? colore + '28' : 'var(--border)'}`, borderRadius: 11, overflow: 'hidden', transition: 'border-color .2s', background: 'var(--bg3)' }}>
      <button onClick={() => setAperta(a => !a)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', background: 'none', border: 'none',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: aperta ? colore : 'var(--border3)', flexShrink: 0, transition: 'background .2s' }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: aperta ? 'var(--text1)' : 'var(--text2)', transition: 'color .2s' }}>
          {voce.titolo}
        </span>
        <div style={{ flexShrink: 0, color: 'var(--text3)' }}>
          {aperta ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {aperta && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 1, background: 'var(--border)', marginBottom: 4 }} />
          {voce.passi.map((p, i) => {
            const st = TipBg(p.t)
            const isStep = p.t === 'step'
            return (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: isStep ? '0' : '9px 11px',
                borderRadius: isStep ? 0 : 8,
                background: st.bg,
                border: isStep ? 'none' : `1px solid ${st.border}`,
              }}>
                {isStep ? (
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--bg5)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 800, color: colore }}>
                    {p.n}
                  </div>
                ) : (
                  <TipIcon t={p.t} />
                )}
                <p style={{ fontSize: 13, color: isStep ? 'var(--text2)' : st.color, lineHeight: 1.6, whiteSpace: 'pre-line', paddingTop: isStep ? 2 : 0 }}>
                  {p.testo}
                </p>
              </div>
            )
          })}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
            {voce.tags.map(t => (
              <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg5)', border: '1px solid var(--border2)', color: 'var(--text3)', fontWeight: 600 }}>#{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Guide() {
  const [q, setQ] = useState('')
  const [catAttiva, setCatAttiva] = useState(null)

  const tutte = GUIDE.flatMap(g => g.voci.map(v => ({ ...v, cat: g.cat, color: g.color })))

  const filtrate = q.length >= 2
    ? tutte.filter(v =>
        v.titolo.toLowerCase().includes(q.toLowerCase()) ||
        v.tags.some(t => t.includes(q.toLowerCase())) ||
        v.passi.some(p => p.testo.toLowerCase().includes(q.toLowerCase()))
      )
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h1 className="page-title">Guide Operative</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>
            Procedure dettagliate per rateizzazioni, rottamazioni, imposte e adempimenti
          </p>
        </div>
      </div>

      {/* Ricerca */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
        <input className="inp" style={{ paddingLeft: 36 }} value={q}
          onChange={e => { setQ(e.target.value); setCatAttiva(null) }}
          placeholder="Cerca procedura, argomento, parola chiave..." />
        {q && <button onClick={() => setQ('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' }}><X size={13} /></button>}
      </div>

      {/* Risultati ricerca */}
      {filtrate && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{filtrate.length} risultati per "{q}"</div>
          {filtrate.length === 0
            ? <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)', fontSize: 13 }}>Nessuna guida trovata per "{q}"</div>
            : filtrate.map((v, i) => (
              <div key={i}>
                <div style={{ fontSize: 10, color: v.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{v.cat}</div>
                <VoceGuida voce={v} colore={v.color} />
              </div>
            ))
          }
        </div>
      )}

      {/* Categorie */}
      {!filtrate && (
        <>
          {/* Filtro categorie */}
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button onClick={() => setCatAttiva(null)} style={{
              padding: '5px 13px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${!catAttiva ? 'rgba(59,130,246,.3)' : 'var(--border2)'}`,
              background: !catAttiva ? 'rgba(59,130,246,.08)' : 'transparent',
              color: !catAttiva ? 'var(--accent2)' : 'var(--text3)',
            }}>Tutte</button>
            {GUIDE.map(g => (
              <button key={g.cat} onClick={() => setCatAttiva(catAttiva === g.cat ? null : g.cat)} style={{
                padding: '5px 13px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                border: `1px solid ${catAttiva === g.cat ? g.color + '40' : 'var(--border2)'}`,
                background: catAttiva === g.cat ? g.color + '10' : 'transparent',
                color: catAttiva === g.cat ? g.color : 'var(--text3)',
              }}>{g.icon} {g.cat}</button>
            ))}
          </div>

          {/* Guide per categoria */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {GUIDE.filter(g => !catAttiva || g.cat === catAttiva).map(g => (
              <div key={g.cat}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 16 }}>{g.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: g.color }}>{g.cat}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg5)', border: '1px solid var(--border2)', padding: '1px 7px', borderRadius: 99, fontWeight: 700 }}>{g.voci.length}</span>
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${g.color}20, transparent)` }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {g.voci.map((v, i) => <VoceGuida key={i} voce={v} colore={g.color} />)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
