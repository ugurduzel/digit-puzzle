const express = require("express");
const Telegraf = require("telegraf");
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const Scene = require("telegraf/scenes/base");
const _ = require("lodash");

const beginScene = require("./scenes/beginScene");
const ongoingScene = require("./scenes/ongoingScene");

const expressApp = express();

const minLevel = 3;
const maxLevel = 5;

const gameShortName = "digitGame";
const gameUrl = "https://telegram.me/DigitPuzzleBot?game=digitGame";

const markup = Extra.markup(
    Markup.inlineKeyboard([
        Markup.gameButton("🎮 Play now!"),
        Markup.urlButton("Telegraf help", "http://telegraf.js.org"),
    ])
);

const levels = _.range(minLevel, maxLevel + 1);

const API_TOKEN = process.env.BOT_TOKEN || "";
const URL = "https://142.93.175.101";

const bot = new Telegraf(API_TOKEN);
expressApp.use(bot.webhookCallback(`/bot${API_TOKEN}`));
bot.telegram.setWebhook(`${URL}/bot${API_TOKEN}`);

bot.use(session());

const stage = new Stage([beginScene, ongoingScene]);
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
bot.launch();

function generateRandomNumber(digits) {
    return _.sampleSize(_.range(1, 10), digits);
}

function getResult(msg, number) {
    let pos = 0;
    let neg = 0;
    const guess = msg.split("").map(eval);
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === number[i]) {
            pos++;
            continue;
        }
        if (number.includes(guess[i])) {
            neg++;
        }
    }

    if (pos === number.length) {
        return { won: true, result: "+${pos}" };
    }
    let s = "";
    if (pos > 0) {
        s += `+${pos}`;
    }
    if (neg > 0) {
        s += `-${neg}`;
    }
    if (s === "") {
        s = "+0 -0";
    }
    return { won: false, result: s };
}

function notDistinct(_digits) {
    let digits = [..._digits];
    while (digits.length > 0) {
        const d = digits.pop();
        if (digits.includes(d)) {
            return true;
        }
    }
    return false;
}

const port = process.env.PORT || 8080;
expressApp.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
