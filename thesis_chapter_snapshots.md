# Chapter: Project Snapshots and Description

This appendix presents the key implementation modules of the **CyberWatch Sentinel** AI-Powered Threat Intelligence Platform along with representative code listings, interface screenshots, and technical explanations for each module.

---

## Module 1: Live Threat Intelligence Pipeline (AI-Parsed RSS Ingestion)

### Description

The Live Threat Intelligence Pipeline is the data backbone of CyberWatch Sentinel. It continuously monitors global cybersecurity news sources via RSS feeds, ingests raw article data, and uses the **Groq AI (Llama-3.3-70b-versatile)** large language model to automatically parse, classify, and structure each article into a standardized `Incident` object.

A `node-cron` scheduler triggers the RSS scraping function every 15 minutes. The system monitors two primary feeds: *The Hacker News* and *BleepingComputer*. For each new article, the system extracts the title, snippet, URL, and publication date, then sends this data to the Groq LLM with a strict system prompt instructing it to return a JSON object conforming to the `Incident` TypeScript interface. The LLM extracts severity, attack type, targeted sector, threat actor, and even infers geographic coordinates.

A deduplication mechanism using a `Set` of processed URLs prevents the same article from being parsed twice. Parsed incidents are stored in an in-memory array (capped at 100) and served to the frontend via a REST API.

**Inputs:**
- RSS feed URLs (The Hacker News, BleepingComputer)
- Raw article title, snippet, URL, and publication date

**Outputs:**
- Structured `Incident` JSON objects with severity, type, sector, location, and impact score
- In-memory incident database served via `/api/incidents`

**Key Technologies:** `rss-parser`, `node-cron`, Groq SDK (Llama-3.3-70b), Express.js, TypeScript

### Screenshot

![Overview Dashboard showing live parsed threats with Global Risk Index, Sector Heatmap, and incident statistics](C:\Users\haris\.gemini\antigravity\brain\cb74b848-100d-4f57-a31b-5b2336ef9041\artifacts\overview_dashboard.png)

### Code: Incident Type Definition (`types.ts`)

```typescript
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type IncidentStatus = 'Open' | 'Investigating' | 'Resolved' | 'Contained';
export type IncidentType = 'Ransomware' | 'DDoS' | 'Phishing' | 'Data Breach' 
                         | 'Malware' | 'Insider Threat' | 'Espionage';
export type Sector = 'Finance' | 'Healthcare' | 'Technology' | 'Government' 
                   | 'Retail' | 'Energy' | 'Education';

export interface Incident {
  id: string;
  title: string;
  description: string;
  date: string;
  severity: Severity;
  status: IncidentStatus;
  type: IncidentType;
  sector: Sector;
  source: string;
  threatActor?: string;
  location: { lat: number; lng: number; country: string; city: string; };
  impactScore: number; // 0-100
}
```

### Code: RSS Feed Scraping and AI Parsing (`server/src/index.ts`)

```typescript
import Parser from 'rss-parser';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const parser = new Parser();

const RSS_FEEDS = [
    'https://feeds.feedburner.com/TheHackersNews',
    'https://www.bleepingcomputer.com/feed/'
];

let incidents: any[] = [];
const processedLinks = new Set<string>();

const systemPrompt = `
You are a cybersecurity threat intelligence parser. 
I will give you a news article title and snippet.
You must extract the threat information and return ONLY a valid JSON object 
matching exactly this TypeScript interface:

interface Incident {
  id: string;          // random 6-character hex string
  title: string;       // clear, concise threat title
  description: string; // 1-2 sentence summary
  date: string;        // ISO Date string
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "Investigating" | "Resolved" | "Contained";
  type: "Ransomware" | "DDoS" | "Phishing" | "Data Breach" 
      | "Malware" | "Insider Threat" | "Espionage";
  sector: "Finance" | "Healthcare" | "Technology" | "Government" 
        | "Retail" | "Energy" | "Education";
  source: string;
  threatActor?: string;
  location: { lat: number; lng: number; country: string; city: string; };
  impactScore: number; // 0-100
}`;

async function fetchAndParseFeeds() {
    console.log('[Live Feed] Checking for new cyber incidents...');
    for (const feedUrl of RSS_FEEDS) {
        const feed = await parser.parseURL(feedUrl);
        const items = feed.items.slice(0, 3);
        
        for (const item of items) {
            if (!item.link || processedLinks.has(item.link)) continue;
            processedLinks.add(item.link);

            const prompt = `
