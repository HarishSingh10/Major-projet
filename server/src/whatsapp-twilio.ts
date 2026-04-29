import twilio from 'twilio';
import express from 'express';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Store user sessions
const userSessions = new Map<string, { history: any[], lastActive: number }>();

export function setupTwilioWebhook(app: express.Application, incidents: any[]) {
    // Webhook endpoint for incoming WhatsApp messages
    app.post('/whatsapp', async (req, res) => {
        const incomingMsg = req.body.Body?.trim() || '';
        const from = req.body.From; // Format: whatsapp:+1234567890
        
        console.log(`[Twilio WhatsApp] Message from ${from}: ${incomingMsg}`);
        
        // Get or create user session
        let session = userSessions.get(from);
        if (!session) {
            session = { history: [], lastActive: Date.now() };
            userSessions.set(from, session);
        }
        session.lastActive = Date.now();
        
        let response = '';
        
        try {
            if (incomingMsg.toLowerCase().startsWith('/help')) {
                response = getHelpMessage();
            } else if (incomingMsg.toLowerCase().startsWith('/threats')) {
                response = getThreatsMessage(incidents);
            } else if (incomingMsg.toLowerCase().startsWith('/critical')) {
                response = getCriticalThreats(incidents);
            } else if (incomingMsg.toLowerCase().startsWith('/scan ')) {
                const target = incomingMsg.substring(6).trim();
                response = await scanTarget(target);
            } else if (incomingMsg.toLowerCase().startsWith('/analyze')) {
                response = "📱 *FraudShield Analyzer*\n\nPlease send the chat text you want to analyze in your next message.";
                session.history.push({ role: 'system', content: 'awaiting_fraud_analysis' });
            } else if (session.history.length > 0 && session.history[session.history.length - 1].content === 'awaiting_fraud_analysis') {
                response = await analyzeFraud(incomingMsg);
                session.history = [];
            } else {
                // AI Chat
                response = await handleAIChat(incomingMsg, session.history, incidents);
                session.history.push({ role: 'user', content: incomingMsg });
                session.history.push({ role: 'assistant', content: response });
                
                if (session.history.length > 20) {
                    session.history = session.history.slice(-20);
                }
            }
        } catch (error: any) {
            console.error('[Twilio WhatsApp] Error:', error);
            response = '❌ Sorry, I encountered an error. Please try again.';
        }
        
        // Send response using Twilio
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(response);
        
        res.type('text/xml').send(twiml.toString());
    });
    
    console.log('[Twilio WhatsApp] Webhook endpoint ready at POST /whatsapp');
}

function getHelpMessage(): string {
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

function getThreatsMessage(incidents: any[]): string {
    const latest = incidents.slice(0, 5);
    
    if (latest.length === 0) {
        return '📊 No incidents found. System is monitoring...';
    }
    
    let response = '🚨 *Latest Cyber Threats*\n\n';
    
    latest.forEach((inc) => {
        const emoji = inc.severity === 'Critical' ? '🔴' : 
                     inc.severity === 'High' ? '🟠' : 
                     inc.severity === 'Medium' ? '🟡' : '🔵';
        
        response += `${emoji} *${inc.title}*\n`;
        response += `   📅 ${inc.date.split('T')[0]}\n`;
        response += `   🎯 ${inc.sector} | ${inc.type}\n`;
        response += `   📍 ${inc.location.city}, ${inc.location.country}\n\n`;
    });
    
    response += `_Total incidents: ${incidents.length}_`;
    return response;
}

function getCriticalThreats(incidents: any[]): string {
    const critical = incidents.filter(i => i.severity === 'Critical').slice(0, 5);
    
    if (critical.length === 0) {
        return '✅ No critical threats detected at this time.';
    }
    
    let response = '🔴 *CRITICAL THREATS*\n\n';
    
    critical.forEach((inc) => {
        response += `⚠️ *${inc.title}*\n`;
        response += `   ${inc.description.substring(0, 100)}...\n`;
        response += `   🎯 Sector: ${inc.sector}\n`;
        response += `   📍 Location: ${inc.location.city}\n`;
        if (inc.threatActor) {
            response += `   👤 Actor: ${inc.threatActor}\n`;
        }
        response += `\n`;
    });
    
    return response;
}

async function scanTarget(target: string): Promise<string> {
    if (!target) {
        return '❌ Please provide a domain or IP.\nExample: /scan example.com';
    }
    
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: 'system', 
                    content: `You are a vulnerability scanner. Scan the target and provide a brief WhatsApp-friendly report with:
                    - Risk Score (0-100)
                    - Top 3 vulnerabilities
                    - Quick recommendations
                    Keep it concise and use emojis. Max 400 characters.`
                },
                { role: 'user', content: `Scan: ${target}` }
            ],
            model: 'llama-3.3-70b-versatile',
        });
        
        return `🔍 *Scan Results: ${target}*\n\n${completion.choices[0]?.message?.content}`;
    } catch (error) {
        return '❌ Scan failed. Please check the target and try again.';
    }
}

async function analyzeFraud(chatText: string): Promise<string> {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: 'system', 
                    content: `You are a fraud detection expert. Analyze the chat for scam patterns and provide:
                    - Fraud Probability (0-100%)
                    - Risk Level (Low/Medium/High/Critical)
                    - Top 3 red flags
                    - Quick recommendation
                    Keep it WhatsApp-friendly with emojis. Max 500 characters.`
                },
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
    const context = incidents.slice(0, 5).map(i => 
        `${i.title} (${i.severity}, ${i.sector})`
    ).join('\n');
    
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { 
                    role: 'system', 
                    content: `You are CyberWatch Sentinel AI, a cybersecurity expert assistant on WhatsApp. 
                    Provide helpful, concise answers about cybersecurity. Use emojis and keep responses under 500 characters.
                    
                    Recent threats:
                    ${context}`
                },
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

// Clean up old sessions periodically
setInterval(() => {
    const now = Date.now();
    for (const [userId, session] of userSessions.entries()) {
        if (now - session.lastActive > 3600000) { // 1 hour
            userSessions.delete(userId);
        }
    }
}, 300000); // Every 5 minutes
