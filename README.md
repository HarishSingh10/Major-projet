# 🛡️ CyberWatch Sentinel - AI-Powered Threat Intelligence Platform

CyberWatch Sentinel is a real-time cybersecurity monitoring dashboard that leverages **Groq AI (Llama 3.3-70B)** to parse live threat intelligence feeds, analyze fraud patterns, and provide actionable security insights.

---

## 🌟 Key Features

### 1. 🕷️ **Live Threat Intelligence Feed**
- **Real-Time Data Sources:** Automatically fetches and parses cybersecurity news from 8 trusted RSS feeds:
  - The Hacker News
  - BleepingComputer
  - Krebs on Security
  - Dark Reading
  - Threatpost
  - SecurityWeek
  - Infosecurity Magazine
  - CyberScoop
- **AI-Powered Analysis:** Uses Groq AI (Llama 3.3-70B) to extract structured threat data including:
  - Threat severity (Critical, High, Medium, Low)
  - Attack type (Ransomware, DDoS, Phishing, Data Breach, etc.)
  - Affected sector (Finance, Healthcare, Technology, etc.)
  - Threat actors (APT groups, ransomware gangs)
  - Geographic location and impact score
- **Automated Updates:** Cron job runs every 15 minutes to fetch latest threats
- **Live Ticker:** Scrolling marquee displays breaking threats in real-time

### 2. 📊 **Interactive Dashboard & Visualizations**
- **Global Risk Index:** Dynamic gauge showing current threat level (0-100%)
- **Sector Vulnerability Heatmap:** Real-time attack distribution across industries
- **14-Day Incident Trend:** Area chart tracking threat volume over time
- **Severity Distribution:** Bar chart showing Critical/High/Medium/Low breakdown
- **Recent Incidents Table:** Latest threats with severity badges and status

### 3. 🗺️ **Global Threat Map**
- **Interactive World Map:** Visualizes threat locations using Leaflet.js
- **Cluster Markers:** Groups nearby incidents for better visibility
- **Severity-Based Colors:** Red (Critical), Orange (High), Yellow (Medium), Blue (Low)
- **Detailed Popups:** Click markers to see full incident details

### 4. 🤖 **AI Lead Analyst Chatbot**
- **Context-Aware Intelligence:** Ask questions about current threats in your dashboard
- **Natural Language Processing:** Powered by Llama 3.3-70B for accurate responses
- **Security Recommendations:** Get mitigation strategies and risk assessments
- **Conversational Interface:** Floating chat widget accessible from any page

### 5. 🛡️ **FraudShield - WhatsApp Chat Analyzer**
- **Social Engineering Detection:** Analyzes chat logs for fraud patterns
- **Risk Assessment:** Provides fraud probability score (0-100%)
- **Red Flag Identification:** Highlights suspicious phrases and tactics
- **Expert Analysis:** AI-generated forensic report with recommendations
- **Pattern Recognition:** Detects urgency tactics, impersonation, financial requests

### 6. 📱 **WhatsApp Bot Integration** *(Optional)*
- **Command System:** `/threats`, `/critical`, `/help` commands
- **Real-Time Alerts:** Get notified about critical threats
- **Natural Language Queries:** Ask the bot about cybersecurity topics
- **QR Code Authentication:** Easy setup with WhatsApp Web

---

## 🚀 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Recharts** - Data visualization
- **Leaflet.js** - Interactive maps
- **Lucide React** - Icon library
- **date-fns** - Date formatting

### Backend
- **Node.js** with Express
- **TypeScript** - Type safety
- **Groq SDK** - AI integration (Llama 3.3-70B)
- **RSS Parser** - Feed parsing
- **node-cron** - Scheduled tasks
- **CORS** - Cross-origin support

