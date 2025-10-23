# Aboelo Hilfsmittel-Finder

Eine Progressive Web App (PWA) für den deutschen Markt, die Senioren dabei hilft, herauszufinden, welche medizinischen Hilfsmittel ihre gesetzliche Krankenversicherung (GKV) übernimmt. Die App nutzt die offizielle GKV-Spitzenverband API, um Zugriff auf alle 56.000+ Produkte im Hilfsmittelverzeichnis zu erhalten, kombiniert diese mit einem intelligenten Entscheidungsbaum-Fragebogen und generiert personalisierte Antragsschreiben für die Krankenkasse.

## Features

- 🔍 **Intelligente Produktsuche**: Durchsucht die offizielle GKV-Hilfsmitteldatenbank mit über 56.000 Produkten
- 📝 **Geführter Fragebogen**: Einfacher Schritt-für-Schritt-Prozess zur Ermittlung passender Hilfsmittel
- 🤖 **KI-Produkterklärungen**: Nutzt Google Gemini Flash 2.0 für personalisierte, leicht verständliche Erklärungen (Phase 2)
- 🏷️ **Intelligenter Decoder**: Übersetzt technische Abkürzungen (IIC, RIC, BTE) in einfache Sprache (Phase 1)
- 📊 **Kategorie-Kontext**: Zeigt Auswahlhilfen und Erklärungen für jede Produktkategorie (Phase 1)
- 📄 **Antragsschreiben-Generator**: Erstellt rechtssichere Anträge mit offiziellen Produktcodes
- 📱 **PWA-fähig**: Installierbar auf iOS und Android, funktioniert auch offline
- ♿ **Barrierefrei**: WCAG AA-konform mit großen Schriften und hohem Kontrast
- 🇩🇪 **Vollständig auf Deutsch**: Speziell für die Zielgruppe 65+ optimiert

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **PDF-Generierung**: jsPDF
- **KI**: Google Gemini Flash 2.0 (kostenlos)
- **API**: Offizielle GKV-Spitzenverband Hilfsmittel-API
- **Deployment**: Vercel

## Setup & Installation

### Voraussetzungen

- Node.js 18+ 
- npm oder yarn

### Lokale Entwicklung

1. Repository klonen:
```bash
git clone [repository-url]
cd hilfsmittel-finder
```

2. Dependencies installieren:
```bash
npm install
```

3. Development Server starten:
```bash
npm run dev
```

Die App läuft nun auf `http://localhost:5173`

### Environment Variables

Die App nutzt folgende Umgebungsvariablen (optional):

```bash
# API-Base URL (Standard: /api/proxy)
VITE_API_BASE=/api/proxy

# Google Gemini API Key (für KI-Erklärungen - Phase 2)
VITE_GEMINI_API_KEY=dein_api_key_hier
```

