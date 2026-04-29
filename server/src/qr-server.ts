import express from 'express';

let currentQR: string | null = null;

export function setupQRServer(app: express.Application) {
    // Endpoint to display QR code in browser
    app.get('/whatsapp-qr', (req, res) => {
        if (!currentQR) {
            res.send(`
                <html>
                <head>
                    <title>WhatsApp QR Code</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }
                        .container {
                            background: white;
                            padding: 40px;
                            border-radius: 20px;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                            text-align: center;
                        }
                        h1 { color: #333; margin-bottom: 20px; }
                        .status { color: #666; font-size: 18px; }
                        .loading {
                            border: 4px solid #f3f3f3;
                            border-top: 4px solid #667eea;
                            border-radius: 50%;
                            width: 40px;
                            height: 40px;
                            animation: spin 1s linear infinite;
                            margin: 20px auto;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                    <script>
                        setTimeout(() => location.reload(), 3000);
                    </script>
                </head>
                <body>
                    <div class="container">
                        <h1>📱 WhatsApp QR Code</h1>
                        <div class="loading"></div>
                        <p class="status">⏳ Waiting for QR code...</p>
                        <p style="color: #999; font-size: 14px;">This page will refresh automatically</p>
                    </div>
                </body>
                </html>
            `);
        } else {
            res.send(`
                <html>
                <head>
                    <title>WhatsApp QR Code</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }
                        .container {
                            background: white;
                            padding: 40px;
                            border-radius: 20px;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                            text-align: center;
                            max-width: 500px;
                        }
                        h1 { color: #333; margin-bottom: 10px; }
                        .qr-code {
                            margin: 30px 0;
                            padding: 20px;
                            background: white;
                            border-radius: 10px;
                        }
                        .instructions {
                            text-align: left;
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 10px;
                            margin-top: 20px;
                        }
                        .instructions h3 {
                            margin-top: 0;
                            color: #667eea;
                        }
                        .instructions ol {
                            margin: 10px 0;
                            padding-left: 20px;
                        }
                        .instructions li {
                            margin: 8px 0;
                            color: #555;
                        }
                    </style>
                    <script>
                        setTimeout(() => location.reload(), 30000);
                    </script>
                </head>
                <body>
                    <div class="container">
                        <h1>📱 Scan with WhatsApp</h1>
                        <p style="color: #666;">QR Code is ready!</p>
                        <div class="qr-code">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentQR)}" alt="QR Code" />
                        </div>
                        <div class="instructions">
                            <h3>How to Connect:</h3>
                            <ol>
                                <li>Open <strong>WhatsApp</strong> on your phone</li>
                                <li>Go to <strong>Settings → Linked Devices</strong></li>
                                <li>Tap <strong>"Link a Device"</strong></li>
                                <li>Scan this QR code</li>
                                <li>✅ Connected! Send <strong>/help</strong> to test</li>
                            </ol>
                        </div>
                        <p style="color: #999; font-size: 12px; margin-top: 20px;">Page refreshes every 30 seconds</p>
                    </div>
                </body>
                </html>
            `);
        }
    });
}

export function setQRCode(qr: string) {
    currentQR = qr;
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                                                        ║');
    console.log('║     📱 QR CODE READY!                                 ║');
    console.log('║                                                        ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log('🌐 Open this URL in your browser to see the QR code:');
    console.log('   👉 http://localhost:5000/whatsapp-qr\n');
}

export function clearQRCode() {
    currentQR = null;
}
