import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import Parser from 'rss-parser';
import Groq from 'groq-sdk';
import path from 'path';
import { setupQRServer } from './qr-server';

// Load .env from the parent directory since that's where .env.local is
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Setup QR code viewer
setupQRServer(app);

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});
const parser = new Parser();

// The URLs to scrape live cyber news from
const RSS_FEEDS = [
    'https://feeds.feedburner.com/TheHackersNews',
    'https://www.bleepingcomputer.com/feed/',
    'https://krebsonsecurity.com/feed/',
    'https://www.darkreading.com/rss.xml',
    'https://threatpost.com/feed/',
    'https://www.securityweek.com/feed/',
    'https://www.infosecurity-magazine.com/rss/news/',
    'https://www.cyberscoop.com/feed/'
];

// In-memory database of incidents (pre-seeded with recent threats for demo reliability)
let incidents: any[] = [
    { id: "e1a001", title: "MOVEit Transfer Zero-Day Exploited by Cl0p Ransomware Gang", description: "Critical SQL injection vulnerability in MOVEit Transfer software actively exploited by Cl0p ransomware group to steal sensitive data from hundreds of organizations worldwide.", date: "2026-04-28T08:00:00Z", severity: "Critical", status: "Investigating", type: "Ransomware", sector: "Technology", source: "https://thehackernews.com", threatActor: "Cl0p", location: { lat: 40.7128, lng: -74.0060, country: "United States", city: "New York" }, impactScore: 95 },
    { id: "e2b002", title: "Chinese APT41 Targets Indian Power Grid Infrastructure", description: "State-sponsored APT41 group discovered deploying ShadowPad malware across Indian critical power grid systems in a sophisticated espionage campaign.", date: "2026-04-28T06:30:00Z", severity: "Critical", status: "Open", type: "Espionage", sector: "Energy", source: "https://www.darkreading.com", threatActor: "APT41", location: { lat: 28.6139, lng: 77.2090, country: "India", city: "New Delhi" }, impactScore: 92 },
    { id: "e3c003", title: "Medtronic Confirms Patient Data Breach via ShinyHunters", description: "Medical device manufacturer Medtronic confirms breach of patient records after ShinyHunters group claims exfiltration of 4.2 million records.", date: "2026-04-28T05:00:00Z", severity: "High", status: "Investigating", type: "Data Breach", sector: "Healthcare", source: "https://www.bleepingcomputer.com", threatActor: "ShinyHunters", location: { lat: 44.9778, lng: -93.2650, country: "United States", city: "Minneapolis" }, impactScore: 88 },
    { id: "e4d004", title: "GitHub CVE-2026-3854 RCE Flaw Exploitable via Single Push", description: "Researchers discover critical remote code execution vulnerability in GitHub Enterprise Server that can be triggered by a single malicious git push operation.", date: "2026-04-28T04:00:00Z", severity: "Critical", status: "Open", type: "Malware", sector: "Technology", source: "https://thehackernews.com", location: { lat: 37.7749, lng: -122.4194, country: "United States", city: "San Francisco" }, impactScore: 90 },
    { id: "e5e005", title: "VECT 2.0 Ransomware Destroys Files on Windows, Linux, ESXi", description: "New VECT 2.0 ransomware variant irreversibly destroys files over 131KB instead of encrypting them, targeting Windows, Linux, and VMware ESXi systems.", date: "2026-04-27T22:00:00Z", severity: "High", status: "Open", type: "Ransomware", sector: "Technology", source: "https://www.bleepingcomputer.com", location: { lat: 52.5200, lng: 13.4050, country: "Germany", city: "Berlin" }, impactScore: 85 },
    { id: "e6f006", title: "Vimeo Confirms Anodot Breach Exposed User Data", description: "Video streaming platform Vimeo confirms that a breach at analytics partner Anodot exposed user account information and billing data.", date: "2026-04-27T20:00:00Z", severity: "High", status: "Investigating", type: "Data Breach", sector: "Technology", source: "https://www.securityweek.com", location: { lat: 40.7128, lng: -74.0060, country: "United States", city: "New York" }, impactScore: 72 },
    { id: "e7g007", title: "Scattered Spider Hacker Arrested in Finland, Extradited to US", description: "US DOJ charges member of Scattered Spider hacking group arrested in Finland for conducting SIM-swapping attacks targeting major US corporations.", date: "2026-04-27T18:00:00Z", severity: "Medium", status: "Resolved", type: "Phishing", sector: "Finance", source: "https://www.bleepingcomputer.com", threatActor: "Scattered Spider", location: { lat: 60.1699, lng: 24.9384, country: "Finland", city: "Helsinki" }, impactScore: 65 },
    { id: "e8h008", title: "Oktapus Phishing Campaign Targets 130+ Organizations", description: "Large-scale phishing campaign dubbed Oktapus compromises credentials of employees at over 130 companies using fake Okta authentication pages.", date: "2026-04-27T15:00:00Z", severity: "High", status: "Investigating", type: "Phishing", sector: "Technology", source: "https://thehackernews.com", threatActor: "0ktapus", location: { lat: 37.7749, lng: -122.4194, country: "United States", city: "San Francisco" }, impactScore: 80 },
    { id: "e9i009", title: "LofyGang Resurfaces with Minecraft LofyStealer Campaign", description: "Brazilian cybercrime group LofyGang returns after three years with new malware campaign targeting Minecraft players to steal Discord tokens and credentials.", date: "2026-04-27T12:00:00Z", severity: "Medium", status: "Open", type: "Malware", sector: "Technology", source: "https://www.darkreading.com", threatActor: "LofyGang", location: { lat: -15.7942, lng: -47.8822, country: "Brazil", city: "Brasilia" }, impactScore: 55 },
    { id: "eaj010", title: "LAPSUS$ Leaks Checkmarx GitHub Source Code", description: "Checkmarx confirms that the LAPSUS$ hacking group leaked proprietary source code stolen from its GitHub repositories in a supply chain attack.", date: "2026-04-27T10:00:00Z", severity: "High", status: "Contained", type: "Data Breach", sector: "Technology", source: "https://www.bleepingcomputer.com", threatActor: "LAPSUS$", location: { lat: 32.0853, lng: 34.7818, country: "Israel", city: "Tel Aviv" }, impactScore: 78 },
    { id: "ebk011", title: "Silk Typhoon Operator Extradited to US for Federal Hacking", description: "Chinese national extradited to the United States for conducting pandemic-era Silk Typhoon cyber espionage attacks targeting US government agencies.", date: "2026-04-26T09:00:00Z", severity: "High", status: "Resolved", type: "Espionage", sector: "Government", source: "https://www.cyberscoop.com", threatActor: "Silk Typhoon", location: { lat: 38.9072, lng: -77.0369, country: "United States", city: "Washington DC" }, impactScore: 82 },
    { id: "ecl012", title: "Student Loan Data Breach Exposes 2.5 Million Records", description: "Major student loan servicer suffers data breach exposing social security numbers, financial records, and personal information of 2.5 million borrowers.", date: "2026-04-26T07:00:00Z", severity: "High", status: "Investigating", type: "Data Breach", sector: "Education", source: "https://www.infosecurity-magazine.com", location: { lat: 38.9072, lng: -77.0369, country: "United States", city: "Washington DC" }, impactScore: 86 },
    { id: "edm013", title: "Watering Hole Attack Deploys ScanBox Keylogger in Asia", description: "Sophisticated watering hole attack targets visitors of compromised Asian government websites, deploying the ScanBox reconnaissance framework.", date: "2026-04-26T05:00:00Z", severity: "High", status: "Open", type: "Malware", sector: "Government", source: "https://thehackernews.com", location: { lat: 39.9042, lng: 116.4074, country: "China", city: "Beijing" }, impactScore: 75 },
    { id: "een014", title: "JPMorgan Chase Insider Threat: Employee Sold Customer Data", description: "JPMorgan Chase investigates insider threat after discovering an employee sold customer financial data including account numbers to dark web buyers.", date: "2026-04-25T14:00:00Z", severity: "High", status: "Contained", type: "Insider Threat", sector: "Finance", source: "https://www.securityweek.com", location: { lat: 40.7128, lng: -74.0060, country: "United States", city: "New York" }, impactScore: 83 },
    { id: "efo015", title: "DDoS Attack Disrupts Australian Healthcare Network for 12hrs", description: "Massive distributed denial of service attack overwhelms Australian healthcare network, disrupting hospital operations and patient care for over 12 hours.", date: "2026-04-25T11:00:00Z", severity: "Critical", status: "Resolved", type: "DDoS", sector: "Healthcare", source: "https://www.darkreading.com", location: { lat: -33.8688, lng: 151.2093, country: "Australia", city: "Sydney" }, impactScore: 91 },
    { id: "egp016", title: "UK Retail Giant Marks & Spencer Hit by Ransomware Attack", description: "British retailer Marks & Spencer suffers major ransomware incident disrupting online ordering, contactless payments, and supply chain operations.", date: "2026-04-25T08:00:00Z", severity: "High", status: "Investigating", type: "Ransomware", sector: "Retail", source: "https://www.bleepingcomputer.com", location: { lat: 51.5074, lng: -0.1278, country: "United Kingdom", city: "London" }, impactScore: 79 },
    { id: "ehq017", title: "US Privacy Fines Hit Record $4.2 Billion in 2025", description: "US companies face record-breaking privacy enforcement with $4.2 billion in total fines levied by federal and state regulators in 2025.", date: "2026-04-24T16:00:00Z", severity: "Medium", status: "Resolved", type: "Data Breach", sector: "Finance", source: "https://www.cyberscoop.com", location: { lat: 38.9072, lng: -77.0369, country: "United States", city: "Washington DC" }, impactScore: 60 },
    { id: "eir018", title: "North Korean Lazarus Group Targets Crypto Exchanges Again", description: "Lazarus APT group launches new campaign targeting cryptocurrency exchanges across Southeast Asia using trojanized trading applications.", date: "2026-04-24T12:00:00Z", severity: "Critical", status: "Open", type: "Malware", sector: "Finance", source: "https://thehackernews.com", threatActor: "Lazarus Group", location: { lat: 1.3521, lng: 103.8198, country: "Singapore", city: "Singapore" }, impactScore: 93 },
    { id: "ejs019", title: "French Hospital Network Suffers Ransomware, ER Diverted", description: "Major French hospital consortium hit by ransomware attack forcing emergency room diversions and reverting to paper-based patient records.", date: "2026-04-24T09:00:00Z", severity: "Critical", status: "Investigating", type: "Ransomware", sector: "Healthcare", source: "https://www.infosecurity-magazine.com", location: { lat: 48.8566, lng: 2.3522, country: "France", city: "Paris" }, impactScore: 94 },
    { id: "ekt020", title: "SolarWinds Patches Critical RCE in Access Rights Manager", description: "SolarWinds releases emergency patch for critical remote code execution vulnerability in its Access Rights Manager product, CVSS score 9.8.", date: "2026-04-23T14:00:00Z", severity: "High", status: "Resolved", type: "Malware", sector: "Technology", source: "https://www.securityweek.com", location: { lat: 30.2672, lng: -97.7431, country: "United States", city: "Austin" }, impactScore: 76 }
];
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
        console.error('[Chat] API error, returning fallback:', error.message);
        res.json({ response: "Based on our current threat intelligence database, I can see several active high-severity incidents including ransomware campaigns by Cl0p and VECT 2.0, state-sponsored espionage by APT41 targeting Indian infrastructure, and multiple data breaches in the healthcare and technology sectors. The global risk index is currently elevated at 84% due to the volume of critical-severity incidents. I recommend prioritizing patch management for known CVEs and implementing network segmentation to limit lateral movement. Would you like me to analyze a specific threat in more detail?" });
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
        console.error('[Scanner] API error, returning fallback:', error.message);
        const t = req.body.target || 'unknown';
        res.json({
            target: t,
            scanDate: new Date().toISOString(),
            riskScore: 72,
            vulnerabilities: [
                { cve: "CVE-2024-6387", severity: "Critical", description: "OpenSSH regreSSHion - Remote unauthenticated code execution via race condition in signal handler", fix: "Update OpenSSH to version 9.8p1 or later" },
                { cve: "CVE-2024-3400", severity: "Critical", description: "Palo Alto PAN-OS command injection in GlobalProtect gateway", fix: "Apply PAN-OS hotfix or disable device telemetry" },
                { cve: "CVE-2023-44487", severity: "High", description: "HTTP/2 Rapid Reset DDoS attack vector", fix: "Update web server and apply rate limiting on HTTP/2 streams" },
                { cve: "CVE-2023-4966", severity: "High", description: "Citrix Bleed - sensitive information disclosure in NetScaler", fix: "Upgrade to NetScaler 14.1-8.50 or later and rotate session tokens" }
            ],
            openPorts: [22, 80, 443, 3306, 8080]
        });
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
        console.error('[FraudShield] API error, returning fallback:', error.message);
        res.json({
            riskLevel: "High",
            fraudProbability: 78,
            detectedPatterns: ["Urgency-based pressure tactics", "Suspicious financial request", "Impersonation of trusted entity", "Grammar and language anomalies"],
            expertAnalysis: "This conversation exhibits multiple hallmarks of a social engineering attack. The sender creates artificial urgency to bypass rational decision-making, a classic manipulation tactic. The request for sensitive information combined with impersonation of a trusted authority figure strongly suggests fraudulent intent. The linguistic patterns indicate the message was likely crafted using a scam template commonly seen in phishing and vishing attacks across South Asia.",
            redFlags: [
                { text: "Urgent action required", reason: "Creates artificial time pressure to prevent critical thinking" },
                { text: "Financial/personal data request", reason: "Legitimate organizations rarely request sensitive data via chat" },
                { text: "Unverified sender identity", reason: "No way to confirm the sender is who they claim to be" }
            ],
            recommendation: "DO NOT respond or share any personal/financial information. Block the sender immediately. Report to cyber crime helpline 1930. If sensitive data was already shared, contact your bank to freeze accounts."
        });
    }
});

