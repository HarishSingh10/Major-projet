import readline from 'readline';
import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState, 
    WAMessage,
    proto,
    Browsers
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import Groq from 'groq-sdk';
import pino from 'pino';
import { setQRCode, clearQRCode } from './qr-server';
const qrcode = require('qrcode-terminal');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text: string) => new Promise<string>((resolve) => rl.question(text, resolve));

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

export async function startWhatsAppBot(incidents: any[]) {
    const logger = pino({ level: 'silent' }); // Reduce noise
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        logger,
        auth: state,
        defaultQueryTimeoutMs: undefined,
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome')
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const phoneNumber = await question('📱 Please enter your WhatsApp phone number (with country code, e.g. 919876543210): ');
                const code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
                console.log('\n╔════════════════════════════════════════════════════════╗');
                console.log('║                                                        ║');
                console.log('║     📱 PAIRING CODE GENERATED                         ║');
                console.log(`║     Your code is: ${code}                            ║`);
                console.log('║                                                        ║');
                console.log('║     1. Open WhatsApp on your phone                     ║');
                console.log('║     2. Go to Settings -> Linked Devices                ║');
                console.log('║     3. Tap "Link a Device"                             ║');
                console.log('║     4. Tap "Link with phone number instead"            ║');
                console.log('║     5. Enter the code above                            ║');
                console.log('╚════════════════════════════════════════════════════════╝\n');
            } catch (err) {
                console.error('[WhatsApp] Failed to request pairing code:', err);
            }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Display QR code when available
        if (qr) {
            console.log('\n╔════════════════════════════════════════════════════════╗');
            console.log('║                                                        ║');
            console.log('║     📱 SCAN THIS QR CODE WITH WHATSAPP                ║');
            console.log('║                                                        ║');
            console.log('╚════════════════════════════════════════════════════════╝\n');
            qrcode.generate(qr, { small: true });
            console.log('\n📱 Open WhatsApp → Settings → Linked Devices → Link a Device');
            console.log('📷 Scan the QR code above\n');
            
            // Also make it available via web browser
            setQRCode(qr);
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('[WhatsApp] Connection closed. Reconnecting:', shouldReconnect);
            
            if (shouldReconnect) {
                startWhatsAppBot(incidents);
            }
        } else if (connection === 'open') {
            console.log('[WhatsApp] ✅ Bot connected successfully!');
            clearQRCode();
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid!;
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || '';

        if (!text) return;

        console.log(`[WhatsApp] Message from ${from}: ${text}`);

        // Get or create user session
        let session = userSessions.get(from);
        if (!session) {
            session = { history: [], lastActive: Date.now() };
            userSessions.set(from, session);
        }
        session.lastActive = Date.now();

        // Handle commands
        try {
            let response = '';

            if (text.toLowerCase().startsWith('/help')) {
                response = await handleHelp();
            } else if (text.toLowerCase().startsWith('/threats')) {
                response = await handleThreats(incidents);
            } else if (text.toLowerCase().startsWith('/critical')) {
                response = await handleCritical(incidents);
            } else if (text.toLowerCase().startsWith('/scan ')) {
                const target = text.substring(6).trim();
                response = await handleScan(target);
            } else if (text.toLowerCase().startsWith('/analyze')) {
                const targetText = text.substring(8).trim();
                if (targetText) {
                    response = await handleFraudAnalysis(targetText);
                } else {
                    response = "📱 *FraudShield Analyzer*\n\nPlease send the chat text you want to analyze in your next message.";
                    session.history.push({ role: 'system', content: 'awaiting_fraud_analysis' });
                }
            } else if (session.history.length > 0 && session.history[session.history.length - 1].content === 'awaiting_fraud_analysis') {
                response = await handleFraudAnalysis(text);
                session.history = []; // Clear after analysis
            } else {
                // General AI chat
                response = await handleAIChat(text, session.history, incidents);
                session.history.push({ role: 'user', content: text });
                session.history.push({ role: 'assistant', content: response });
                
                // Keep only last 10 messages
                if (session.history.length > 20) {
                    session.history = session.history.slice(-20);
                }
            }

            await sock.sendMessage(from, { text: response });
        } catch (error: any) {
            console.error('[WhatsApp] Error:', error);
            await sock.sendMessage(from, { 
                text: '❌ Sorry, I encountered an error. Please try again.' 
            });
        }
    });

    return sock;
}

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
    
    if (latest.length === 0) {
        return '📊 No incidents found. System is monitoring...';
    }

    let response = '🚨 *Latest Cyber Threats*\n\n';
    
    latest.forEach((inc, i) => {
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

async function handleCritical(incidents: any[]): Promise<string> {
    const critical = incidents.filter(i => i.severity === 'Critical').slice(0, 5);
    
    if (critical.length === 0) {
        return '✅ No critical threats detected at this time.';
    }

    let response = '🔴 *CRITICAL THREATS*\n\n';
    
    critical.forEach((inc) => {
        response += `⚠️ *${inc.title}*\n`;
        response += `   ${inc.description}\n`;
        response += `   🎯 Sector: ${inc.sector}\n`;
        response += `   📍 Location: ${inc.location.city}\n`;
        if (inc.threatActor) {
            response += `   👤 Actor: ${inc.threatActor}\n`;
        }
        response += `\n`;
    });

    return response;
}

async function handleScan(target: string): Promise<string> {
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
                    Keep it concise and use emojis.`
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

async function handleFraudAnalysis(chatText: string): Promise<string> {
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
                    Keep it WhatsApp-friendly with emojis.`
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
