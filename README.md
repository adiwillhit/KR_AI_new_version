# MeetMind — AI-Based Universal Meeting Assistant

MeetMind is an end-to-end, privacy-conscious AI Meeting Assistant engineered with real-world software architecture practices. It processes audio, video, or text meeting transcripts, generates executive summaries, tracks decisions, extracts actionable commitments with owners and deadlines, identifies risks and blockers, provides citation-backed conversational RAG (Retrieval-Augmented Generation) Q&A, and supports one-click meeting minutes export and automated email follow-ups.

---

## Architecture Overview (Phases 1–5 Implemented)

MeetMind implements **Phases 1 through 5** of the Master Development Specification:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MeetMind Architecture                           │
└────────────────────────────────────────────────────────────────────────┘

 [React 19 + Vite Frontend]
       │
       ▼  (REST API / JWT)
 [Express.js Backend API]
       │
       ├─── Authentication & Project Workspaces (Phase 1)
       │    ├── User Auth (bcrypt, JWT)
       │    ├── Projects & Participant Roles
       │    └── Meeting Scheduling & Metadata
       │
       ├─── Ingestion & Transcription Pipeline (Phase 2)
       │    ├── Multi-Format Ingestion (MP3, WAV, M4A, MP4, TXT)
       │    ├── Whisper Integration & Smart Dialogue Parsing
       │    └── BullMQ / In-Memory Queue Worker
       │
       ├─── AI Intelligence Engine (Phase 3)
       │    ├── Local Ollama LLM (llama3.2) / Local NLP Engine
       │    ├── Executive Summarization & Key Points
       │    ├── Decisions Extraction
       │    ├── Action Items Tracking (Owner, Deadline, Priority)
       │    └── Risks & Blockers Detection
       │
       ├─── Contextual RAG System (Phase 4)
       │    ├── Semantic Transcript Chunking & Overlap
       │    ├── Vector Embeddings (Ollama nomic-embed-text / Fast Vectorizer)
       │    ├── Cosine Similarity Semantic Retrieval
       │    └── Interactive Meeting Chat Assistant with Timestamp Citations
       │
       └─── Automated Follow-ups & Export (Phase 5)
            ├── One-Click Meeting Minutes Export (Markdown & Plain Text)
            ├── Automated Email Follow-ups (Nodemailer SMTP / Dev Simulation)
            └── Global Action Items & Decisions Dashboards
```

---

## Key Features

1. **Phase 1: Project Management & Foundation**
   - Secure authentication with JWT tokens & bcrypt password hashing.
   - Workspaces/Projects with multi-member collaboration.
   - Meeting scheduler with custom participant associations.
   - Sleek dark-mode UI with glassmorphism and micro-animations.

2. **Phase 2: Media Ingestion & Speech Pipeline**
   - Supports MP3, WAV, M4A, MP4 recordings, and direct TXT transcript uploads.
   - Resilient background queue manager (uses BullMQ when Redis is running, and in-memory async execution otherwise).
   - Timestamped speaker turns and dialogue segmentation.

3. **Phase 3: AI Intelligence Engine**
   - Automatic executive summary and key points extraction.
   - Decisions log with context and speaker attribution.
   - Action items with task assignments, deadlines, and priorities (high, medium, low).
   - Risk severity tagging and blocker identification.
   - Fully zero-cost: works with local Ollama (`llama3.2`) and has a built-in heuristic NLP fallback engine if offline.

4. **Phase 4: RAG & AI Meeting Assistant**
   - Semantic chunking with timestamp preservation.
   - Dense vector embeddings with cosine similarity search.
   - Conversational AI Assistant answering ad-hoc queries about meetings with exact timestamp citations.

5. **Phase 5: Follow-ups, Export & Action Board**
   - Global Action Items tracking board with interactive completion toggles and filters.
   - Global Decisions Log across all projects.
   - Downloadable meeting minutes in formatted Markdown (`.md`) and plain text (`.txt`).
   - Email dispatch to meeting participants with preview/simulation mode.
   - System Diagnostics page monitoring MongoDB, LLM, Whisper, and SMTP status.

---

## Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or newer)
- **MongoDB** (running locally on `mongodb://localhost:27017` or MongoDB Atlas URI)
- *(Optional)* **Ollama** (`ollama run llama3.2`) for local LLM inference
- *(Optional)* **Redis** for BullMQ worker (system automatically uses resilient in-memory runner if Redis is not running)

### 2. Installation

Clone repository and install dependencies for both server and client:

```bash
# In project root:
npm install
npm install --prefix server
npm install --prefix client
```

### 3. Environment Configuration

Check `server/.env` (configured out of the box for local development):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/meeting_assistant
JWT_SECRET=dev_secret_change_this_in_production_1234567890abcdef
JWT_EXPIRES_IN=7d
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
REDIS_URL=redis://localhost:6379
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=500
SMTP_PORT=587
```

### 4. Running the Application

To run both backend and frontend concurrently:

```bash
npm run dev
```

Or run them in separate terminals:

**Backend:**
```bash
cd server
npm run dev
```
Server runs on: `http://localhost:5000`

**Frontend:**
```bash
cd client
npm run dev
```
Client runs on: `http://localhost:5173`

---

## API Reference Summary

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login and receive JWT |
| `/api/auth/me` | GET | Current authenticated user profile |
| `/api/projects` | GET, POST | List and create projects |
| `/api/meetings` | GET, POST | List and create meetings |
| `/api/meetings/:id` | GET, PUT, DELETE | Meeting details and management |
| `/api/meetings/:id/upload` | POST | Upload recording (starts processing) |
| `/api/meetings/:id/reanalyze` | POST | Re-run AI analysis and RAG |
| `/api/meetings/:id/decisions` | GET | Meeting decisions |
| `/api/meetings/:id/action-items` | GET | Meeting action items |
| `/api/meetings/:id/risks-blockers` | GET | Meeting risks & blockers |
| `/api/meetings/:id/chat` | POST | RAG Q&A query with citations |
| `/api/meetings/:id/export` | GET | Export meeting minutes (`?format=markdown`) |
| `/api/meetings/:id/send-email` | POST | Email minutes to attendees |
| `/api/action-items` | GET | Filter action items by project/status/priority |
| `/api/action-items/:id` | PATCH, DELETE | Update status or delete action item |
| `/api/decisions` | GET | Search and view decisions catalog |
| `/api/system/status` | GET | System diagnostics (DB, Ollama, Whisper, SMTP) |

---

## License

MIT License — Academic & Open-Source Software.
