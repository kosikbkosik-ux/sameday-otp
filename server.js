const express = require('express');
const app = express();
const crypto = require('crypto');

app.use(express.json());

let messages = [];

// 🔢 OTP KÓD KISZEDÉS + SPAM SZŰRÉS (VÉGLEGES, HIBAMENTES)
function extractCode(text) {

    if (!text) return "";

    const lower = text.toLowerCase().trim();

    // ❌ accessibility / UI spam
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
        if (lower.includes(word)) {
            return "";
        }
    }

    // ❌ nem OTP jellegű (hívás, nem fogadott, stb.)
    if (
        lower.includes("hívás") ||
        lower.includes("hivas") ||
        lower.includes("missed call") ||
        lower.includes("nem fogadott")
    ) {
        return "";
    }

    // 🔑 OTP kulcsszavak
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

    let hasOtpKeyword = otpKeywords.some(k => lower.includes(k));
    if (!hasOtpKeyword) {
        return "";
    }

    // 🔥 MINDEN nem szám karaktert szóközre cserélünk
    // Így a "123345" akkor is felismerhető, ha előtte ":" vagy utána "." van
    const cleaned = text.replace(/[^0-9]/g, " ");

    // 🔍 4–8 számjegy keresése
    const matches = cleaned.match(/\b\d{4,8}\b/g);
    if (!matches || matches.length === 0) {
        return "";
    }

    // ❌ telefonszám minták kizárása
    const phonePatterns = [
        /\+?\d{7,15}/,            // teljes telefonszám
        /\d{3}[-\s]?\d{3}[-\s]?\d{4}/,
        /\(\d{3}\)\s*\d{3}-\d{4}/
    ];

    // 🔥 végigmegyünk az összes találaton, és kiválasztjuk az első NEM telefonszám jellegűt
    for (const num of matches) {

        // ha a szám maga túl hosszú → nem OTP
        if (num.length > 8 || num.length < 4) continue;

        // ha a szám része egy telefonszámnak → skip
        if (phonePatterns.some(p => p.test(text) && text.includes(num))) {
            continue;
        }

        // ha idáig eljut → ez egy valódi OTP
        return num;
    }

    return "";
}

// 🧠 DUPLIKÁCIÓ SZŰRÉS
function isDuplicate(code, text) {

    const now = Date.now();

    return messages.some(m =>
        m.code === code &&
        m.full === text &&
        now - new Date(m.date).getTime() < 10000
    );
}

// 📩 POST
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

    if (messages.length > 50) {
        messages.pop();
    }

    console.log("ÚJ OTP:", code);

    return res.json({
        success: true,
        code,
    });
});

// 📩 GET
app.get('/sms', (req, res) => {

    const rawText = req.query.message || "";

    console.log("RAW GET:", rawText);

    const code = extractCode(rawText);

    if (!code) {
        console.log("GET SZŰRVE");
        return res.sendStatus(200);
    }

    if (isDuplicate(code, rawText)) {
        console.log("DUPLIKÁLT GET:", code);
        return res.sendStatus(200);
    }

    const msg = {
        id: crypto.randomUUID(),
        code: code,
        full: rawText,
        date: new Date(),
    };

    messages.unshift(msg);

    if (messages.length > 50) {
        messages.pop();
    }

    console.log("ÚJ OTP GET:", code);

    res.sendStatus(200);
});

// ❤️ HEALTH
app.get('/health', (req, res) => {
    res.send("OK");
});

// 🧹 AUTO CLEAN
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
