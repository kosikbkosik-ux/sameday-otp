const express = require('express');
const app = express();

app.use(express.json());

let messages = [];

// 🔢 KÓD KISZEDÉSE
function extractCode(text) {
    const match = text.match(/\d{4,8}/);
    return match ? match[0] : "";
}

// 📩 SMS fogadás
app.post('/sms', (req, res) => {
    const rawText = req.body.text || "";

    const msg = {
        code: extractCode(rawText),
        date: new Date(),
    };

    messages.unshift(msg);

    if (messages.length > 50) messages.pop();

    res.sendStatus(200);
});

// 🧹 törlés 2 perc után
setInterval(() => {
    const now = Date.now();
    messages = messages.filter(m => now - new Date(m.date).getTime() < 2 * 60 * 1000);
}, 10000);

// 💬 UI
app.get('/', (req, res) => {
    let html = `
    <html>
    <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
    body { font-family: Arial; background: #111; color: white; text-align: center; }
    .msg { background: #222; padding: 20px; margin: 10px; border-radius: 15px; }
    .code { font-size: 40px; color: #00ff99; font-weight: bold; letter-spacing: 3px; }
    </style>
    </head>
    <body>
    <h2>🔐 XIII. Gyűjtő OTP kód</h2>
    `;

    messages.forEach(m => {
        html += `
        <div class="msg">
            <div class="code">${m.code}</div>
            <small>${new Date(m.date).toLocaleTimeString()}</small>
        </div>
        `;
    });

    html += `
    <script>
    setTimeout(() => location.reload(), 2000);
    </script>
    </body></html>
    `;

    res.send(html);
});

app.listen(3000, () => console.log("Fut"));
