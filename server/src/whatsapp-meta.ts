import { Application, Request, Response } from 'express';
import Groq from 'groq-sdk';
import axios from 'axios';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Store user sessions for context
const userSessions = new Map<string, { history: any[], lastActive: number }>();

// Clean up old sessions (older than 1 hour)
setInterval(() => {
    const now = Date.now();
    for (const [userId, session] of userSessions.entries()) {
        if (now - session.lastActive > 3600000) {
            userSessions.delete(userId);
        }
    }
}, 300000); // Every 5 minutes

export function setupMetaWebhook(app: Application, incidents: any[]) {
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
    const VERIFY_TOKEN = 'cyberwatch';

    console.log('[WhatsApp] 🟢 Official Meta API Webhook initializing...');

    // Webhook Verification (Meta requires this when setting up the webhook in their dashboard)
    app.get('/webhook', (req: Request, res: Response) => {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode && token) {
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('[WhatsApp] Webhook verified successfully!');
                return res.status(200).send(challenge);
            } else {
                return res.sendStatus(403);
            }
        }
    });

    // Receive incoming messages
    app.post('/webhook', async (req: Request, res: Response) => {
        try {
            const body = req.body;

            if (body.object) {
                if (
                    body.entry &&
                    body.entry[0].changes &&
                    body.entry[0].changes[0] &&
                    body.entry[0].changes[0].value.messages &&
                    body.entry[0].changes[0].value.messages[0]
                ) {
                    const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
                    const from = body.entry[0].changes[0].value.messages[0].from; // sender number
                    const msg = body.entry[0].changes[0].value.messages[0];
                    const text = msg.text?.body || '';

                    if (!text) {
                        return res.sendStatus(200);
                    }

                    console.log(`[WhatsApp Meta] Message from ${from}: ${text}`);

                    // Get or create user session
                    let session = userSessions.get(from);
                    if (!session) {
                        session = { history: [], lastActive: Date.now() };
                        userSessions.set(from, session);
                    }
                    session.lastActive = Date.now();

                    let responseText = '';

                    // Command Parsing (Same logic as before)
                    if (text.toLowerCase().startsWith('/help')) {
                        responseText = await handleHelp();
                    } else if (text.toLowerCase().startsWith('/threats')) {
                        responseText = await handleThreats(incidents);
                    } else if (text.toLowerCase().startsWith('/critical')) {
                        responseText = await handleCritical(incidents);
                    } else if (text.toLowerCase().startsWith('/scan ')) {
                        const target = text.substring(6).trim();
                        responseText = await handleScan(target);
                    } else if (text.toLowerCase().startsWith('/analyze')) {
                        const targetText = text.substring(8).trim();
                        if (targetText) {
                            responseText = await handleFraudAnalysis(targetText);
                        } else {
                            responseText = "📱 *FraudShield Analyzer*\n\nPlease send the chat text you want to analyze in your next message.";
                            session.history.push({ role: 'system', content: 'awaiting_fraud_analysis' });
                        }
                    } else if (session.history.length > 0 && session.history[session.history.length - 1].content === 'awaiting_fraud_analysis') {
                        responseText = await handleFraudAnalysis(text);
                        session.history = []; // Clear after analysis
                    } else {
                        // General AI chat
                        responseText = await handleAIChat(text, session.history, incidents);
                        session.history.push({ role: 'user', content: text });
                        session.history.push({ role: 'assistant', content: responseText });
                        
                        if (session.history.length > 20) {
                            session.history = session.history.slice(-20);
                        }
                    }

                    // Send response via Meta Graph API
                    try {
                        await axios({
                            method: 'POST',
                            url: `https://graph.facebook.com/v21.0/${META_PHONE_NUMBER_ID || phone_number_id}/messages`,
                            data: {
                                messaging_product: 'whatsapp',
                                to: from,
                                text: { body: responseText },
                            },
                            headers: {
                                Authorization: `Bearer ${META_ACCESS_TOKEN}`,
                                'Content-Type': 'application/json',
                            },
                        });
                    } catch (apiErr: any) {
                        console.error('[WhatsApp Meta] Failed to send message:', apiErr.response?.data || apiErr.message);
                    }
                }
                res.sendStatus(200);
            } else {
                res.sendStatus(404);
            }
        } catch (error) {
            console.error('[WhatsApp Meta] Webhook error:', error);
            res.sendStatus(500);
        }
    });
}

