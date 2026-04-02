# M400 Frontend

Applicazione web Angular per il controllo remoto del mixer audio digitale M400. Interfaccia professionale per la gestione di canali audio, equalizzatori, DCA e funzionalità avanzate di mixing.

![Angular](https://img.shields.io/badge/Angular-21.0.0-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.6-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## 📋 Indice

- [Caratteristiche](#-caratteristiche)
- [Requisiti](#-requisiti)
- [Installazione](#-installazione)
- [Configurazione](#-configurazione)
- [Esecuzione](#-esecuzione)
- [Build](#-build)
- [Struttura del Progetto](#-struttura-del-progetto)
- [Ruoli Utente](#-ruoli-utente)
- [Componenti Principali](#-componenti-principali)
- [API Backend](#-api-backend)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Contribuire](#-contribuire)
- [Licenza](#-licenza)

## ✨ Caratteristiche

- 🎚️ **Controlli Audio Professionali**: Fader verticali con scala logaritmica dB, knob rotativi, equalizzatore parametrico
- 🔐 **Sistema di Autenticazione**: Login basato su JWT con gestione ruoli (RBAC)
- 👥 **Multi-Ruolo**: Supporto per Admin, Mixer, Video e User con permessi differenziati
- 📱 **Responsive Design**: Interfaccia ottimizzata per desktop e tablet
- ⚡ **Server-Side Rendering**: SSR abilitato per performance ottimali
- 🎨 **UI Moderna**: Interfaccia basata su Bootstrap 5 con componenti custom
- 🔄 **Real-time Updates**: Gestione reattiva dello stato con RxJS

## 📦 Requisiti

### Software Necessario

- **Node.js**: >= 18.x (consigliato 20.x LTS)
- **npm**: >= 9.x
- **Angular CLI**: 21.x

### Browser Supportati

- Chrome/Edge >= 90
- Firefox >= 88
- Safari >= 14

## 🚀 Installazione

### 1. Clonare il Repository

```bash
git clone https://github.com/your-org/m400-frontend.git
cd m400-frontend
```

### 2. Installare le Dipendenze

```bash
npm install
```

### 3. Installare Angular CLI (se non già installato)

```bash
npm install -g @angular/cli@21
```

## ⚙️ Configurazione

### Configurazione Environment

Il progetto utilizza due file di configurazione per gli ambienti:

#### Development (`src/environments/environment.development.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000'
};
```

#### Production (`src/environments/environment.ts`)

**⚠️ IMPORTANTE**: Prima del deploy in produzione, configurare:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com'
};
```

### Configurazione Backend

Assicurarsi che il backend M400 sia in esecuzione e accessibile all'URL configurato in `apiUrl`.

## 🏃 Esecuzione

### Development Server
 
Avviare il server di sviluppo:

```bash
npm start
```

oppure

```bash
ng serve
```

L'applicazione sarà disponibile su **http://localhost:4200/**

Il server si ricaricherà automaticamente quando modifichi i file sorgente.

### Development Server con Configurazione Custom

```bash
# Porta custom
ng serve --port 4300

# Host custom
ng serve --host 0.0.0.0

# Aprire automaticamente il browser
ng serve --open
```

### Server-Side Rendering (SSR)

Per testare l'applicazione con SSR:

```bash
# 1. Build dell'applicazione
npm run build

# 2. Avviare il server SSR
npm run serve:ssr:M400_FrontEnd
```

## 🔨 Build

### Build Development

```bash
npm run build
```

oppure

```bash
ng build --configuration development
```

### Build Production

```bash
ng build --configuration production
```

I file compilati saranno generati nella directory `dist/M400_FrontEnd/`.

### Build con SSR

```bash
ng build --configuration production
```

Questo genererà:
- `dist/M400_FrontEnd/browser/` - File per il browser
- `dist/M400_FrontEnd/server/` - File per il server SSR

## 📁 Struttura del Progetto

```
m400-frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Funzionalità core
│   │   │   ├── auth/               # Sistema autenticazione
│   │   │   ├── config/             # Configurazioni
│   │   │   ├── directives/         # Direttive custom
│   │   │   ├── layout/             # Layout (header, footer)
│   │   │   └── models/             # Modelli dati
│   │   │
│   │   ├── features/               # Moduli funzionali
│   │   │   ├── admin/             # Area amministrativa
│   │   │   ├── login/             # Pagina login
│   │   │   ├── mixer/             # Controlli mixer
│   │   │   ├── user/              # Area utente
│   │   │   └── video/             # Controlli video
│   │   │
│   │   ├── shared/                # Componenti condivisi
│   │   │   ├── aux-container/     # Container aux sends
│   │   │   ├── equalizer/         # Equalizzatore parametrico
│   │   │   ├── knob/              # Controllo rotativo
│   │   │   └── sliders/           # Fader verticali
│   │   │
│   │   ├── app.ts                 # Componente root
│   │   ├── app.routes.ts          # Configurazione routing
│   │   └── app.config.ts          # Configurazione app
│   │
│   ├── environments/              # Configurazioni ambiente
│   ├── styles/                    # Stili globali
│   ├── index.html                 # HTML principale
│   └── main.ts                    # Entry point
│
├── public/                        # Asset statici
├── angular.json                   # Configurazione Angular
├── package.json                   # Dipendenze npm
└── tsconfig.json                  # Configurazione TypeScript
```

## 👥 Ruoli Utente

L'applicazione supporta 4 ruoli con permessi differenziati:

### 1. **Amministratore** (`amministratore`)
- Accesso completo a tutte le funzionalità
- Gestione utenti
- Dashboard amministrativa
- Accesso a mixer, video e user

**Rotte**:
- `/app/admin/dashboard`
- `/app/admin/users`
- Tutte le altre rotte

### 2. **Mixerista** (`mixerista`)
- Controllo completo del mixer audio
- Gestione canali, DCA, scene
- Equalizzatore e effetti

**Rotte**:
- `/app/mixer/home` - Controlli fader
- `/app/mixer/dca` - Controlli DCA
- `/app/mixer/scene` - Gestione scene

### 3. **Video** (`video`)
- Controlli video e streaming
- Visualizzazione mixer (sola lettura)

**Rotte**:
- `/app/video/home`

### 4. **Utente** (`utente`)
- Accesso base
- Visualizzazione stato
- Gestione profilo

**Rotte**:
- `/app/user/home`
- `/app/user/profile`

## 🎛️ Componenti Principali

### Knob Component

Controllo rotativo per regolazioni audio (gain, pan, etc.)

**Caratteristiche**:
- Interazione drag verticale
- Supporto mouse wheel
- Range personalizzabile
- Visualizzazione valore

**Utilizzo**:
```html
<app-knob
  [(value)]="gainValue"
  [min]="0"
  [max]="100"
  [step]="1"
  (onChange)="onGainChange($event)">
</app-knob>
```

### Equalizer Component

Equalizzatore parametrico a 4 bande con visualizzazione grafica

**Caratteristiche**:
- 4 bande (low-shelf, 2x parametric, high-shelf)
- Visualizzazione curva di risposta SVG
- Drag interattivo per frequenza, gain e Q
- Range: 20Hz - 20kHz, ±15dB

**Utilizzo**:
```html
<app-equalizer
  [(bands)]="eqBands"
  (bandsChange)="onEqChange($event)">
</app-equalizer>
```

### Vertical Slider Component

Fader verticale con scala logaritmica dB professionale

**Caratteristiche**:
- Scala dB: -∞ a +10dB
- Pulsante mute integrato
- Drag, touch e scroll wheel
- Auto-repeat su pulsanti +/-

**Utilizzo**:
```html
<app-vertical-slider
  [(value)]="channelLevel"
  [(muted)]="channelMuted"
  [label]="'CH 1'"
  [sublabel]="'Bass'"
  (valueChange)="onLevelChange($event)"
  (muteChange)="onMuteChange($event)">
</app-vertical-slider>
```

## 🔌 API Backend

### Endpoint Richiesti

L'applicazione si aspetta i seguenti endpoint dal backend:

#### Autenticazione

```
POST /login
Body: FormData { username: string }
Response: JWT token (string)
```

**Esempio JWT Payload**:
```json
{
  "sub": "username",
  "role": "mixerista",
  "exp": 1234567890
}
```

#### Headers Autenticazione

Tutte le richieste autenticate includono:
```
Authorization: Bearer <jwt-token>
```

### Configurazione CORS

Il backend deve permettere richieste da:
- Development: `http://localhost:4200`
- Production: Il dominio configurato

## 🧪 Testing

### Unit Tests

```bash
npm test
```

oppure

```bash
ng test
```

### Test con Coverage

```bash
ng test --code-coverage
```

I report di coverage saranno generati in `coverage/`.

### End-to-End Tests

```bash
ng e2e
```

**Nota**: E2E testing framework non configurato di default. Installare Cypress o Playwright se necessario.

## 🔧 Troubleshooting

### Problema: "Cannot find module '@angular/core'"

**Soluzione**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Problema: Errore CORS durante il login

**Soluzione**:
1. Verificare che il backend sia in esecuzione
2. Controllare la configurazione CORS del backend
3. Verificare l'URL in `environment.development.ts`

### Problema: "Port 4200 is already in use"

**Soluzione**:
```bash
# Usare una porta diversa
ng serve --port 4300

# Oppure terminare il processo sulla porta 4200
# Windows
netstat -ano | findstr :4200
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4200 | xargs kill -9
```

### Problema: Token JWT scaduto

**Soluzione**:
1. Fare logout
2. Effettuare nuovamente il login
3. Il token verrà aggiornato automaticamente

### Problema: Componenti non si caricano

**Soluzione**:
1. Verificare la console del browser per errori
2. Controllare che tutte le dipendenze siano installate
3. Pulire la cache del browser
4. Riavviare il dev server

## 🛠️ Scripts Disponibili

```json
{
  "start": "ng serve",                    // Dev server
  "build": "ng build",                    // Build production
  "watch": "ng build --watch",            // Build con watch mode
  "test": "ng test",                      // Unit tests
  "serve:ssr": "node dist/.../server.mjs" // SSR server
}
```

## 📚 Documentazione Aggiuntiva

- [Analisi Completa del Progetto](ANALISI_PROGRAMMA.md) - Analisi dettagliata dell'architettura
- [Angular Documentation](https://angular.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Bootstrap 5 Docs](https://getbootstrap.com/docs/5.3/)

## 🤝 Contribuire

### Workflow di Sviluppo

1. Fork del repository
2. Creare un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Aprire una Pull Request

### Coding Standards

- Seguire [Angular Style Guide](https://angular.dev/style-guide)
- Usare TypeScript strict mode
- Scrivere test per nuove funzionalità
- Documentare componenti e servizi pubblici
- Usare Prettier per formattazione (configurato in `package.json`)

### Commit Messages

Seguire [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new equalizer band
fix: resolve token expiration issue
docs: update README with new instructions
style: format code with prettier
refactor: simplify auth service logic
test: add tests for knob component
```

## 📝 Changelog

### [Unreleased]
- Sistema di autenticazione JWT
- Componenti audio professionali (Knob, Equalizer, Slider)
- Gestione ruoli e permessi
- Layout responsive
- SSR support

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## 👨‍💻 Autori

- **Team M400** - *Sviluppo iniziale*

## 🙏 Ringraziamenti

- Angular Team per l'eccellente framework
- Bootstrap Team per il framework CSS
- Comunità open source per le librerie utilizzate

---

## 📞 Supporto

Per problemi, domande o suggerimenti:

- 🐛 [Aprire un Issue](https://github.com/your-org/m400-frontend/issues)
- 📧 Email: support@m400.com
- 💬 Discord: [M400 Community](https://discord.gg/m400)

---

**Nota**: Questo è un progetto in sviluppo attivo. Alcune funzionalità potrebbero non essere ancora complete.

**Versione**: 0.0.0  
**Ultimo Aggiornamento**: Marzo 2026
