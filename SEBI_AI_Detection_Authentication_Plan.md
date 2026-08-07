# AI-Driven Detection & Authentication Platform for Securities Markets
### End-to-End MVP Plan — SEBI Hackathon (Problem Statement 1)

---

## 1. Gap Analysis — What Exists vs. What's Missing

| Layer | Who does it today | Gap for securities markets |
|---|---|---|
| Voice deepfake detection | Pindrop, Resemble Detect | Not tuned to broker/regulator call patterns; no SEBI-specific trust registry behind it |
| Multi-channel phishing/synthetic content monitoring | Adaptive Security, KnowBe4 | Built for enterprise employee training, not retail investors on WhatsApp/Telegram/social media |
| Content provenance for legitimate media | C2PA (Adobe, Google, BBC) | Only proves a file wasn't altered *after* signing — does **not** verify who is *allowed* to sign as "SEBI"/"NSE"/"a registered RIA," and metadata can be stripped on re-upload |
| Enterprise deepfake defense | GetReal Security, Sensity, Truepic | Priced/built for large enterprises, not for a national regulator serving 10 crore+ retail investors free of cost |
| Security-awareness simulation training | Adaptive Security, KnowBe4 | Exists for corporate employees; nothing equivalent exists for retail investors |
| Fraud-transaction correlation | JPMorgan, Mastercard (internal, bank-side) | Built for card/payment fraud, not linked to securities-market social-engineering events |
| Regulatory enforcement | SEC/FinCEN/FBI alerts | Reactive (after-the-fact), not real-time or investor-facing |

**The core gap:** every existing player solves *either* detection *or* authentication, for *one* channel, for *enterprise* customers, and none of them close the loop back to the retail investor in real time. **Nobody has built a unified, channel-agnostic, regulator-anchored trust layer for retail investors in a securities-market context.** That is the wedge for this solution.

**Deliberately out of scope (and why):** KYC/synthetic-identity document fraud at account-opening (fake PAN/Aadhaar/video-KYC) is a related but distinct problem — it's about *account-opening integrity*, not *communication authenticity*. Several deepfake vendors also sell into that space, but folding it in here would dilute focus and duplicate work already owned by SEBI's KYC Registration Agencies (KRAs) and depositories. This platform assumes identity onboarding is handled elsewhere and focuses entirely on communications and content.

---

## 2. Solution Concept

**"SEBI Shield"** (working name) — a market-ready, three-sided platform:

1. **VerifyNet** — an authentication/trust registry where SEBI, exchanges, listed companies, and registered intermediaries cryptographically sign their official communications (video, voice, email, circulars, social posts). Anyone can verify authenticity in one tap.
2. **DetectNet** — an AI detection engine that scans/flags suspicious synthetic media and phishing content across every channel a retail investor uses, correlates flagged events with real account activity, and routes confirmed threats into a public early-warning feed and SEBI's enforcement pipeline.
3. **ShieldTrain** — a continuous, gamified investor-education layer that inoculates users against the exact attack patterns DetectNet catches, closing the human-behavior gap that pure detection tools leave open.

All three share one investor-facing app/bot/extension, so a user never has to think "which tool do I open" — they forward, upload, or link anything suspicious to one place and get a verdict, a reason, and — if they're actually at risk — a real-time nudge.

---

## 3. Target Users

- **Primary:** Retail & first-generation investors (social-media-native, WhatsApp/Telegram-heavy, price-sensitive — must be free/near-free and low-friction)
- **Secondary:** Registered intermediaries (brokers, RIAs, IAs) — need to prove their own comms are genuine, check inbound client comms, and get transaction-correlated fraud alerts on their platforms
- **Tertiary:** Market infrastructure institutions (SEBI, NSE/BSE, depositories, listed companies) — need a signing authority, a threat dashboard, and enforcement-grade evidence packages

---

## 4. Channels Covered

| Channel | Threat type | Module |
|---|---|---|
| Email | LLM-crafted phishing, spoofed sender | DetectNet-Email |
| Voice calls | Cloned-voice vishing (fake CEO/regulator) | DetectNet-Voice |
| Video (WhatsApp/YouTube/Telegram) | Deepfake CEO/CIO/expert videos | DetectNet-Video |
| Social media (X, Instagram, YouTube Shorts, Telegram channels) | AI-generated pump-and-dump content, fake tip pages | DetectNet-Social |
| SMS/WhatsApp text | Fake SEBI/exchange notices, OTP scams | DetectNet-Text |
| Broker/demat account activity | Transactions following a flagged event | DetectNet-Correlate |
| Official communications (all above, outbound) | Need to *prove* authenticity | VerifyNet |
| Investor behavior over time | Susceptibility to specific scam patterns | ShieldTrain |

