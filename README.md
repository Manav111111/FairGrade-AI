# 🎓 FairGrade AI

**AI-Powered Exam Evaluation & Marking Audit System**

> Two powerful modes — one unified AI engine. No answer keys needed.

---

## 🚀 What is FairGrade AI?

FairGrade AI is an intelligent exam evaluation system with **two modes**:

### Mode A — Full AI Evaluation (No Teacher)
The AI acts as the sole examiner. Upload question papers + student answer sheets, and the AI evaluates every answer independently using subject expertise — no answer keys or teacher input required.

### Mode B — Audit / Comparison (Teacher Already Marked)
The AI re-evaluates every paper independently, then **compares** its marks against the teacher's marks question-by-question. It detects:
- Where the teacher under-marked or over-marked specific students
- Systematic bias on certain types of questions
- Whether different teachers apply different marking standards

---

## 🧩 Tech Stack (100% Free, No Credit Card)

| Layer | Tool | Role |
|---|---|---|
| LLM Scoring | **Groq** (Llama 3.1 70B) | Scores answers, writes reports |
| Vision/OCR | **Google Gemini** (gemini-2.0-flash) | Reads question papers + answer sheets |
| Database | **Supabase** (PostgreSQL) | Stores exams, students, marks, reports |
| Backend | **FastAPI** (Python) | Orchestrates OCR → scoring → comparison |
| Frontend | **Next.js 16 + React 18** | Upload UI, results, charts, reports |
| Styling | **TailwindCSS v4** | Premium dark-mode UI |
| Charts | **Recharts** | Mark distributions, per-question analysis |
| Stats | **NumPy / SciPy** | Bias calculations, variance, correlation |

---

## ⚡ Quick Start

### 1. Supabase Setup
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `schema.sql`
3. Enable Realtime on `students` and `audit_reports` tables
4. Copy your project URL, service role key, and anon key

### 2. Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # Fill in your API keys
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
copy .env.local.example .env.local   # Fill in Supabase keys
npm run dev
```

### 4. Get API Keys (All Free)
- **Groq**: [groq.com](https://groq.com) → API Keys → No card needed
- **Gemini**: [aistudio.google.com](https://aistudio.google.com) → Get API Key → No card needed
- **Supabase**: [supabase.com](https://supabase.com) → New Project → Settings → API

---

## 📁 Project Structure

```
EXAMCHECK/
├── schema.sql                    # Supabase database schema
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py               # FastAPI app entry point
│       ├── config.py             # Environment config
│       ├── routers/
│       │   ├── exam.py           # Create exams, parse question papers
│       │   ├── upload.py         # Upload answer sheets
│       │   ├── evaluate.py       # Run AI evaluation pipeline
│       │   └── results.py        # Fetch results and reports
│       ├── services/
│       │   ├── groq_client.py    # Groq LLM wrapper
│       │   ├── gemini_client.py  # Gemini Vision wrapper
│       │   ├── question_parser.py    # Question paper OCR
│       │   ├── answer_extractor.py   # Answer sheet OCR
│       │   ├── ai_examiner.py        # Core scoring engine
│       │   ├── bias_analyzer.py      # Statistical bias detection
│       │   └── report_generator.py   # Report generation
│       └── db/
│           └── supabase_client.py
└── frontend/
    ├── .env.local.example
    └── src/
        ├── app/
        │   ├── page.tsx              # Landing page
        │   ├── create-exam/page.tsx  # Create exam + upload QP
        │   └── exam/[examId]/
        │       ├── upload/page.tsx   # Upload answer sheets
        │       ├── results/page.tsx  # Results table + charts
        │       └── report/page.tsx   # Audit report viewer
        └── lib/
            ├── api.ts                # Backend API client
            └── supabaseClient.ts     # Supabase client
```

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/exam/create` | Create exam + parse question paper |
| `GET` | `/api/exam/{id}` | Get exam details |
| `GET` | `/api/exam/list/all` | List all exams |
| `POST` | `/api/exam/{id}/upload_student` | Upload single student |
| `POST` | `/api/exam/{id}/upload_bulk` | Upload multiple students |
| `POST` | `/api/exam/{id}/run_evaluation` | Run AI evaluation |
| `GET` | `/api/exam/{id}/results` | Get all student results |
| `GET` | `/api/exam/{id}/results/{student_id}` | Student detail |
| `GET` | `/api/exam/{id}/report` | Get audit report |
| `GET` | `/api/exam/{id}/stats` | Aggregated statistics |

---

## 🏆 Key Differentiators

- **No answer key required** — AI uses subject expertise directly
- **Question-level granularity** — pinpoints exactly which questions show bias
- **Cross-teacher comparison** — detects different grading standards
- **Evidence-based reports** — backed by statistical analysis (deltas, variance, correlation)
- **Entirely free stack** — zero cost to run or demo

---

## 📄 License

MIT