Title: ${item.title}
Snippet: ${item.contentSnippet || item.content}
URL: ${item.link}
Date: ${item.pubDate}`;

            const completion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                model: 'llama-3.3-70b-versatile',
                response_format: { type: 'json_object' }
            });

            const structuredIncident = JSON.parse(
                completion.choices[0]?.message?.content || '{}'
            );
            incidents.unshift(structuredIncident);
            if (incidents.length > 100) incidents.pop();
        }
    }
}

// Schedule every 15 minutes
cron.schedule('*/15 * * * *', () => fetchAndParseFeeds());
```

---

## Module 2: AI Lead Analyst Chatbot (RAG-Based)

### Description

The AI Lead Analyst is a Retrieval-Augmented Generation (RAG) chatbot that provides expert cybersecurity advice grounded in the platform's live threat data. When a user submits a question, the system retrieves the 10 most recent incidents from the in-memory database, injects them into the LLM's system prompt as context, and then forwards the user's question. This ensures the AI's responses are always informed by the latest real-world threat landscape.

The chatbot maintains conversation history per session, enabling multi-turn dialogue. The frontend component (`AIAnalyst.tsx`) renders a floating chat widget with a message history panel, typing indicator, and input form.

**Inputs:**
- Natural language question from the user
- Conversation history (last 5 messages)
- Live incident context (10 most recent threats)

**Outputs:**
- AI-generated cybersecurity analysis grounded in live data

**Key Technologies:** Groq SDK (Llama-3.3-70b), React state management, Express.js

### Code: AI Chat Endpoint (`server/src/index.ts`)

```typescript
app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;
    
    const context = incidents.slice(0, 10).map(i => 
        `ID: ${i.id}, Title: ${i.title}, Severity: ${i.severity}, 
         Sector: ${i.sector}, Type: ${i.type}`
    ).join('\n');

    const completion = await groq.chat.completions.create({
        messages: [
            { 
                role: 'system', 
                content: `You are the Cyber Sentinel AI Lead Analyst. 
                Here are the most recent 10 incidents:
                ${context}
                When the user asks questions, refer to these incidents 
                if relevant. Be professional, technical yet clear.`
            },
            ...history,
            { role: 'user', content: message }
        ],
        model: 'llama-3.3-70b-versatile',
    });

    res.json({ response: completion.choices[0]?.message?.content });
});
```

### Code: Frontend Chat Component (`components/AIAnalyst.tsx`)

```tsx
const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMsg = message.trim();
    setMessage('');
    const newHistory = [...messages, { role: 'user', content: userMsg }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: userMsg, 
                history: newHistory.filter(
                    m => m.role !== 'assistant' || m.content.length > 0
                ).slice(-5) 
            })
        });

        if (response.ok) {
            const data = await response.json();
            setMessages(prev => [...prev, 
                { role: 'assistant', content: data.response }
            ]);
        }
    } catch (err) {
        setMessages(prev => [...prev, 
            { role: 'assistant', content: "Trouble connecting to analysis engine." }
        ]);
    } finally {
        setIsLoading(false);
    }
};
```

---

## Module 3: FraudShield — WhatsApp Chat Forensic Analyzer

### Description

FraudShield is a forensic NLP module that analyzes chat logs (exported from WhatsApp or Telegram) to detect social engineering, scam, and phishing patterns. The user pastes a suspicious chat conversation into the analyzer, and the system sends it to the Groq LLM acting as a "Forensic Cyber-Psychologist." The AI examines the text for urgency-based pressure, impersonation tactics, suspicious payment requests, and language anomalies, then returns a structured JSON report.

The report includes a risk level (Critical/High/Medium/Low), fraud probability (0–100%), an array of detected patterns, an expert narrative analysis, specific red flags with quoted text and reasoning, and a final recommendation.

**Inputs:**
- Raw chat text (up to 5,000 characters) pasted by the user or uploaded as a `.txt` file

**Outputs:**
- Structured forensic report: risk level, fraud probability, detected patterns, red flags, recommendation

**Key Technologies:** Groq SDK, Express.js, React frontend with file upload support

### Screenshot

![FraudShield Chat Analyzer interface with text input area and Run Analysis button](C:\Users\haris\.gemini\antigravity\brain\cb74b848-100d-4f57-a31b-5b2336ef9041\artifacts\fraudshield_chat.png)

### Code: Fraud Analysis Endpoint (`server/src/index.ts`)