---

## 5. High-Level Architecture

```
                         ┌────────────────────────────┐
                         │   INVESTOR-FACING LAYER     │
                         │  Web App | Mobile App |     │
                         │  Browser Ext | WhatsApp Bot │
                         └──────────────┬──────────────┘
                                        │ (upload/forward/link)
                         ┌──────────────▼──────────────┐
                         │        API GATEWAY           │
                         │  Auth, rate-limit, routing    │
                         └───┬───────────────────┬──────┘
              ┌──────────────▼─────┐   ┌─────────▼───────────┐
              │   DETECTNET CORE    │   │    VERIFYNET CORE     │
              │  (async job queue)  │   │  (signature/registry) │
              ├─────────────────────┤   ├────────────────────────┤
              │ Voice deepfake model│   │ SEBI/Exchange/Company   │
              │ Video deepfake model│   │ signing key management  │
              │ Text/LLM-phish model│   │ C2PA manifest issuer +   │
              │ Image/social model  │   │ verifier                │
              │ URL/domain reputation│  │ Invisible forensic       │
              │ Near-dup campaign    │  │ watermark (fallback when │
              │ clustering           │  │ metadata is stripped)    │
              └──────────┬───────────┘  │ Trust List DB (Postgres)│
                         │              └───────────┬────────────┘
              ┌──────────▼───────────┐              │
              │ TRANSACTION CORRELATOR│              │
              │ Links flagged events  │              │
              │ to broker/demat       │              │
              │ activity via broker   │              │
              │ API webhooks          │              │
              └──────────┬───────────┘              │
                         │                            │
              ┌──────────▼────────────────────────────▼───────────┐
              │           EVIDENCE & SCORING ENGINE                 │
              │  Confidence score, explainability, model ensemble,  │
              │  severity escalation on transaction correlation      │
              └──────────────────────┬───────────────────────────┘
                                     │
              ┌──────────────────────▼───────────────────────────┐
              │        THREAT INTELLIGENCE & FEEDBACK LOOP          │
              │  Public alert feed | SEBI SCORES/enforcement API   │
              │  Crowd-reported takedown queue | Model retraining   │
              └──────────────────────┬───────────────────────────┘
                                     │
              ┌──────────────────────▼───────────────────────────┐
              │              SHIELDTRAIN ENGINE                     │
              │  Simulated-scam campaigns, per-user risk profile,   │
              │  adaptive difficulty, certification for brokers'    │
              │  client onboarding                                  │
              └───────────────────────────────────────────────────┘

     Data stores: Postgres (users, registry, cases) · Object storage
     (media evidence, S3-compatible) · Vector DB (embeddings for
     near-duplicate scam detection) · Redis (queues/cache)
```

---

## 6. Core Modules & Features

### 6.1 VerifyNet (Authentication)
- **Digital signing SDK** for SEBI/exchanges/listed cos/intermediaries — signs video, audio, email headers, and social posts using PKI, built on the **C2PA open standard** for interoperability with Adobe/Google/BBC tooling.
- **India-specific Trust List** — a SEBI-run certificate authority that answers the question C2PA itself doesn't: *who is allowed to sign as whom* (SEBI, NSE, BSE, CDSL/NSDL, each listed company's IR team, each registered intermediary's SEBI registration number).
- **Invisible forensic watermarking as a fallback layer** — embedded at signing time so authenticity survives screenshots, re-uploads, and platform re-compression even when C2PA metadata gets stripped, directly closing the durability gap that pure metadata-based provenance has.
- **One-tap verify** — scan a QR/badge on a video or email → shows "✅ Verified: NSE Investor Relations, signed 12 Jul 2026" or "⚠️ No valid signature found."
- **Auto-badge injection** for official YouTube/webinar streams and press releases via API integration with exchanges' CMS.

### 6.2 DetectNet (Detection)
- **Voice deepfake detector** — spectral + liveness-style classifier tuned on Indian-accent broker/regulator call samples; flags cloned-voice vishing on uploaded/live call recordings.
- **Video deepfake detector** — frame-level CNN/ViT ensemble + temporal lip-sync consistency check, fine-tuned on Indian financial-influencer and CEO footage to reduce false positives on legitimate low-bandwidth video calls.
- **Text/LLM-phishing detector** — transformer classifier trained on SEBI/exchange impersonation templates and urgency/credential-harvesting language patterns; works across email, SMS, WhatsApp forwards.
- **Social/campaign detector** — clusters near-duplicate AI-generated "guaranteed returns" posts across handles using embedding similarity, catching coordinated pump-and-dump networks rather than single messages.
- **URL/domain reputation** — cross-checks links against SEBI's registered-intermediary database and known scam-domain lists.
- **Transaction correlation engine** — via opt-in broker/depository webhook integration, links a flagged deepfake/phishing event to what happens next (login, fund transfer, trade instruction) and auto-escalates severity when a real transaction follows a flagged event within a risk window. This is what turns a detection alert into an actionable fraud signal, the way bank-side fraud systems already do for payments.
- **Unified confidence score + explainability** — every verdict shows *why* (e.g., "voice pitch variance inconsistent with natural speech," "sender domain registered 3 days ago, mimics sebi.gov.in").

