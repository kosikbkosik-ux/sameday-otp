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
    body {
        font-family: Arial;
        background: linear-gradient(135deg, #0f172a, #020617);
        color: white;
        margin: 0;
        padding: 20px;
        text-align: center;
    }

    h2 {
        margin-bottom: 20px;
        color: #00ffcc;
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
        box-shadow: 0 0 20px rgba(0,255,150,0.15);
        transition: 0.2s;
    }

    .msg:hover {
        transform: scale(1.03);
    }

    .code {
        font-size: 42px;
        color: #00ff99;
        font-weight: bold;
        letter-spacing: 4px;
        cursor: pointer;
        text-shadow: 0 0 10px rgba(0,255,150,0.6);
    }

    .msg:first-child .code {
        font-size: 60px;
        color: #00ffcc;
    }

    .time {
        margin-top: 10px;
        font-size: 12px;
        color: #94a3b8;
    }

    .copied {
        color: #00ffcc;
        font-size: 14px;
        margin-top: 5px;
        display: none;
    }
    </style>
    </head>
    <body>

    <h2>🔐 Pickup gyűjtő OTP </h2>

    <div class="container">
    `;

    messages.forEach((m, i) => {
        html += `
        <div class="msg">
            <div class="code" onclick="copy(this, '${m.code}')">${m.code}</div>
            <div class="copied">✔ Másolva</div>
            <div class="time">${new Date(m.date).toLocaleTimeString("hu-HU", { timeZone: "Europe/Budapest" })}</div>
        </div>
        `;
    });

    html += `
    </div>

    <script>
    function copy(el, text) {
        navigator.clipboard.writeText(text);

        const msg = el.parentElement;
        const copied = msg.querySelector('.copied');

        copied.style.display = 'block';

        setTimeout(() => {
            copied.style.display = 'none';
        }, 1000);
    }

    setTimeout(() => location.reload(), 2000);
    </script>

    </body>
    </html>
    `;

    res.send(html);
});

    messages.forEach(m => {
        html += `
        <div class="msg">
            <div class="code">${m.code}</div>
            <small>${new Date(m.date).toLocaleTimeString("hu-HU", { timeZone: "Europe/Budapest" })}</small>
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
