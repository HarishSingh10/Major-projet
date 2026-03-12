import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import Parser from 'rss-parser';
import Groq from 'groq-sdk';
import path from 'path';

// Load .env from the parent directory since that's where .env.local is
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});
const parser = new Parser();

// The URLs to scrape live cyber news from
const RSS_FEEDS = [
    'https://feeds.feedburner.com/TheHackersNews',
    'https://www.bleepingcomputer.com/feed/'
];

// In-memory database of incidents
let incidents: any[] = [];
// Keep track of processed URLs to avoid duplicates
const processedLinks = new Set<string>();

const systemPrompt = `
You are a cybersecurity threat intelligence parser. 
I will give you a news article title and snippet.
You must extract the threat information and return ONLY a valid JSON object (no markdown formatting, no comments) matching exactly this TypeScript interface:

interface Incident {
  id: string; // generate a random 6-character hex string
  title: string; // clear, concise threat title
  description: string; // 1-2 sentence summary
  date: string; // Current ISO Date string or parsed from input
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "Investigating" | "Resolved" | "Contained";
  type: "Ransomware" | "DDoS" | "Phishing" | "Data Breach" | "Malware" | "Insider Threat" | "Espionage";
  sector: "Finance" | "Healthcare" | "Technology" | "Government" | "Retail" | "Energy" | "Education";
  source: string; // the URL provided
  threatActor?: string; // if mentioned, e.g., "Lazarus", "LockBit", else omit
  location: {
    lat: number;
    lng: number;
    country: string;
    city: string;
  };
  impactScore: number; // 0-100 based on severity
}

If you cannot determine the location, pick a realistic Lat/Lng/Country/City based on the threat actor or target. If the sector doesn't fit exactly, pick the closest match (e.g., 'Technology' as a fallback). Status should default to 'Open' or 'Investigating'.
`;

async function fetchAndParseFeeds() {
    console.log('[Live Feed] Checking for new cyber incidents...');
    try {
        for (const feedUrl of RSS_FEEDS) {
            const feed = await parser.parseURL(feedUrl);
            // Just take the top 3 newest items from each feed to not blow up API rate limits
            const items = feed.items.slice(0, 3);
            
            for (const item of items) {
                if (!item.link || processedLinks.has(item.link)) continue;
                
                console.log(`[New item] Found: ${item.title}`);
                processedLinks.add(item.link);

                const prompt = `
Title: ${item.title}
Snippet: ${item.contentSnapshot || item.contentSnippet || item.content}
URL: ${item.link}
Date: ${item.pubDate}
`;
                try {
                    console.log(`[AI] Processing item with Groq: ${item.title}...`);
                    const completion = await groq.chat.completions.create({
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: prompt }
                        ],
                        model: 'llama-3.3-70b-versatile',
                        response_format: { type: 'json_object' }
                    });

                    const responseText = completion.choices[0]?.message?.content;
                    
                    if (responseText) {
                        let parsedData = responseText.trim();
                        if (parsedData.startsWith('\`\`\`json')) {
                            parsedData = parsedData.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
                        } else if (parsedData.startsWith('\`\`\`')) {
                            parsedData = parsedData.replace(/\`\`\`/g, '');
                        }

                        const structuredIncident = JSON.parse(parsedData);
                        // Make sure the source is set correctly
                        structuredIncident.source = item.link || structuredIncident.source;
                        
                        // Add to our top of list
                        incidents.unshift(structuredIncident);
                        // Keep only recent 100
                        if (incidents.length > 100) incidents.pop();
                        
                        console.log(`[Parsed] Successfully parsed into threat: ${structuredIncident.id}`);
                    }
                } catch (groqError: any) {
                    console.error(`[Groq Error] ID: ${item.link}`);
                    console.error(`Message: ${groqError.message}`);
                }
            }
        }
    } catch (error) {
        console.error('[Feed Error] Failed to fetch RSS feeds:', error);
    }
}

// Routes
app.get('/api/incidents', (req, res) => {
    res.json(incidents);
});

// AI Analyst Chat Endpoint
app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;
    
    // Create a context string from the latest 10 incidents
    const context = incidents.slice(0, 10).map(i => 
        `ID: ${i.id}, Title: ${i.title}, Severity: ${i.severity}, Sector: ${i.sector}, Type: ${i.type}`
    ).join('\n');

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: 'system', 
                    content: `You are the Cyber Sentinel AI Lead Analyst. Your goal is to provide expert cybersecurity advice based on recent incidents. 
                    Here are the most recent 10 incidents from our database:
                    ${context}
                    
                    When the user asks questions, refer to these incidents if relevant. Be professional, technical yet clear, and focus on mitigations and risk patterns.`
                },
                ...history,
                { role: 'user', content: message }
            ],
            model: 'llama-3.3-70b-versatile',
        });

        res.json({ response: completion.choices[0]?.message?.content });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Simulated Vulnerability Scanner Endpoint
app.post('/api/scan', async (req, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: "Target is required" });

    try {
        console.log(`[Scanner] Simulating scan for target: ${target}...`);
        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: 'system', 
                    content: `You are a high-end Vulnerability Scanner. 
                    Given a target (Domain or IP), simulate a professional security scan report.
                    Include:
                    1. Detected Open Ports
                    2. Potential Vulnerabilities (CVE IDs)
                    3. Risk Score (0-100)
                    4. Recommendations for Mitigation
                    Format the response as a JSON object matching this structure:
                    {
                        "target": string,
                        "scanDate": string (ISO),
                        "riskScore": number,
                        "vulnerabilities": [ { "cve": string, "severity": "Critical"|"High"|"Medium", "description": string, "fix": string } ],
                        "openPorts": [number]
                    }`
                },
                { role: 'user', content: `Scan target: ${target}` }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' }
        });

        res.json(JSON.parse(completion.choices[0]?.message?.content || '{}'));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// WhatsApp Fraud Analysis Endpoint
app.post('/api/analyze-chat', async (req, res) => {
    const { chatText } = req.body;
    if (!chatText) return res.status(400).json({ error: "Chat content is required" });

    try {
        console.log(`[FraudShield] Analyzing chat and detecting patterns...`);
        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: 'system', 
                    content: `You are a Forensic Cyber-Psychologist specializing in Scams and Fraud Detection.
                    Analyze the provided chat log (likely from WhatsApp) and identify if it is a fraud, scam, or phishing attempt.
                    Look for:
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
                        "redFlags": [ { "text": string, "reason": string } ],
                        "recommendation": string
                    }`
                },
                { role: 'user', content: `Analyze this chat: ${chatText.substring(0, 5000)}` } // Cap length
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' }
        });

        res.json(JSON.parse(completion.choices[0]?.message?.content || '{}'));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Force a manual fetch using an endpoint for easy testing
app.post('/api/fetch-live', async (req, res) => {
    await fetchAndParseFeeds();
    res.json({ success: true, count: incidents.length, incidents });
});

// Schedule the feed scraping every 15 minutes
cron.schedule('*/15 * * * *', () => {
    fetchAndParseFeeds();
});

app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    // Do an initial fetch on startup
    await fetchAndParseFeeds();
});
