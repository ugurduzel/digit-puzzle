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
const chat_id = 369332762;

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
        s += ` -${neg}`;
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

function logToAdmin(ctx) {
    const msg = ctx.chat.first_name + " is playing. The number is " + ctx.session.game.number.join("");
    if (ctx.chat.user_name && ctx.chat.user_name === "ugurduzel") {
        telegram.sendMessage(chat_id, msg);
    }
    console.log(msg);
}

function getTime(start) {
    const millis = Date.now() - start;
    let seconds = Math.floor(millis / 1000);
    let minutes = 0;
    let hours = 0;
    let days = 0;
    if (seconds >= 60) {
        minutes = Math.floor(seconds / 60);
    }
    seconds -= minutes * 60;

    if (minutes >= 60) {
        hours = Math.floor(minutes / 60);
    }
    minutes -= hours * 60;
    if (hours >= 24) {
        days = Math.floor(hours / 24);
    }
    hours -= days * 24;

    const dayString = `${days !== 0 ? (days === 1 ? "1 day, " : days + " days, ") : ""}`;
    const hoursString = `${hours !== 0 ? (hours === 1 ? "1 hour, " : hours + " hours, ") : ""}`;
    const minutesString = `${minutes !== 0 ? (minutes === 1 ? "1 minute, " : minutes + " minutes, ") : ""}`;
    const secondsString = `${seconds !== 0 ? (seconds === 1 ? "1 second" : seconds + " seconds") : ""}`;
    return dayString + hoursString + minutesString + secondsString;
}

const beginScene = new Scene("beginScene");
beginScene.enter((ctx) => {
    ctx.session.game = {};
    return ctx.reply(
        "Choose difficulty level",
        Extra.HTML().markup((m) => m.inlineKeyboard(levels.map((l) => m.callbackButton(`${l} digits`, `${l} digits`))))
    );
});

beginScene.action(/^[0-9] digits/, (ctx) => {
    const level = eval(ctx.match[0][0]);

    if (level < minLevel || level > maxLevel) {
        return ctx.reply(
            "Choose difficulty level",
            "<p>Plase select from these inline options!</p>",
            Extra.HTML().markup((m) =>
                m.inlineKeyboard(levels.map((l) => m.callbackButton(`${l} digits`, `${l} digits`)))
            )
        );
    }
    ctx.session.game.number = generateRandomNumber(level);
    ctx.session.game.guesses = 1;
    ctx.session.game.history = [];
    logToAdmin(ctx);

    return ctx.reply(
        "Do you want to play against time?\nYou can aslo play to find in minimum steps.\n\n<b>Your Choice</b> 🤨",
        Extra.HTML().markup((m) =>
            m.inlineKeyboard([m.callbackButton("Time", "Against_Time"), m.callbackButton("Steps", "Against_Steps")])
        )
    );
});

beginScene.action("Against_Time", (ctx) => {
    ctx.session.game.start = Date.now();
    return ctx.scene.enter("ongoingScene");
});

beginScene.action("Against_Steps", (ctx) => {
    return ctx.scene.enter("ongoingScene");
});

beginScene.on("message", (ctx) => {
    ctx.session.game = {};
    ctx.session.game;
    return ctx.reply(
        "Choose difficulty level",
        Extra.HTML().markup((m) => m.inlineKeyboard(levels.map((l) => m.callbackButton(`${l} digits`, `${l} digits`))))
    );
});

const ongoingScene = new Scene("ongoingScene");
ongoingScene.enter((ctx) => {
    return ctx.reply(`I have a ${ctx.session.game.number.length} digit number in mind.\n\nStart guessing... 🧐`);
});

ongoingScene.action("New Game", (ctx) => {
    delete ctx.session.game;
    return ctx.scene.enter("beginScene");
});

ongoingScene.action("Quit", (ctx) => ctx.scene.leave("ongoingScene"));

ongoingScene.leave((ctx) => {
    const { number } = ctx.session.game;
    delete ctx.session.game;
    return ctx.reply(
        `Quitted\nThe number was ${number.join("")}`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("New Game", "New Game")]))
    );
});

ongoingScene.action("History", (ctx) => {
    const { history } = ctx.session.game;
    let s = "Your guesses,\n";
    for (let i = 0; i < history.length; i++) {
        s += "▪️ " + history[i].guess + " ➡️ ";
        s += history[i].result + "\n";
    }
    return ctx.reply(s);
});

ongoingScene.hears(/.*/, (ctx) => {
    if (!ctx.session.game) {
        return null;
    }
    if (isNaN(ctx.message.text) || ctx.message.text.length !== ctx.session.game.number.length) {
        return ctx.reply(
            `Only send ${ctx.session.game.number.length} digit numbers!`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("Get History", "History"), m.callbackButton("Quit", "Quit")])
            )
        );
    }
    const digits = ctx.message.text.split("");
    if (digits.includes("0")) {
        return ctx.reply(
            `Cannot send a number with 0 in it!`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("Get History", "History"), m.callbackButton("Quit", "Quit")])
            )
        );
    }
    if (notDistinct(digits) === true) {
        return ctx.reply(
            `All digits must be different!`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("Get History", "History"), m.callbackButton("Quit", "Quit")])
            )
        );
    }

    const { won, result } = getResult(ctx.message.text, ctx.session.game.number);

    ctx.session.game.history.push({ guess: ctx.message.text, result });

    if (won) {
        const { game } = ctx.session;
        delete ctx.session.game;
        if (game.start) {
            return ctx.reply(
                `<b>Congrats!</b> 🎊🎉\n\nNumber is <b>${game.number.join("")}</b>.\nYou found it in ${getTime(
                    game.start
                )}. 🤯`,
                Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("New Game", "New Game")]))
            );
        }
        return ctx.reply(
            `<b>Congrats!</b> 🎊🎉\n\nNumber is <b>${game.number.join("")}</b>.\nYou found it in ${
                game.guesses
            } tries. 🤯`,
            Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("New Game", "New Game")]))
        );
    }
    ctx.session.game.guesses += 1;
    return ctx.reply(
        result,
        Extra.HTML()
            .inReplyTo(ctx.message.message_id)
            .markup((m) =>
                m.inlineKeyboard([m.callbackButton("Get History", "History"), m.callbackButton("Quit", "Quit")])
            )
    );
});

const telegram = new Telegram(process.env.BOT_TOKEN || "");
const bot = new Telegraf(process.env.BOT_TOKEN || "");
const stage = new Stage([beginScene, ongoingScene]);
bot.use(session());
bot.use(stage.middleware());

bot.command("newgame", (ctx) => ctx.scene.enter("beginScene"));
bot.action("New Game", (ctx) => ctx.scene.enter("beginScene"));

bot.command("start", (ctx) =>
    ctx.reply(
        `Hi ${ctx.chat.first_name},\nWelcome to Digit Puzzle!\n`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "New Game")]))
    )
);
bot.on("message", (ctx) =>
    ctx.reply(
        "Try /newgame",
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "New Game")]))
    )
);

console.log("Launching the application... " + new Date(Date.now()).toTimeString().substring(0, 8));
bot.launch();
