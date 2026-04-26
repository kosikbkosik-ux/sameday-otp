const express = require('express');
const app = express();

app.use(express.json());

let messages = [];

// 🔢 KÓD KISZEDÉSE
function extractCode(text) {
    const lower = text.toLowerCase();

    // ❌ ezek NEM OTP-k → dobjuk
    if (
        lower.includes("hívás") ||
        lower.includes("hivas") ||
        lower.includes("missed call") ||
        lower.includes("nem fogadott")
    ) {
        return "";
    }

    // ✅ OTP kulcsszavak (csak ezeknél fogadjuk el)
    if (
        lower.includes("code") ||
        lower.includes("otp") ||
        lower.includes("authenticating")
    ) {
        const match = text.match(/\b\d{4,8}\b/);
        return match ? match[0] : "";
    }

    return "";
}

// 🧠 DUPLIKÁCIÓ SZŰRÉS
function isDuplicate(code) {
    const now = Date.now();

    return messages.some(m =>
        m.code === code &&
        now - new Date(m.date).getTime() < 10000 // ⏱ 10 mp
    );
}

// 📩 POST
app.post('/sms', (req, res) => {
    const rawText = req.body.message || req.body.text || "";
    const code = extractCode(rawText);

    if (!code) return res.sendStatus(200);

    if (isDuplicate(code)) {
        console.log("DUPLIKÁLT, kihagyva:", code);
        return res.sendStatus(200);
    }

    const msg = {
        code: code,
        full: rawText,
        date: new Date(),
    };

    messages.unshift(msg);
    if (messages.length > 50) messages.pop();

    console.log("ÚJ OTP:", code);

    res.sendStatus(200);
});

// 📩 GET
app.get('/sms', (req, res) => {
    const rawText = req.query.message || "";
    const code = extractCode(rawText);

    if (!code) return res.sendStatus(200);

    if (isDuplicate(code)) {
        console.log("DUPLIKÁLT (GET), kihagyva:", code);
        return res.sendStatus(200);
    }

    const msg = {
        code: code,
        full: rawText,
        date: new Date(),
    };

    messages.unshift(msg);
    if (messages.length > 50) messages.pop();

    res.sendStatus(200);
});

// ❤️ HEALTH
app.get('/health', (req, res) => {
    res.send("OK");
});

// 🧹 törlés 2 perc után
setInterval(() => {
    const now = Date.now();
    messages = messages.filter(m =>
        now - new Date(m.date).getTime() < 2 * 60 * 1000
    );
}, 10000);

// 💬 UI
app.get('/', (req, res) => {
    let html = `
    <html>
    <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
    body {
        font-family: Arial;
        background: #000;
        color: white;
        text-align: center;
        padding: 20px;
    }

    .container {
        max-width: 500px;
        margin: auto;
    }

    .msg {
        background: #1e293b;
        padding: 20px;
        margin: 12px 0;
        border-radius: 20px;
    }

    .code {
        font-size: 40px;
        font-weight: bold;
        cursor: pointer;
    }

    .msg:first-child .code {
        font-size: 60px;
    }

    .time {
        font-size: 12px;
        color: #666;
        margin-top: 5px;
    }
    </style>
    </head>
    <body>

    <h2 style="font-size:40px;">Pickup OTP</h2>

    <div class="container">
    `;

    messages.forEach((m) => {
        html += `
        <div class="msg">
            <div class="code" onclick="copyCode('${m.code}')">${m.code}</div>
            <div class="time">${new Date(m.date).toLocaleTimeString("hu-HU", { timeZone: "Europe/Budapest" })}</div>
        </div>
        `;
    });

    html += `
    </div>

    <script>
    function copyCode(text) {
        navigator.clipboard.writeText(text);
    }

    setTimeout(() => location.reload(), 2000);
    </script>

    </body>
    </html>
    `;

    res.send(html);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Fut a szerver:", PORT));
