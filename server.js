console.log("BACKEND VERSION:", "v3.4");

const express = require('express');
const app = express();
const crypto = require('crypto');

app.use(express.json());

let messages = [];

// 🔢 OTP KÓD KISZEDÉS + SPAM SZŰRÉS
function extractCode(text) {
    if (!text) return "";

    const lower = text.toLowerCase().trim();

    const blocked = [
        "messages",
        "compose",
        "search",
        "button",
        "chat",
        "new message",
        "várakozás sms-re",
        "sms forwarder",
        "sensitive notification content hidden",
        "feldolgoztuk"
    ];

    for (const word of blocked) {
        if (lower.includes(word)) return "";
    }

    if (
        lower.includes("hívás") ||
        lower.includes("hivas") ||
        lower.includes("missed call") ||
        lower.includes("nem fogadott")
    ) {
        return "";
    }

    const otpKeywords = [
        "code",
        "otp",
        "authenticating",
        "verification",
        "verify",
        "pickup",
        "courier",
        "login",
        "security",
        "kód"
    ];

    if (!otpKeywords.some(k => lower.includes(k))) {
        return "";
    }

    const cleaned = text.replace(/[^0-9]/g, " ");
    const matches = cleaned.match(/\b\d{4,8}\b/g);
    if (!matches) return "";

    const digitsOnly = text.replace(/\D/g, "");
    const phonePatternNormalized = /^(?:36|06)\d{8,9}$/;
    const isPhone = phonePatternNormalized.test(digitsOnly);

    for (const num of matches) {
        if (num.length < 4 || num.length > 8) continue;

        // ha a normalizált telefonszámban benne van → telefonszám része
        if (isPhone && digitsOnly.includes(num)) continue;

        return num;
    }

    return "";
}

function isDuplicate(code, text) {
    const now = Date.now();
    return messages.some(m =>
        m.code === code &&
        m.full === text &&
        now - new Date(m.date).getTime() < 10000
    );
}

// POST /sms
app.post('/sms', (req, res) => {
    const rawText = req.body.message || req.body.text || "";

    console.log("RAW:", rawText);

    const code = extractCode(rawText);

    if (!code) {
        console.log("NEM OTP / SZŰRVE");
        return res.json({
            success: false,
            reason: "filtered_or_not_otp"
        });
    }

    if (isDuplicate(code, rawText)) {
        console.log("DUPLIKÁLT:", code);
        return res.json({
            success: false,
            reason: "duplicate"
        });
    }

    const msg = {
        id: crypto.randomUUID(),
        code: code,
        full: rawText,
        date: new Date(),
    };

    messages.unshift(msg);
    if (messages.length > 50) messages.pop();

    console.log("ÚJ OTP:", code);

    return res.json({
        success: true,
        code,
    });
});

// GET /sms – mostantól MINDIG JSON‑t küld
app.get('/sms', (req, res) => {
    const rawText = req.query.message || "";

    console.log("RAW GET:", rawText);

    const code = extractCode(rawText);

    if (!code) {
        console.log("GET SZŰRVE");
        return res.json({
            success: false,
            reason: "filtered_or_not_otp"
        });
    }

    if (isDuplicate(code, rawText)) {
        console.log("DUPLIKÁLT GET:", code);
        return res.json({
            success: false,
            reason: "duplicate"
        });
    }

    const msg = {
        id: crypto.randomUUID(),
        code: code,
        full: rawText,
        date: new Date(),
    };

    messages.unshift(msg);
    if (messages.length > 50) messages.pop();

    console.log("ÚJ OTP GET:", code);

    return res.json({
        success: true,
        code,
    });
});

app.get('/health', (req, res) => {
    res.send("OK - version v3.4");
});

setInterval(() => {
    const now = Date.now();
    messages = messages.filter(m =>
        now - new Date(m.date).getTime() < 2 * 60 * 1000
    );
}, 10000);

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
    .container { max-width: 500px; margin: auto; }
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
    .msg:first-child .code { font-size: 60px; }
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
        <div class="msg" data-id="${m.id}">
            <div class="code" onclick="copyCode('${m.code}')">${m.code}</div>
            <div class="time">
                ${new Date(m.date).toLocaleTimeString("hu-HU", {
                    timeZone: "Europe/Budapest"
                })}
            </div>
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
app.listen(PORT, () => {
    console.log("Fut a szerver:", PORT);
});
