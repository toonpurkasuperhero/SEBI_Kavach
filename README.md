# SEBI Kavach

**AI-Driven Detection & Authentication Platform for Securities Markets**  
*Built for the SEBI Hackathon (Problem Statement 1)*

SEBI Kavach is an end-to-end trust and detection layer designed to protect retail investors from deepfakes, financial phishing, and synthetic media scams. By combining cryptographic authentication with real-time AI detection and gamified investor education, it closes the gap that enterprise security tools leave wide open.

---

## 1. Gap Analysis — What Exists vs. What's Missing

| Layer | Who does it today | Gap for securities markets |
|---|---|---|
| Voice deepfake detection | Pindrop, Resemble Detect | Not tuned to broker/regulator call patterns; no SEBI-specific trust registry behind it |
| Multi-channel phishing monitoring | Adaptive Security, KnowBe4 | Built for enterprise employee training, not retail investors on WhatsApp/Telegram |
| Content provenance | C2PA (Adobe, Google, BBC) | Only proves a file wasn't altered *after* signing — does **not** verify who is *allowed* to sign as "SEBI" |
| Fraud-transaction correlation | JPMorgan, Mastercard | Built for card/payment fraud, not linked to securities-market social-engineering events |

**The core gap:** Every existing player solves *either* detection *or* authentication, for *one* channel, for *enterprise* customers. **Nobody has built a unified, channel-agnostic, regulator-anchored trust layer for retail investors in a securities-market context.**

---

## 2. Solution Concept: The Three Pillars

SEBI Kavach bridges this gap with a three-sided platform:

1. **VerifyNet** — An authentication/trust registry where SEBI, exchanges, and registered intermediaries cryptographically sign their official communications.
2. **DetectNet** — An AI detection engine that scans suspicious synthetic media across every channel an investor uses, and correlates flagged events with real broker/demat account activity.
3. **ShieldTrain** — A continuous, gamified investor-education layer that inoculates users against the exact attack patterns DetectNet catches.

All three share one investor-facing app/bot/extension, so a user never has to think "which tool do I open".

---

## 3. Target Users

- **Primary:** Retail & first-generation investors (social-media-native, WhatsApp/Telegram-heavy).
- **Secondary:** Registered intermediaries (brokers, RIAs, IAs) — to prove their own comms are genuine and get transaction-correlated fraud alerts.
- **Tertiary:** Market infrastructure institutions (SEBI, NSE/BSE) — for signing authority and threat dashboards.

---

## 4. Channels Covered

| Channel | Threat type | Module |
|---|---|---|
| Email / SMS / WhatsApp | Phishing, fake SEBI notices, OTP scams | DetectNet-Text |
| Voice calls | Cloned-voice vishing (fake regulator) | DetectNet-Voice |
| Video | Deepfake CEO/expert videos | DetectNet-Video |
| Social media | AI-generated pump-and-dump content | DetectNet-Social |
| Broker/demat accounts | Transactions following a flagged event | DetectNet-Correlate |
| Official communications | Need to *prove* authenticity | VerifyNet |

---

## 5. Differentiation Summary

| Existing players | SEBI Kavach |
|---|---|
| Single channel (voice-only, or video-only) | **All channels** — voice, video, text, email, social, plus account-activity correlation |
| Detection only, or provenance only | **Both, integrated**: a flagged fake is cross-checked against the trust registry automatically |
| Enterprise-priced, enterprise UX | **Free/near-free**, WhatsApp-native, built for first-gen retail investors |
| Metadata-only provenance (C2PA alone) | **C2PA + invisible watermark fallback**, so authenticity survives screenshots/re-uploads |
| Detection alerts stop at "this looks fake" | **Correlated with real account activity** to distinguish noise from active fraud in progress |

---

## The Hackathon MVP Prototype

This repository contains a high-fidelity, interactive prototype demonstrating the complete end-to-end SEBI Kavach ecosystem based on the architecture plan.

### Key Prototype Features:
- **Interactive Login**: Role-based access (Investor vs. Admin) protected by a simulated biometric fingerprint flow.
- **Investor Dashboard**: Allows users to upload media from their PC or paste suspicious links to get a real-time AI verdict card.
- **Scam Radar**: A live, searchable early-warning feed of confirmed synthetic-media attacks.
- **ShieldTrain**: Gamified dashboard tracking the user's "Immunity Score" with an interactive practice quiz.
- **WhatsApp Bot Simulator**: A mobile-proportioned view proving how investors can "Forward-to-Verify" without installing a new app.
- **Social Feed Extension**: A mock Twitter (X) feed demonstrating how the VerifyNet badge authenticates official SEBI posts inline.
- **Admin & Correlator Console**: A dashboard for generating C2PA keys, reviewing escalated incidents, and resolving live threats where deepfake interaction was correlated with a broker API webhook.

---

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Lucide React
- **Backend (Mock)**: FastAPI (Python), Uvicorn
- **Styling**: Fully responsive Dark/Light mode design system

---

## How to Run Locally

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Setup Instructions
1. Clone the repository and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173/`

---

## Demo Guide & Cheat Codes

Because this is a prototype, we have built specific "cheat codes" into the UI to allow you to present a flawless live demo to the judges.

### Login Credentials
- **Investor Role**: 
  - Email: `investor@kavach.in`
  - Password: `investor123`
- **Admin Role**: 
  - Email: `admin@sebi.gov.in`
  - Password: `admin123`
*(Note: You can skip typing the OTP by clicking the "Use Biometrics / Fingerprint" button!)*

### Demonstrating DetectNet (File Uploads)
On the **Investor Dashboard**, when you click "Upload Media", the system reads the *filename* of the file you select from your PC to determine the AI response:
- **To show a 100% Verified result**: Upload any image containing the word `real` or `authentic` in the filename (e.g., `authentic_circular.pdf`).
- **To show a High-Risk Deepfake result**: Upload any image containing the word `fake` or `tampered` in the filename (e.g., `fake_ceo_video.mp4`).

### Demonstrating DetectNet (Links)
On the **Paste Link** tab, use these exact URLs to trigger specific verdicts:
- **Verified**: `https://nseindia.com/official-circular`
- **Deepfake**: `https://youtube.com/watch?v=fake-video`
- **Phishing**: `http://sebi-update-kyc.com`
- **Suspicious (Yellow)**: `https://t.me/sure-shot-options`

---

*Designed and Built for the SEBI Hackathon 2026.*