### AI & Intelligence
- **Groq Cloud API** - Ultra-fast LLM inference
- **Llama 3.3-70B-Versatile** - Advanced language model
- **Structured JSON Output** - Reliable data extraction

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** v18 or higher
- **npm** or **yarn**
- **Groq API Key** - Get free credits at [console.groq.com](https://console.groq.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/cyberwatch-sentinel.git
cd cyberwatch-sentinel
```

### 2. Setup Environment Variables
Create a `.env.local` file in the **root directory**:
```env
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
```

### 3. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
cd ..
```

### 4. Start the Application

**Terminal 1 - Backend Server (Port 5000):**
```bash
cd server
npm start
```

**Terminal 2 - Frontend Dev Server (Port 3002):**
```bash
npm run dev
```

### 5. Access the Dashboard
Open your browser and navigate to:
```
http://localhost:3002/
```

---

## 📁 Project Structure

```
cyberwatch-sentinel/
├── components/           # React components
│   ├── AIAnalyst.tsx    # Chatbot interface
│   ├── Layout.tsx       # Main layout & navigation
│   ├── Map.tsx          # Leaflet threat map
│   └── UIComponents.tsx # Reusable UI elements
├── pages/               # Route pages
│   ├── Overview.tsx     # Main dashboard
│   ├── Feed.tsx         # Incident feed table
│   ├── Visualize.tsx    # Charts & graphs
│   ├── Intelligence.tsx # Threat intelligence page
│   └── FraudShield.tsx  # Chat analyzer
├── server/              # Backend API
│   └── src/
│       ├── index.ts     # Main server & API routes
│       ├── qr-server.ts # QR code viewer
│       └── whatsapp-*.ts # WhatsApp bot modules
├── services/
│   └── mockData.ts      # Fallback data generator
├── types.ts             # TypeScript interfaces
├── App.tsx              # Root component
├── index.tsx            # React entry point
└── README.md            # This file
```

---

## 🔌 API Endpoints

### `GET /api/incidents`
Returns all threat incidents (live + pre-seeded data)

**Response:**
```json
[
  {
    "id": "e1a001",
    "title": "MOVEit Transfer Zero-Day Exploited",
    "description": "Critical SQL injection vulnerability...",
    "date": "2026-04-28T08:00:00Z",
    "severity": "Critical",
    "status": "Investigating",
    "type": "Ransomware",
    "sector": "Technology",
    "source": "https://thehackernews.com",
    "threatActor": "Cl0p",
    "location": { "lat": 40.7128, "lng": -74.0060, "country": "United States", "city": "New York" },
    "impactScore": 95
  }
]
```

### `POST /api/chat`
AI chatbot endpoint for threat intelligence queries

**Request:**
```json
{
  "message": "What are the current critical threats?",
  "history": []
}
```

**Response:**
```json
{
  "response": "Based on our current threat intelligence database..."
}
```

### `POST /api/analyze-chat`
FraudShield chat analysis endpoint

**Request:**
```json
{
  "chatText": "Hello sir, your bank account has been compromised..."
}
```

**Response:**
```json
{
  "riskLevel": "High",
  "fraudProbability": 85,
  "detectedPatterns": ["Urgency tactics", "Impersonation"],
  "expertAnalysis": "This conversation exhibits...",
  "redFlags": [...],
  "recommendation": "DO NOT respond..."
}
```

### `POST /api/fetch-live`
Manually trigger RSS feed fetch (for testing)

---

## 🎨 Features in Detail

### Live Threat Intelligence
The system automatically:
1. Fetches RSS feeds every 15 minutes
2. Extracts latest 3 articles from each source
3. Sends article content to Groq AI for analysis
4. Structures data into standardized incident format
5. Adds to in-memory database (keeps latest 100)
6. Updates frontend in real-time

### AI Chatbot
- Context-aware: Has access to latest 10 incidents
- Professional tone: Acts as a Lead Security Analyst
- Actionable advice: Provides mitigation strategies
- Fallback responses: Works even if API fails

### FraudShield
Detects common scam patterns:
- **Urgency tactics:** "Act now or lose access"
- **Impersonation:** Fake bank/government officials
- **Financial requests:** Asking for money/OTP/credentials
- **Language anomalies:** Poor grammar, formal tone mismatches

---

## 🚧 Known Limitations

- **Vulnerability Scanner:** Commented out (non-functional simulation)
- **In-Memory Storage:** Incidents reset on server restart (no database)
- **RSS Feed Dependency:** Data quality depends on source availability
- **Rate Limits:** Groq API has usage limits on free tier
- **No Authentication:** Dashboard is publicly accessible

---

## 🔮 Future Enhancements

- [ ] PostgreSQL/MongoDB integration for persistent storage
- [ ] User authentication & role-based access control
- [ ] Email/SMS alerts for critical threats
- [ ] Custom RSS feed configuration
- [ ] Export reports (PDF/CSV)
- [ ] Dark web monitoring integration
- [ ] Real vulnerability scanning (Nmap/OpenVAS integration)
- [ ] Multi-language support

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Harish Singh**  
Cybersecurity AI Integration Project

---

## 🙏 Acknowledgments

- **Groq** - For providing ultra-fast LLM inference
- **The Hacker News, BleepingComputer, Krebs on Security** - Threat intelligence sources
- **React & Vite** - Modern web development tools
- **Tailwind CSS** - Rapid UI development

---

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Submit a pull request
- Contact: [your-email@example.com]

---

**⚠️ Disclaimer:** This is an educational project for demonstrating AI-powered threat intelligence aggregation. It should not be used as the sole source for production security decisions. Always verify threats through official channels and consult with security professionals.
