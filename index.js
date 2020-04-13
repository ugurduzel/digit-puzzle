const express = require("express");
const Telegraf = require("telegraf");
const Extra = require("telegraf/extra");
const Stage = require("telegraf/stage");
const session = require("telegraf/session");

const beginScene = require("./scenes/beginScene");
const ongoingScene = require("./scenes/ongoingScene");

// Express REST app

const URL = "http://142.93.175.101";
const port = process.env.PORT || 8080;
const API_TOKEN = process.env.BOT_TOKEN || "";

const bot = new Telegraf(API_TOKEN);
const stage = new Stage([beginScene, ongoingScene]);

const secretPath = `/bot${API_TOKEN}`;

bot.telegram.setWebhook(URL + secretPath);

bot.use(session());
bot.use(stage.middleware());

bot.command("/start", async (ctx) => {
    return ctx.reply(
        "Welcome to Digit Puzzle!\n",
        Extra.HTML().markup((m) =>
            m.inlineKeyboard([m.callbackButton("🎮 Play now!", "New Game")])
        )
    );
});

bot.command("newgame", (ctx) => ctx.scene.enter("beginScene"));

bot.on("message", (ctx) =>
    ctx.reply(
        "Try /newgame",
        Extra.HTML().markup((m) =>
            m.inlineKeyboard([m.callbackButton("New Game", "New Game")])
        )
    )
);

bot.action("New Game", (ctx) => ctx.scene.enter("beginScene"));
bot.on("text", ({ replyWithHTML }) => replyWithHTML("<b>Hello</b>"));

const app = express();
app.use(bot.webhookCallback(secretPath));

app.get("/", (req, res) => res.send("Hello World!"));

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