### 6.3 ShieldTrain (Investor Immunity Training)
- **Consent-based simulated-scam campaigns** — periodic, realistic (but harmless) simulated phishing/deepfake messages sent to opted-in users, modeled on Adaptive Security's employee-training approach but redesigned for retail investors.
- **Per-user risk profile** — tracks which scam patterns a user falls for, adapts future simulations to reinforce weak spots.
- **Micro-learning cards** — 30-second explainers triggered right after a user encounters (real or simulated) a flagged threat, while the moment is fresh.
- **Broker/RIA client certification** — intermediaries can enroll their client base and get a completion dashboard, turning investor education into a measurable compliance artifact.

### 6.4 Investor Protection Layer (the retail-facing glue)
- **"Forward to Verify" WhatsApp/Telegram bot** — investors forward a suspicious video/voice note/message; bot replies with a verdict in under 30 seconds. This is the single biggest gap versus enterprise tools: none of them are built for a WhatsApp-first retail audience.
- **Browser extension** — flags suspicious content inline on social media/webmail, and shows the VerifyNet badge automatically on signed official posts.
- **Public early-warning feed** — a live, searchable "scam radar" of confirmed synthetic-media attacks, so investors can check before they act, not just after.
- **One-click report-to-SEBI** — every flagged item can be escalated with an evidence package (hash, model scores, metadata, transaction correlation if any) directly into SEBI's SCORES grievance system via API.

---

## 7. Frontend

| Surface | Stack | Purpose |
|---|---|---|
| Web app (investor + intermediary dashboard) | React + Tailwind, Vite | Upload/verify content, view trust badges, case history, ShieldTrain progress |
| Mobile app | React Native | Same as web, plus push alerts for scams targeting the user's watchlist stocks and ShieldTrain nudges |
| Browser extension | Chrome/Edge Manifest V3, vanilla JS + React popup | Inline flagging on social/webmail, VerifyNet badge overlay |
| WhatsApp/Telegram bot | Node.js + WhatsApp Business Cloud API / Telegram Bot API | Zero-install channel — highest reach for first-gen investors |
| SEBI/Exchange admin console | React + role-based access | Manage signing keys, review escalated/correlated cases, publish alerts, monitor ShieldTrain adoption |

**Design principles:** one verdict-card design reused everywhere (green "Verified," red "High-risk synthetic content," yellow "Unverified — proceed with caution," orange "Flagged content + suspicious account activity detected"), so users learn one visual language across every surface.

---

## 8. Backend & ML Pipeline

