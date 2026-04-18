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
    console.log("TELJES BODY:", req.body);

    const rawText = req.body.message || req.body.text || "";

    console.log("RAW TEXT:", rawText);

    const code = extractCode(rawText) || rawText; // 🔥 EZ A LÉNYEG

    console.log("KINYERT KÓD:", code);

    const msg = {
        code: code,
        full: rawText,
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
    body {
        font-family: Arial;
        background: #000000;
        color: white;
        margin: 0;
        padding: 20px;
        text-align: center;
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
        color: #ffffff;
        font-weight: bold;
        cursor: pointer;
    }

    .msg:first-child .code {
        font-size: 60px;
    }

    .full {
        font-size: 14px;
        color: #aaa;
        margin-top: 10px;
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

    messages.forEach((m, i) => {
        html += `
        <div class="msg">
            <div class="code" onclick="copyCode('${m.code}')">${m.code}</div>
            <div class="full">${m.full}</div>
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
app.listen(PORT, () => console.log("Fut a szerver:", PORT));const express = require('express');
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
    console.log("TELJES BODY:", req.body);

    const rawText = req.body.message || req.body.text || "";

    console.log("RAW TEXT:", rawText);

    const code = extractCode(rawText) || rawText; // 🔥 EZ A LÉNYEG

    console.log("KINYERT KÓD:", code);

    const msg = {
        code: code,
        full: rawText,
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
    body {
        font-family: Arial;
        background: #000000;
        color: white;
        margin: 0;
        padding: 20px;
        text-align: center;
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
        color: #ffffff;
        font-weight: bold;
        cursor: pointer;
    }

    .msg:first-child .code {
        font-size: 60px;
    }

    .full {
        font-size: 14px;
        color: #aaa;
        margin-top: 10px;
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

    messages.forEach((m, i) => {
        html += `
        <div class="msg">
            <div class="code" onclick="copyCode('${m.code}')">${m.code}</div>
            <div class="full">${m.full}</div>
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
