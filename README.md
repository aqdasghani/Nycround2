<div align="center">
  <img src="public/hero.png" alt="QuickReply Hero" width="400" style="border-radius: 12px; margin-bottom: 20px;"/>
  
  # 🚀 QuickReply
  
  **Automate YouTube comment replies and save hours every week.**

  [![Status](https://img.shields.io/badge/Status-Hackathon_Ready-success)](#)
  [![Version](https://img.shields.io/badge/Version-v1.0.0-blue)](#)
  
  ---
  
  🌐 **Live Website & Demo**: **Check the [Releases](../../releases) section for our live deployment link and the latest build!**
</div>

## 💡 The Problem
Creators spend countless hours manually replying to the exact same repetitive comments ("Link?", "Notes?", "Github?"). This manual work destroys productivity, leads to creator burnout, and reduces overall audience engagement because creators simply cannot keep up with the volume.

## ✨ The Solution: QuickReply
QuickReply is a modern, premium **YouTube Comment Auto-Reply Platform**. It allows creators to automatically reply to viewer comments on automated videos using custom rule matches (Starts With, Contains, Equals, Regex), variables interpolation, and artificial intelligence-style suggestion systems. 

---

## 🤖 How We Used AI in this Project
This project was heavily co-piloted and accelerated using Artificial Intelligence. We integrated AI not just into the product's vision, but deeply into our development lifecycle to ship faster and better:

1. **🧠 Brainstorming the Idea**: We used AI as a sounding board to validate the creator problem, map out the automation flow, and identify the key friction points in existing YouTube community management tools.
2. **⚙️ Backend Development**: AI paired with us to design the entire YouTube API polling engine, the background worker processes (`route.ts`), and the complex logic behind the **Rule Builder** (parsing conditions like `contains`, `starts_with`, `exact_match`, and `reply_all`).
3. **🚀 Deployment**: AI helped us navigate tricky environment variables, resolve Google OAuth 2.0 redirect URI conflicts, fix Turbopack build errors, and streamline our deployment pipelines.
4. **📄 Making Documentation**: We leveraged AI to synthesize our chaotic code into clean, structural documentation. It helped us generate API specs, backend deep-dives, and system architecture docs.
5. **📊 Making PPT**: AI assisted in outlining our investor pitch deck, determining color palettes for our slides, and drafting compelling narrative text for our presentation.
6. **📝 Making this README.md**: Even this document was co-authored with AI to ensure maximum clarity, impact, and scannability for the hackathon judges!

---

## 🛠️ Tech Stack

We built QuickReply to be highly scalable, extremely fast, and visually premium.

* **Frontend Framework**: [Next.js 16](https://nextjs.org/) (App Router with Turbopack)
* **Language**: TypeScript
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Vanilla CSS for custom micro-animations
* **State Management**: [Zustand](https://github.com/pmndrs/zustand) for global dashboard state
* **Icons & Charts**: [Lucide React](https://lucide.dev/) + [Recharts](https://recharts.org/)
* **Database / Storage**: Hybrid Storage Layer (Local `db.json` for local development, dynamically falling back to **MongoDB** in serverless environments).
* **Auth**: Custom Google OAuth 2.0 integration (requesting `youtube.force-ssl` and `youtube.readonly` scopes).

---

## 🌟 Key Features

* **Real Google OAuth 2.0 Integration**: Securely connect real YouTube channels.
* **Interactive Dashboard Overview**: Monitor live comment polling, track performance charts, and view workspace collaborator audit logs.
* **Granular Automation Rules**: Configure priorities, conditions (`contains`, `starts with`, `equals`, `reply_all`), and customizable templates.
* **Live Comment Feed**: Watch as the system polls YouTube every 30 seconds and automatically replies to comments in real-time right before your eyes.
* **Subscription Quotas**: Handles Free limits (10 automated replies/day) and Premium limits (200 automated replies/day).

---

## 🚀 Getting Started (Local Setup)

Want to run QuickReply on your local machine?

1. **Clone the repository** and navigate into it:
   ```bash
   git clone <repo-url>
   cd Nycround2
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and define your Google Client credentials:
   ```env
   GOOGLE_CLIENT_ID="YOUR_CLIENT_ID"
   GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET"
   # MONGODB_URI="mongodb+srv://..." (Optional for local testing; falls back to local DB)
   ```
4. **Start the development server**:
   ```bash
   npm run dev
   ```
5. **Open your browser**: Navigate to [http://localhost:3000](http://localhost:3000).

---
*Built with ❤️ for the Hackathon*