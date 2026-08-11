# WebPOS — Smart Point of Sale with Computer-Vision Product Detection

A production-grade POS web application for modern retail (UMKM/small shops) with **automatic product detection powered by Computer Vision** running fully in the browser via TensorFlow.js.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61DAFB) ![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.x-orange) ![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

**🧾 Smart POS (Owner)**
- Real-time **AI product detection** — point the camera at a product, the POS identifies it automatically and adds it to the cart (350ms scan loop, no barcode needed)
- Manual barcode fallback, product search, quantity & stock-cap enforcement
- Sales dashboard with KPIs (revenue, profit, top products), charts, and daily activity
- Product catalog, stock adjustment with negative-stock protection, reports & profit/loss
- Settings, staff accounts, tax/profile management

**🛠 Administration (Developer / Ops)**
- **Data Collector** — manage product classes + barcode mapping, bulk dataset sync to HuggingFace
- **AI Model Deployment** — train remotely (Kaggle), download TFJS output, register, and activate model versions
- **Correction Curation** — review cashier AI corrections, approve/reject, feed back into the dataset
- Tenant & owner management, audit trail logs

## 🧠 How the AI Pipeline Works

```
Cashier camera/module ─▶ TFJS model (in-browser) ─▶ product match (barcode → name) ─▶ cart
        │
        └─ low-confidence? ─▶ koreksi ─▶ admin kurasi ─▶ dataset_foto ─▶ HuggingFace
                                                                        │
                                                         Kaggle GPU training ─▶ TFJS export ─▶ deploy
```

- **Model**: MobileNetV3-Large + CBAM, 24+ classes, TFJS `graph-model` format with 4 weight shards
- **Runtime**: 100% client-side inference — no server GPU needed, ~350ms per scan
- **Training**: headless pipelines on Kaggle GPU (P100/T4), auto-registered on completion
- **Dataset**: versioned on HuggingFace, curated via admin review loop

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A running backend API (Fastify + Supabase), see [pos-backend](https://github.com/anoderb/pos-backend)

### Install

```bash
npm install
cp .env.example .env.local    # adjust API URL
npm run dev                   # → http://localhost:3001
```

### Production build

```bash
npm run build
npm run start                 # → http://localhost:3001
```

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | auto-detect | Backend base URL. Prod: `https://api.your-domain.com/api`. Leave empty to auto-resolve (deployed = `https://api.<tld>`, localhost = `http://127.0.0.1:5000/api`) |
| `NEXT_PUBLIC_HF_REPO` | `your-org/dataset-name` | HuggingFace dataset repo for the training pipeline |
| `NEXT_PUBLIC_APP_NAME` | `WebPOS` | Brand name shown in UI |
| `NEXT_PUBLIC_APP_TAGLINE` | `Smart POS for modern retail` | Login-page tagline |

**Note:** local dev auto-rewrites model URLs from the deployed API to your local backend (`127.0.0.1:5000`) to avoid CORS issues. Production deployments are never rewritten.

## 🗂 Project Structure

```
src/
├── app/
│   ├── (auth)/login/         owner login
│   ├── (admin)/admin/        admin panel (dashboard, data collector, kurasi, model, audit)
│   ├── (owner)/owner/        owner portal (POS, dashboard, produk, laporan, pengaturan)
│   └── pos-engine.jsx        POS engine + AI detection (used by /owner/pos)
├── components/
│   ├── ui/                   reusable UI primitives
│   └── layout/{admin,owner}  sidebars, navbars, drawers
├── lib/
│   ├── api.js                axios + JWT interceptor, dynamic base URL
│   ├── config.js             env-driven app config
│   ├── tf.js                 lazy TensorFlow.js loader (2MB only on demand)
│   └── utils.js              cn, formatRupiah, helpers
└── store/                    Zustand stores (auth, adminAuth, cart)
```

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, Zustand
- **AI**: TensorFlow.js 4.x (graph-model inference), MobileNetV3+CBAM
- **Infra**: Fastify backend, Supabase (Postgres + Storage), HuggingFace datasets, Kaggle GPU training, Vercel deployment

## 📄 License

MIT © anoderb