**Gemini API Key holen**:
1. Besuche [Google AI Studio](https://ai.google.dev/)
2. Erstelle einen kostenlosen API-Key (keine Kreditkarte erforderlich)
3. Füge ihn zur `.env` Datei hinzu

**Kostenlos**: 1,500 Requests/Tag, 1M Tokens/Minute

**Ohne API-Key**: Die App funktioniert weiterhin mit Phase 1 (Decoder + Kontext)

In der Produktion werden API-Anfragen über den Vercel Proxy (`/api/proxy`) geleitet, um CORS-Probleme zu vermeiden.

## Build & Deployment

### Production Build

```bash
npm run build
```

Der Build-Output wird im `dist/` Ordner erstellt.

### Lokalen Build testen

```bash
npm run preview
```

### Deployment auf Vercel

Die App ist für Vercel optimiert:

1. Repository mit Vercel verbinden
2. Build Settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
3. Deploy starten

Die `vercel.json` Konfiguration enthält:
- Rewrites für SPA-Routing
- API-Proxy-Routing
- Security Headers (X-Content-Type-Options, X-Frame-Options, etc.)

## API Architecture

### GKV API Integration

Die App nutzt die offizielle Hilfsmittel-API des GKV-Spitzenverbands:

- **Base URL**: `https://hilfsmittel-api.gkv-spitzenverband.de`
- **Proxy**: Alle API-Anfragen laufen über `/api/proxy` (Vercel Serverless Function)

### API-Strategie (gemäß API-GUIDE.md)

1. **Hierarchie-Baum laden**: `GET /api/verzeichnis/VerzeichnisTree/4`
   - Lädt den vollständigen Produktgruppenbaum
   - Baut eine `xSteller → GUID` Zuordnung auf

2. **Produkte abrufen**: Priorisierter Ansatz
   - Primär: `GET /api/verzeichnis/Produkt?produktgruppe={GUID}`
   - Fallback: `GET /api/verzeichnis/Produkt?produktgruppennummer={xSteller}`

3. **Caching**:
   - localStorage-basiertes Caching (7 Tage)
   - Service Worker für Offline-Funktionalität
   - Schema-Versionierung für Cache-Invalidierung

### Produktnormalisierung

Die API liefert teilweise inkonsistente Daten. Die App normalisiert automatisch:

- Filtert Platzhalter-Einträge (`"Nicht besetzt"`)
- Überspringt entfernte Produkte (`istHerausgenommen: true`)
- Konsolidiert Namen aus mehreren Feldern (`bezeichnung`, `name`, `displayName`)
- Extrahiert Produktcodes aus verschiedenen Quellen

## Testing

### Unit & Integration Tests

```bash
npm test
```

Die Test-Suite nutzt Vitest und React Testing Library:

- `src/test/gkvApi.test.js` - API Service Tests
- `src/test/decisionTree.test.js` - Fragebogen-Logik
- `src/test/QuestionFlow.test.jsx` - Component Tests
- `src/test/productList.test.jsx` - Produktlisten-Tests

### Manuelle Tests

Kritische User Flows zum Testen:

1. **Happy Path**: Welcome → Fragen → Ergebnisse → Brief generieren → PDF downloaden
2. **Pagination**: Durch mehrere Seiten von Suchergebnissen navigieren
3. **Produktauswahl**: Mehrere Produkte auswählen/abwählen
4. **Offline-Modus**: App ohne Internetverbindung nutzen
5. **PWA-Installation**: Auf iOS/Android installieren

### Browser-Kompatibilität

Getestet auf:
- ✅ Chrome/Edge (Windows, Android)
- ✅ Firefox (Windows)
- ✅ Safari (iOS, iPadOS)

## Project Structure

```
hilfsmittel-finder/
├── api/
│   └── proxy.js              # Vercel API Proxy
├── public/
│   ├── icons/                # PWA Icons
│   ├── manifest.json         # PWA Manifest
│   └── sw.js                 # Service Worker
├── src/
│   ├── components/           # React Components
│   │   ├── HilfsmittelFinder.jsx
│   │   ├── QuestionFlow.jsx
│   │   ├── ProductSearch.jsx
│   │   ├── ResultsDisplay.jsx
│   │   └── LetterGenerator.jsx
│   ├── data/
│   │   └── decisionTree.js   # Fragebogen-Definitionen
│   ├── pages/
│   │   ├── Impressum.jsx
│   │   └── Datenschutz.jsx
│   ├── services/
│   │   └── gkvApi.js         # API Service Layer
│   ├── utils/
│   │   ├── analytics.js      # Event Tracking
│   │   ├── letterGenerator.js # PDF-Generator
│   │   └── productUtils.js   # Helper Functions
│   ├── test/                 # Test Files
│   └── App.jsx               # Main App Component
├── vercel.json               # Vercel Configuration
├── vite.config.js            # Vite Build Config
└── tailwind.config.js        # Tailwind CSS Config
```

## Accessibility (WCAG AA)

Die App erfüllt WCAG AA-Standards:

- ✅ Mindest-Schriftgröße: 18px (Body), 24px+ (Überschriften)
- ✅ Farbkontrast: 7:1 (WCAG AAA)
- ✅ Touch Targets: Mindestens 48×48px
- ✅ Tastaturnavigation: Vollständig bedienbar ohne Maus
- ✅ Screen Reader: Getestet mit NVDA
- ✅ Fortschrittsanzeige: "Schritt X von Y"
- ✅ Aria-Labels: Semantisches HTML

## Security

### Implementierte Maßnahmen

- Security Headers (via `vercel.json`):
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- HTTPS-only (Vercel)
- Keine serverseitige Datenspeicherung
- localStorage-only für Fragebogen-Antworten
- API-Proxy verhindert CORS-Issues

### Datenschutz (DSGVO)

- ✅ Keine personenbezogenen Daten auf dem Server
- ✅ localStorage nur für Fragebogen-Cache
- ✅ Keine Cookies
- ✅ Keine Third-Party-Tracking-Scripts
- ✅ Datenschutzerklärung vorhanden (`/datenschutz`)
- ✅ Impressum vorhanden (`/impressum`)

## Known Issues & Limitations

1. **PDF mit Umlauten**: jsPDF nutzt Standard-Fonts. Deutsche Umlaute (ä, ö, ü) werden korrekt angezeigt, aber spezielle Zeichen könnten Probleme bereiten.

2. **API-Ausfälle**: Bei API-Downtime wird auf gecachte Daten zurückgegriffen. Nutzer sehen eine Warnung.

3. **iOS PWA-Installation**: Die Installation muss manuell über "Zum Home-Bildschirm" erfolgen (Safari-Limitierung).

4. **Cache-Invalidierung**: Bei API-Schema-Änderungen muss die `CACHE_SCHEMA_VERSION` aktualisiert werden.

## Development Guidelines

### Code Style

- ESLint-Konfiguration in `eslint.config.js`
- Prettier für Code-Formatierung
- Commit messages auf Deutsch

### Neue Produktgruppen hinzufügen

1. `src/data/decisionTree.js` erweitern mit neuen Fragen
2. API-Kriterien-Mapping in `api_criteria` definieren
3. `src/services/gkvApi.js`: `mapCriteriaToGroups()` um neue Mappings erweitern

### Neue Tests schreiben

```bash
# Test-Datei erstellen in src/test/
# Tests ausführen
npm test

# Tests mit Coverage
npm test -- --coverage
```

## Performance

Ziele (gemäß InitialPrompt.md):

- ✅ Page Load: < 3 Sekunden
- ✅ API Response: < 2 Sekunden (mit Caching)
- ✅ Lighthouse Score: > 90
- ✅ Bundle Size: < 1 MB (mit Code Splitting)

### Optimierungen

- Code Splitting (vendor/pdf chunks)
- Lazy Loading für schwere Komponenten
- Service Worker Caching
- API Response Caching (7 Tage)
- Font Preloading
- Image Optimization

## Support & Contact

Bei Fragen oder Problemen:

- **Email**: [support-email einfügen]
- **Issues**: [GitHub Issues Link]
- **Dokumentation**: Siehe `InitialPrompt.md` und `API-GUIDE.md`

## License

[Lizenz-Information einfügen]

## Contributors

[Team-Information einfügen]

---

**Hinweis**: Diese App dient nur zu Informationszwecken und ersetzt keine medizinische Beratung. Die endgültige Entscheidung über Kostenübernahmen trifft Ihre Krankenkasse.