```typescript
app.post('/api/analyze-chat', async (req, res) => {
    const { chatText } = req.body;
    if (!chatText) return res.status(400).json({ error: "Chat content is required" });

    const completion = await groq.chat.completions.create({
        messages: [
            { 
                role: 'system', 
                content: `You are a Forensic Cyber-Psychologist specializing in 
                Scams and Fraud Detection.
                Analyze the provided chat log and identify if it is a fraud, 
                scam, or phishing attempt. Look for:
                - Social Engineering (Urgency, fear, greed)
                - Impersonation (Family, Bank, Authority)
                - Suspicious requests (Money, OTP, Crypto, Personal links)
                - Language patterns (Poor grammar, overly formal, aggressive)
                
                Format the response as a JSON object:
                {
                    "riskLevel": "Critical" | "High" | "Medium" | "Low",
                    "fraudProbability": number (0-100),
                    "detectedPatterns": string[],
                    "expertAnalysis": string,
                    "redFlags": [{ "text": string, "reason": string }],
                    "recommendation": string
                }`
            },
            { role: 'user', content: `Analyze this chat: ${chatText.substring(0, 5000)}` }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
    });

    res.json(JSON.parse(completion.choices[0]?.message?.content || '{}'));
});
```

---

## Module 4: AI Vulnerability Scanner (Simulation)

### Description

The Vulnerability Scanner provides a retro terminal-style console interface where users can input a target domain or IP address. The system sends the target to the Groq LLM, which acts as a high-end vulnerability scanner and generates a realistic, intelligence-backed security audit report. The report includes detected open ports, potential vulnerabilities with real CVE identifiers, a risk score (0–100), and specific mitigation recommendations.

This is a simulation-based approach: the LLM generates plausible vulnerability data based on its training knowledge of real-world CVE databases and common attack surfaces for the given target type.

**Inputs:**
- Target domain name or IP address

**Outputs:**
- Structured JSON: target, scan date, risk score, vulnerabilities array (CVE, severity, description, fix), open ports array

**Key Technologies:** Groq SDK, Express.js, React terminal UI component

### Screenshot

![Vulnerability Scanner with target input field, Start Security Scan button, and debug console](C:\Users\haris\.gemini\antigravity\brain\cb74b848-100d-4f57-a31b-5b2336ef9041\artifacts\vulnerability_scanner.png)

### Code: Scan Endpoint (`server/src/index.ts`)

```typescript
app.post('/api/scan', async (req, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: "Target is required" });

    const completion = await groq.chat.completions.create({
        messages: [
            { 
                role: 'system', 
                content: `You are a high-end Vulnerability Scanner. 
                Given a target (Domain or IP), simulate a professional 
                security scan report. Include:
                1. Detected Open Ports
                2. Potential Vulnerabilities (CVE IDs)
                3. Risk Score (0-100)
                4. Recommendations for Mitigation
                Format the response as a JSON object:
                {
                    "target": string,
                    "scanDate": string (ISO),
                    "riskScore": number,
                    "vulnerabilities": [{
                        "cve": string,
                        "severity": "Critical"|"High"|"Medium",
                        "description": string,
                        "fix": string
                    }],
                    "openPorts": [number]
                }`
            },
            { role: 'user', content: `Scan target: ${target}` }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
    });

    res.json(JSON.parse(completion.choices[0]?.message?.content || '{}'));
});
```

---

## Module 5: Advanced Data Visualizations and Geospatial Mapping

### Description

The Visualizations module transforms the structured incident data into interactive charts and a global threat map. It provides three primary visual components:

1. **Incident Types Donut Chart** — Distribution of attacks by category (Ransomware, Phishing, Data Breach, Malware, Espionage).
2. **Average Impact Score by Sector Radar Chart** — A radar polygon showing which industry sectors (Healthcare, Technology, Education, etc.) are most impacted.
3. **Global Threat Map** — A Leaflet.js-powered interactive world map plotting each incident at its inferred geographic coordinates with color-coded severity markers.

The frontend uses `recharts` for the statistical charts and `leaflet` for the geospatial map. All visualizations update in real time as new incidents are parsed by the AI pipeline.

**Key Technologies:** Recharts, Leaflet.js, React, TypeScript

### Screenshot

![Visualizations page with Incident Types donut chart, Sector Radar chart, and Global Threat Map](C:\Users\haris\.gemini\antigravity\brain\cb74b848-100d-4f57-a31b-5b2336ef9041\artifacts\visualizations.png)

---

## Module 6: WhatsApp Bot Integration (Meta Cloud API)

### Description

