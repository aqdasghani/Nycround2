# TubeFlow 🚀

[![Netlify Status](https://api.netlify.com/api/v1/badges/3cbab9da-4f02-4693-b9d0-d2b0e42e7a39/deploy-status)](https://app.netlify.com/projects/tubeflow-com/deploys)

TubeFlow is a modern, premium **YouTube Comment Auto-Reply Platform** built with Next.js 16 (App Router), Tailwind CSS v4, and TypeScript. It allows creators to automatically reply to viewer comments on automated videos using custom rule matches, variables interpolation, and artificial intelligence-style suggestion systems.

---

## 🔑 Key Features
* **Real Google OAuth 2.0 Integration**: Securely connect real YouTube channels requesting only required permission scopes (`youtube.force-ssl` and `youtube.readonly`).
* **Interactive Dashboard Overview**: Monitor comment polling, save creator hours, track performance charts, and review workspace collaborator audit logs.
* **Granular Automation Rules**: Configure priorities, conditions (e.g. contains, starts with, regex), response delay limits, and customizable templates.
* **Hybrid Storage Layer**: Supports local `db.json` storage for local development and falls back dynamically to a persistent **MongoDB** cluster in serverless environments.
* **Subscription Quotas**: Handles Free limits (10 automated replies per 24 hours) and Premium limits (200 automated replies per 24 hours).

---

## 🛠️ Getting Started

### Local Setup
1. Clone the repository and navigate into it.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory and define your client ID/secret:
   ```env
   GOOGLE_CLIENT_ID="YOUR_CLIENT_ID"
   GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET"
   # MONGODB_URI="mongodb+srv://..." (Optional for local testing; falls back to src/data/db.json)
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚡ Deployment on Netlify

Since Netlify serverless functions run in a read-only, ephemeral container environment, local file writing (`db.json`) is not persistent. To deploy successfully:

### 1. Register Google Developer Console Redirect URIs
In the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials), find your OAuth 2.0 Client ID and add these authorized redirect URIs:
* Local: `http://localhost:3000/api/auth/callback/google`
* Production: `https://<your-netlify-site-name>.netlify.app/api/auth/callback/google`

### 2. Configure Environment Variables in Netlify
Go to your Netlify Project Settings ➡️ **Environment variables** and configure:
* `GOOGLE_CLIENT_ID`: Your Google OAuth client ID.
* `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret.
* `MONGODB_URI`: Connection string to your hosted MongoDB cluster (e.g., MongoDB Atlas).

---

## 📦 Tech Stack
* **Framework**: Next.js 16 (App Router with Turbopack)
* **Styling**: Tailwind CSS v4 + Vanilla CSS
* **Database**: MongoDB Node Driver + Local Files JSON adapter
* **Icons & Charts**: Lucide React + Recharts
* **State Management**: Zustand

## where we use ai 
1.In backend createting , rule builder 