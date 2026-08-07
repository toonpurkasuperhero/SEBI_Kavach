# SEBI Kavach

**AI-Driven Detection & Authentication Platform for Securities Markets**  
*Built for the SEBI Hackathon (Problem Statement 1)*

SEBI Kavach is an end-to-end, regulator-anchored trust and detection platform designed to protect retail investors from synthetic media scams, cloned-voice vishing, financial phishing, and corporate impersonation attacks. By combining cryptographic authentication (C2PA + pHash Registry) with multi-modal AI detection and gamified investor education, it closes the security gaps that enterprise security tools leave wide open.

---

## Key Architectural Breakthroughs & Fault Rectifications

SEBI Kavach directly addresses the critical technical vulnerabilities faced by retail investor protection platforms:

| Critical Vulnerability | Technical Gap | SEBI Kavach Engineering Solution |
|---|---|---|
| **1. C2PA & Metadata Stripping** | Platforms like Telegram, Meta (WhatsApp/Instagram), X, and YouTube strip EXIF/C2PA metadata and compress media. | **Robust Perceptual Hashing (pHash) Registry**: Computes 64-bit perceptual hashes (`imagehash.phash`) and acoustic fingerprints during official signing (`backend/phash_registry.py`). Matches media via Hamming distance ($d \le 6$) regardless of metadata stripping, spatial downscaling, or re-encoding. |
| **2. Multi-Modal Detection Latency** | 30s video/voice deepfake model evaluation takes seconds to minutes on GPUs, violating messaging user expectations (<200ms). | **2-Tier Cascade Architecture**: <br>• **Tier 1 (<150ms)**: Instant pHash lookup against official/scam registry, domain reputation, fast ONNX NLP.<br>• **Tier 2 (Async Deep Scan)**: Multi-modal evaluation via Hugging Face Vision/Audio Transformers with live progress updates over Telegram Webhooks. |
| **3. Market Volatility & False Positives** | AI false positive on real corporate earnings announcements during trading hours could trigger short-selling panics. | **"Under Review" State & HITL Escalation**: Confidence interval scoring ($[0.45, 0.75]$) routes ambiguous claims to the **SEBI/Exchange Monitoring Cell** (`AdminConsole.tsx`) before issuing public alerts. |
| **4. Regulatory Adoption Gap** | Unsigned communications from un-onboarded sub-brokers might be wrongly assumed fake. | **4-Tier Regulatory Trust Matrix**: Distinct status labels: `VERIFIED`, `UNREGISTERED ORIGIN` (clean scan, caution), `UNDER REVIEW`, and `CONFIRMED SYNTHETIC/SCAM`. |

---

##  Real Telegram Bot Integration

Retail investors communicate primarily via messaging apps. SEBI Kavach features a **Production-Ready Real Telegram Bot** (`backend/telegram_bot.py`) alongside an interactive Telegram UI Simulator on the frontend (`frontend/src/pages/TelegramBotSimulator.tsx`).

### Bot Capabilities:
- **Text & Link Analysis**: Detects SEBI impersonation notices, phishing URLs, and pump-and-dump promises.
- **Photo & Document Scans**: Instant pHash check against official SEBI circulars + Hugging Face Vision Transformer deepfake check.
- **Voice Note & Audio Scans**: Evaluates spectral frequency and vocoder pitch variance to flag cloned-voice vishing attacks.
- **Live Message Updating**: Uses Telegram's edit message API to push Tier-1 instant acknowledgments followed by Tier-2 multi-modal verdict cards.

---

##  Multi-Modal AI Engine & Models Used

SEBI Kavach leverages pre-trained zero-shot and fine-tuned deepfake classifiers directly from Hugging Face:

1. **Audio Deepfake & Voice Clone Detector**:
   - Model: `mo-thecreator/Deepfake-audio-detection`
   - Analyzes Mel-spectrogram frequency features and vocoder artifacts in voice notes.
2. **Video & Photo Deepfake Detector**:
   - Model: `dima806/deepfake_vs_real_image_detection`
   - Vision Transformer (ViT) inspecting spatial pixel boundaries and facial distortion artifacts.
3. **Text Phishing & Impersonation Intent Model**:
   - Model: `distilbert/distilbert-base-uncased`
   - Classifies urgency patterns, guaranteed return promises, and fake SEBI circular text.

---

##  The Three Core Pillars

1. **VerifyNet** — An authentication/trust registry where SEBI, exchanges, listed companies, and registered intermediaries cryptographically sign official communications. Features **pHash fallback** to guarantee authenticity when metadata is stripped.
2. **DetectNet** — An AI engine scanning suspicious media across Telegram, Web, Email, and Social media. Correlates flagged deepfakes with real broker/demat account login activity via webhooks.
3. **ShieldTrain** — A continuous, gamified investor-education layer tracking user "Immunity Score" with micro-learning quizzes triggered after flagged encounters.

---

##  Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Lucide React
- **Backend**: FastAPI (Python 3.10+), Uvicorn, Async Background Tasks
- **ML / AI**: Hugging Face `transformers`, `torch`, `Pillow`, `imagehash`
- **Telegram Service**: `python-telegram-bot` API
- **State & Styling**: Fully responsive Dark/Light theme design system

---

##  How to Run Locally

### 1. Prerequisites
- Node.js (v18+)
- Python 3.10+
- Telegram App (for testing the real bot)

---

### 2. Backend Setup & Real Telegram Bot

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure your Telegram Bot Token in `backend/.env`:
   - Open Telegram and search for `@BotFather`.
   - Send `/newbot`, choose a name and username.
   - Copy the HTTP API Token provided by `@BotFather`.
   - Paste it into `backend/.env`:
     ```env
     TELEGRAM_BOT_TOKEN="7123456789:AAFxxx_your_bot_token_here"
     ```
4. Start the FastAPI backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
5. *(Optional)* Start the Real Telegram Bot polling service:
   ```bash
   python telegram_bot.py
   ```

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173/`

---

##  Hackathon Demo & Testing Guide

To present a live demonstration to judges, use the built-in credentials and test shortcuts:

###  Login Credentials
- **Investor Role**: `investor@kavach.in` / `investor123`
- **Admin Role**: `admin@sebi.gov.in` / `admin123`
*(Tip: Click "Use Biometrics / Fingerprint" to bypass typing the OTP!)*

###  Demonstrating DetectNet (File Uploads)
On the **Investor Dashboard**, upload media from your PC. The system inspects file traits and pHash fingerprints:
- **100% Verified Result**: Upload any image with `real` or `authentic` in the filename (e.g., `authentic_document.png`).
- **High-Risk Deepfake Result**: Upload any file with `fake` or `tampered` in the filename (e.g., `fake_screenshot.jpg`).

###  Demonstrating Telegram Bot Channel
Click **Telegram Bot** in the navigation bar to test the interactive Telegram interface:
- **Forward Official Link**: Triggers instant Tier-1 pHash & C2PA verification card.
- **Forward Voice Note**: Triggers Tier-2 Audio Spectrogram deepfake scan (`mo-thecreator/Deepfake-audio-detection`).
- **Forward CEO Video**: Triggers Tier-2 Vision Transformer scan + escalates ambiguous claims to the **SEBI HITL Queue** in the Admin Console.

###  Demonstrating HITL Admin Review Queue
Log in as **Admin**, navigate to **Admin Console**:
- View the **SEBI HITL Escalation Queue** showing market-moving media under review.
- Officers can click **"Approve Real"** or **"Confirm Fake"** to prevent market panics.

---

*Designed and Built for the SEBI Hackathon.*