The WhatsApp Bot module extends the CyberWatch Sentinel platform to the WhatsApp messaging platform using the official **Meta Cloud API**. This allows users to interact with all core features — threat feed, vulnerability scanning, fraud analysis, and AI chat — directly from their WhatsApp client.

The module implements a webhook-based architecture. Meta's servers send incoming user messages to the `/webhook` endpoint on the CyberWatch server. The server parses the message, executes the appropriate command handler, and sends the AI-generated response back via the Meta Graph API (`POST https://graph.facebook.com/v21.0/{phone_number_id}/messages`).

The bot supports a command system: `/threats`, `/critical`, `/scan <domain>`, `/analyze <text>`, `/help`, and natural language chat. User sessions are maintained in memory with conversation history for contextual multi-turn AI dialogue.

**Inputs:**
- Incoming WhatsApp messages via Meta Webhook (POST `/webhook`)
- Webhook verification challenge from Meta (GET `/webhook`)

**Outputs:**
- AI-generated responses sent back to the user via Meta Graph API
- Webhook verification response for Meta dashboard setup

**Key Technologies:** Meta Cloud API, Axios, Express.js webhooks, Groq SDK

### Code: Meta WhatsApp Webhook (`server/src/whatsapp-meta.ts`)

```typescript
export function setupMetaWebhook(app: Application, incidents: any[]) {
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
    const VERIFY_TOKEN = 'cyberwatch';

    // Webhook Verification (required by Meta)
    app.get('/webhook', (req, res) => {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        }
        return res.sendStatus(403);
    });

    // Receive incoming messages
    app.post('/webhook', async (req, res) => {
        const body = req.body;
        if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            const from = body.entry[0].changes[0].value.messages[0].from;
            const text = body.entry[0].changes[0].value.messages[0].text?.body;

            let responseText = '';
            if (text.startsWith('/threats')) {
                responseText = await handleThreats(incidents);
            } else if (text.startsWith('/analyze')) {
                responseText = await handleFraudAnalysis(text.substring(8));
            } else if (text.startsWith('/scan ')) {
                responseText = await handleScan(text.substring(6));
            } else {
                responseText = await handleAIChat(text, [], incidents);
            }

            // Send response via Meta Graph API
            await axios.post(
                `https://graph.facebook.com/v21.0/${META_PHONE_NUMBER_ID}/messages`,
                { messaging_product: 'whatsapp', to: from, text: { body: responseText } },
                { headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}` } }
            );
        }
        res.sendStatus(200);
    });
}
```

---

## Module 7: Frontend Application Architecture and State Management

### Description

The frontend is built with **React 19** and **Vite** as a single-page application using `react-router-dom` for client-side routing. Global state is managed through React Context (`AppContext`), which provides the current theme (dark/light), the incidents array, and data refresh functions to all child components.

The application polls the backend every 3 minutes for fresh incident data. If the backend is unreachable, it gracefully falls back to mock data generated by `generateMockIncidents()`, ensuring the UI never appears broken.

**Inputs:**
- Live incident data from `/api/incidents` (polled every 3 minutes)
- User navigation actions

**Outputs:**
- Rendered dashboard pages: Overview, Incident Feed, Visualizations, Scanner, Intelligence, FraudShield

**Key Technologies:** React 19, Vite, React Router v7, React Context API, Recharts, Leaflet, Lucide React icons

### Screenshot

![Incident Feed page with searchable, filterable table of AI-parsed cyber threats](C:\Users\haris\.gemini\antigravity\brain\cb74b848-100d-4f57-a31b-5b2336ef9041\artifacts\incident_feed.png)

### Code: Application Root with Context and Routing (`App.tsx`)

```tsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

interface AppContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  incidents: Incident[];
  refreshData: () => void;
}

export const AppContext = createContext<AppContextType>({
  theme: 'dark', toggleTheme: () => {},
  incidents: [], refreshData: () => {},
});

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const fetchLiveIncidents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/incidents');
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) { setIncidents(data); return; }
      }
      setIncidents(generateMockIncidents(100)); // Fallback
    } catch (err) {
      setIncidents(generateMockIncidents(100));
    }
  };

  useEffect(() => {
    fetchLiveIncidents();
    const intervalId = setInterval(fetchLiveIncidents, 3 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <AppContext.Provider value={{ theme, toggleTheme, incidents, refreshData }}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/visualize" element={<Visualize />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/fraud-shield" element={<FraudShield />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppContext.Provider>
  );
};
```

---

*Developed by Harish Singh — Major Project: Cybersecurity AI Integration*