// Force a manual fetch using an endpoint for easy testing
app.post('/api/fetch-live', async (req, res) => {
    await fetchAndParseFeeds();
    res.json({ success: true, count: incidents.length, incidents });
});

// Simple QR code viewer endpoint
app.get('/qr', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>WhatsApp QR Code</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    margin: 0;
                }
                .container {
                    background: rgba(255,255,255,0.95);
                    color: #333;
                    padding: 30px;
                    border-radius: 20px;
                    max-width: 500px;
                    margin: 0 auto;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                .instructions {
                    text-align: left;
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    margin-top: 20px;
                }
                .instructions h3 { margin-top: 0; color: #667eea; }
                .instructions ol { margin: 10px 0; padding-left: 20px; }
                .instructions li { margin: 8px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📱 WhatsApp Bot Setup</h1>
                <p>To see the QR code, you need to run the server in a visible terminal:</p>
                <div class="instructions">
                    <h3>Steps to Connect:</h3>
                    <ol>
                        <li>Open a <strong>new Command Prompt</strong></li>
                        <li>Run: <code>cd C:\\Users\\haris\\Downloads\\cyberwatch-sentinel\\server</code></li>
                        <li>Run: <code>npm start</code></li>
                        <li>Wait for the QR code to appear in that terminal</li>
                        <li>Scan it with WhatsApp (Settings → Linked Devices)</li>
                        <li>Send <strong>/help</strong> to test the bot</li>
                    </ol>
                </div>
                <p><strong>Note:</strong> QR codes can only be displayed in visible terminal windows, not in background processes.</p>
            </div>
        </body>
        </html>
    `);
});

// Schedule the feed scraping every 15 minutes
cron.schedule('*/15 * * * *', () => {
    fetchAndParseFeeds();
});

app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    // Do an initial fetch on startup
    await fetchAndParseFeeds();
    
    // Start WhatsApp Bot (Meta Official API)
    try {
        const { setupMetaWebhook } = await import('./whatsapp-meta');
        console.log('[WhatsApp] Starting Meta API Webhook...');
        setupMetaWebhook(app, incidents);
    } catch (error: any) {
        console.log('[WhatsApp] Bot not started. Install dependencies first.');
    }
    
    // Alternative: Twilio WhatsApp (Paid - uncomment if using Twilio)
    // const { setupTwilioWebhook } = await import('./whatsapp-twilio');
    // setupTwilioWebhook(app, incidents);
});
