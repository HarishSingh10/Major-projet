# 🛡️ CyberWatch Sentinel - AI-Powered Threat Intelligence Platform

CyberWatch Sentinel is a high-end, real-time cybersecurity monitoring dashboard built for the modern threat landscape. It leverages **Groq AI (Llama 3.3)** to parse live news feeds, detect fraud in chats, and simulate vulnerability scans.

![Cyber Sentinel Dashboard Overview](https://raw.githubusercontent.com/HarishSingh10/yyj/main/screenshot.png) *(Note: Add your actual screenshot here after pushing)*

## 🌟 Key Features

### 0. 📱 WhatsApp Bot Integration (NEW!)
- **Live Chat Interface:** Interact with CyberWatch Sentinel directly through WhatsApp.
- **Command System:** `/threats`, `/scan`, `/analyze`, `/critical` commands.
- **AI Assistant:** Natural language queries about cybersecurity.
- **Real-time Alerts:** Get notified about critical threats instantly.

### 1. 🕷️ Live Threat Intelligence (AI-Parsed)
- **Automatic Scraping:** Monitors global sources like The Hacker News and BleepingComputer.
- **AI Triage:** Uses Groq AI to extract Severity, Vector, and Mitigation advice from raw news logs in real-time.
- **Live Ticker:** A scrolling marquee in the header providing instant "War Room" updates on global incidents.

### 2. 🤖 AI Lead Analyst & Chatbot
- Integrated **Forensic AI Analyst** capable of answering complex security questions based on the live data within the dashboard.
- Uses **Llama-3.3-70b-versatile** for low-latency, high-accuracy intelligence.

### 3. 🛡️ FraudShield (WhatsApp Chat Analyzer)
- **Forensic NLP:** Analyzes chat logs (exported from WhatsApp/Telegram) for social engineering patterns.
- **Scam Detection:** Identifies impersonation, urgency-based pressure, and suspicious payment requests.
- **Analysis Report:** Generates a forensic report with risk probability and specific red flags.

### 4. 🔍 Vulnerability Scanner (Simulation)
- **Terminal Simulation:** A retro-style console interface for running "audits" on domains/IPs.
- **AI-Generated CVE Reports:** Returns realistic, intelligence-backed vulnerability signatures and fix recommendations.

### 5. 📊 Advanced Visualizations
- **Global Risk Index:** A dynamic gauge showing the current global threat level percentage.
- **Sector Heatmap:** Real-time distribution of attacks across industries (Finance, Healthcare, Tech, etc.).
- **Incident Trend:** 14-day tracking of active vs. resolved threats.

## 🚀 Tech Stack

- **Frontend:** React.js, Tailwind CSS, Lucide React, Recharts, Framer Motion.
- **Backend:** Node.js, Express.js, Node-Cron (Scheduler), RSS-Parser.
- **Intelligence:** Groq Cloud API (Llama-3.3-70b).
- **Icons:** Lucide-React.

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- A Groq API Key (Get it from [console.groq.com](https://console.groq.com/))

### 1. Clone the repository
```bash
git clone https://github.com/HarishSingh10/cyberwatch-sentinel.git
cd cyberwatch-sentinel
```

### 2. Setup Environment Variables
Create a `.env.local` inside the root directory and add your key:
```env
GROQ_API_KEY=your_api_key_here
```

### 3. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 4. Spin up the Engines
**Run the Backend (Port 5000):**
```bash
cd server
npm start
```

**Run the Frontend (Port 3000):**
In a new terminal:
```bash
npm run dev
```

### 5. (Optional) Enable WhatsApp Bot
See [WHATSAPP_SETUP.md](./WHATSAPP_SETUP.md) for detailed instructions.

**Quick Start:**
```bash
cd server
npm install @whiskeysockets/baileys @hapi/boom pino qrcode-terminal
```

Then uncomment the WhatsApp bot lines in `server/src/index.ts` and restart the server. Scan the QR code with WhatsApp!

## 📜 License
This project is licensed under the MIT License - see the LICENSE file for details.

---
**Developed by Harish Singh** 🚀
*Major Project - Cybersecurity AI Integration*