// Handlers
async function handleHelp(): Promise<string> {
    return `🛡️ *CyberWatch Sentinel Bot*

*Available Commands:*

📊 */threats* - View latest cyber incidents
🚨 */critical* - Show critical threats only
🔍 */scan <domain>* - Scan a domain/IP
🛡️ */analyze* - Analyze chat for fraud
💬 *Chat normally* - Ask me anything about cybersecurity

*Examples:*
• /threats
• /scan example.com
• What is ransomware?
• Tell me about APT groups

Type any command to get started! 🚀`;
}

async function handleThreats(incidents: any[]): Promise<string> {
    const latest = incidents.slice(0, 5);
    if (latest.length === 0) return '📊 No incidents found. System is monitoring...';

    let response = '🚨 *Latest Cyber Threats*\n\n';
    latest.forEach((inc) => {
        const emoji = inc.severity === 'Critical' ? '🔴' : 
                     inc.severity === 'High' ? '🟠' : 
                     inc.severity === 'Medium' ? '🟡' : '🔵';
        response += `${emoji} *${inc.title}*\n`;
        response += `   📅 ${inc.date.split('T')[0]}\n`;
        response += `   🎯 ${inc.sector} | ${inc.type}\n`;
        response += `   📍 ${inc.location?.city || 'Unknown'}, ${inc.location?.country || 'Unknown'}\n\n`;
    });
    response += `_Total incidents: ${incidents.length}_`;
    return response;
}

async function handleCritical(incidents: any[]): Promise<string> {
    const critical = incidents.filter(i => i.severity === 'Critical').slice(0, 5);
    if (critical.length === 0) return '✅ No critical threats detected at this time.';

    let response = '🔴 *CRITICAL THREATS*\n\n';
    critical.forEach((inc) => {
        response += `⚠️ *${inc.title}*\n`;
        response += `   ${inc.description}\n`;
        response += `   🎯 Sector: ${inc.sector}\n`;
        response += `   📍 Location: ${inc.location?.city || 'Unknown'}\n`;
        if (inc.threatActor) response += `   👤 Actor: ${inc.threatActor}\n`;
        response += `\n`;
    });
    return response;
}

async function handleScan(target: string): Promise<string> {
    if (!target) return '❌ Please provide a domain or IP.\nExample: /scan example.com';
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a vulnerability scanner. Scan the target and provide a brief WhatsApp-friendly report with: Risk Score, Top 3 vulnerabilities, Quick recommendations. Keep it concise and use emojis.' },
                { role: 'user', content: `Scan: ${target}` }
            ],
            model: 'llama-3.3-70b-versatile',
        });
        return `🔍 *Scan Results: ${target}*\n\n${completion.choices[0]?.message?.content}`;
    } catch (error) {
        return '❌ Scan failed. Please check the target and try again.';
    }
}

async function handleFraudAnalysis(chatText: string): Promise<string> {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a fraud detection expert. Analyze the chat for scam patterns and provide: Fraud Probability, Risk Level, Top 3 red flags, Quick recommendation. Keep it WhatsApp-friendly with emojis.' },
                { role: 'user', content: `Analyze: ${chatText}` }
            ],
            model: 'llama-3.3-70b-versatile',
        });
        return `🛡️ *FraudShield Analysis*\n\n${completion.choices[0]?.message?.content}`;
    } catch (error) {
        return '❌ Analysis failed. Please try again.';
    }
}

async function handleAIChat(message: string, history: any[], incidents: any[]): Promise<string> {
    const context = incidents.slice(0, 5).map(i => `${i.title} (${i.severity}, ${i.sector})`).join('\n');
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: `You are CyberWatch Sentinel AI, a cybersecurity expert assistant on WhatsApp. Provide helpful, concise answers about cybersecurity. Use emojis and keep responses under 500 characters. Recent threats:\n${context}` },
                ...history.slice(-6),
                { role: 'user', content: message }
            ],
            model: 'llama-3.3-70b-versatile',
        });
        return completion.choices[0]?.message?.content || 'Sorry, I could not process that.';
    } catch (error) {
        throw error;
    }
}