- **API layer:** FastAPI (Python) — REST + webhook endpoints for bot/extension/app/broker integrations.
- **Async processing:** Celery + RabbitMQ/Kafka for media jobs (video/voice analysis shouldn't block the request).
- **ML serving:** models containerized, served via TorchServe/Triton, one microservice per model type (voice, video, text, image, clustering), horizontally scalable behind the gateway.
- **Model stack:**
  - Voice: anti-spoofing model trained on ASVspoof-style data, fine-tuned on Indian-accent samples.
  - Video: EfficientNet/XceptionNet deepfake baseline (FaceForensics++-trained) + temporal consistency scoring.
  - Text/phishing: fine-tuned transformer (RoBERTa/DistilBERT) on phishing + SEBI-impersonation patterns.
  - Social clustering: sentence-embedding similarity (MiniLM) + DBSCAN for campaign detection.
  - Transaction correlation: rules engine + anomaly scoring on time-windowed event sequences (flagged content → login/transfer/trade), not a black-box model, so it stays auditable for regulatory use.
- **Signing/PKI:** standard X.509 + C2PA manifest libraries (c2pa-rs/c2patool) plus a watermarking library for the fallback layer, rather than building crypto from scratch.
- **Databases:** PostgreSQL (users, trust registry, case records, correlation logs), S3-compatible object store (evidence media), Redis (cache/queue), pgvector/Qdrant (near-duplicate scam clustering).
- **Broker/depository integration layer:** opt-in webhook contracts with brokers/depositories for the transaction correlator — this is the one component that requires external partnership agreements and should be designed API-first so it can onboard brokers incrementally.
- **Observability:** structured logging + a model-drift dashboard, since deepfake generators evolve fast and detection accuracy decays over time.

---

## 9. Data & Evaluation Strategy

- **Training/eval data:** public deepfake benchmarks (FaceForensics++, ASVspoof, DFDC) + a curated SEBI-impersonation phishing corpus (clearly labeled synthetic training data) + real scam examples from SEBI's published investor-alert archive.
- **Metrics to report:** precision/recall/F1 per channel, AUC-ROC for deepfake classifiers, false-positive rate on legitimate low-quality video calls (critical — a high false-positive rate on genuine investor-education webinars would kill trust), verdict latency (target: under 30 seconds for the bot flow), and correlation-engine precision (rate of true fraud caught vs. false escalations).
- **Human-in-the-loop review** for borderline/high-impact cases (above a reach or transaction-value threshold) before they hit the public alert feed or trigger correlation-based escalation, to avoid false accusations against real companies/executives.
- **ShieldTrain effectiveness metric:** % reduction in simulated-scam click-through rate per user over time — this is the platform's own feedback signal that the education loop is working, not just the detection models.

---

## 10. UI/UX Flows (key screens)

1. **Investor onboarding:** phone-number OTP login (WhatsApp-first) → optional watchlist of stocks/brokers → opt-in to ShieldTrain simulations → tutorial card explaining the four verdict colors.
2. **Forward-to-verify flow (bot):** user forwards content → bot acknowledges → shows verdict card with confidence score, plain-language explanation, transaction-correlation warning if applicable, and "Report to SEBI" button.
3. **VerifyNet badge check (extension):** badge auto-appears next to signed official content on X/YouTube; clicking shows signer identity, registration number, signing timestamp, and watermark-verification fallback status.
4. **ShieldTrain moment:** immediately after any real or simulated flag, a 30-second card appears explaining the specific red flag pattern, with a "test yourself" mini-quiz.
5. **Intermediary dashboard:** brokers/RIAs see a feed of content impersonating their brand, correlated fraud alerts on their client accounts (opt-in), can request takedown, and manage their own signing certificate and client ShieldTrain completion rates.
6. **SEBI admin console:** issue/revoke signing certificates, review escalated/correlated high-risk cases, publish to the public early-warning feed, export enforcement evidence packages.
7. **Public scam-radar feed:** searchable/filterable by stock ticker, channel, and date — no login required, so it works as a deterrent even for non-registered users.

---

## 11. Security, Privacy & Compliance

- Signing keys held in an HSM/KMS (AWS KMS/Azure Key Vault) — never in application code.
- Uploaded investor content encrypted at rest; auto-purge policy for non-flagged uploads (don't retain innocent investors' forwarded messages longer than needed for scoring).
- Transaction-correlation data accessed only via opt-in broker consent, minimally scoped (event timestamps and type, not full account data), and logged for audit.
- Rate limiting + abuse detection on the bot to prevent malicious mass-scanning of competitors' legitimate content.
- Aligned with SEBI's existing SCORES grievance framework and India's DPDP Act for data handling.

---

## 12. Differentiation Summary

| Existing players | This solution |
|---|---|
| Single channel (voice-only, or video-only) | All channels — voice, video, text, email, social, plus account-activity correlation — one intake point |
| Detection only, or provenance only | Both, integrated: a flagged fake is cross-checked against the trust registry automatically |
| Enterprise-priced, enterprise UX | Free/near-free, WhatsApp-native, built for first-gen retail investors |
| Generic global training data | Fine-tuned on Indian securities-market impersonation patterns and SEBI/exchange identity |
| No regulator-anchored trust list | SEBI-run Trust List makes "who is allowed to sign as SEBI/NSE/a listed company" an authoritative, checkable fact |
| Metadata-only provenance (C2PA alone) | C2PA + invisible watermark fallback, so authenticity survives screenshots/re-uploads |
| Detection alerts stop at "this looks fake" | Correlated with real account activity to distinguish noise from active fraud in progress |
| Employee-training simulations exist for corporates, not investors | ShieldTrain brings the same inoculation approach to retail investors, with broker-facing certification |
| Reactive enforcement | Real-time investor-facing verdicts + a public early-warning feed |

---

## 13. Success Metrics

- Detection F1-score per channel (benchmarked against public datasets)
- Verdict latency (target: under 30 seconds end-to-end for the bot flow)
- False-positive rate on legitimate content (must stay low enough to preserve trust)
- Transaction-correlation precision (true fraud caught vs. false escalations)
- ShieldTrain simulated-click-through reduction over time (education efficacy)
- Number of channels covered in one unified flow (all major channels, vs. one per competitor tool)
- Investor reach via WhatsApp-first, zero-install design
