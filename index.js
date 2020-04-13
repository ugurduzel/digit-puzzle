const express = require("express");
const Telegraf = require("telegraf");
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const Scene = require("telegraf/scenes/base");
const _ = require("lodash");
const Telegram = require("telegraf/telegram");

const minLevel = 3;
const maxLevel = 5;

const levels = _.range(minLevel, maxLevel + 1);

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

function getMarkup(text, cb) {
    Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton(text, cb)]));
}

const bot = new Telegraf(process.env.BOT_TOKEN || "");
//const stage = new Stage([beginScene, ongoingScene]);
bot.use(session());
//bot.use(stage.middleware());

bot.command("start", (ctx) => ctx.reply("Welcome to Digit Puzzle!\n", getMarkup("🎮 Play now!", "New Game")));
// bot.command("newgame", (ctx) => ctx.scene.enter("beginScene"));
// bot.action("New Game", (ctx) => ctx.scene.enter("beginScene"));
bot.command("newgame", (ctx) => ctx.reply("Welcome, beginScene"));
bot.action("New Game", (ctx) => ctx.reply("Welcome, beginScene"));
bot.on("message", (ctx) => ctx.reply("Try /newgame", getMarkup("🎮 Play now!", "New Game")));

bot.launch();
