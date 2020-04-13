const express = require("express");
const Telegraf = require("telegraf");
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const Scene = require("telegraf/scenes/base");
const _ = require("lodash");

const expressApp = express();

const minLevel = 3;
const maxLevel = 5;

const levels = _.range(minLevel, maxLevel + 1);

const beginScene = new Scene("beginScene");
beginScene.enter((ctx) => {
    ctx.session.game = {};
    return ctx.reply(
        "Choose difficulty level",
        Extra.HTML().markup((m) =>
            m.inlineKeyboard(
                levels.map((l) =>
                    m.callbackButton(`${l} digits`, `${l} digits`)
                )
            )
        )
    );
});

beginScene.action(/^[0-9] digits/, (ctx) => {
    const level = eval(ctx.match[0][0]);

    if (level < minLevel || level > maxLevel) {
        return ctx.reply(
            "Choose difficulty level",
            "<p>Plase select from these inline options!</p>",
            Extra.HTML().markup((m) =>
                m.inlineKeyboard(
                    levels.map((l) =>
                        m.callbackButton(`${l} digits`, `${l} digits`)
                    )
                )
            )
        );
    }
    ctx.session.game.number = generateRandomNumber(level);
    ctx.session.game.guesses = 1;

    return ctx.scene.enter("ongoingScene");
});

beginScene.on("message", (ctx) => {
    ctx.session.game = {};
    return ctx.reply(
        "Choose difficulty level",
        Extra.HTML().markup((m) =>
            m.inlineKeyboard(
                levels.map((l) =>
                    m.callbackButton(`${l} digits`, `${l} digits`)
                )
            )
        )
    );
});

const ongoingScene = new Scene("ongoingScene");
ongoingScene.enter((ctx) => {
    console.log(ctx.session.game);
    return ctx.reply(
        "Only send your guesses. Each message counts. Start guessing..."
    );
});

ongoingScene.action("New Game", (ctx) => {
    delete ctx.session.game;
    return ctx.scene.enter("beginScene");
});

ongoingScene.action("Quit", (ctx) => {
    const { number } = ctx.session.game;
    delete ctx.session.game;
    return ctx.reply(
        `Quitted\nThe number was ${number.join("")}`,
        Extra.HTML().markup((m) =>
            m.inlineKeyboard([m.callbackButton("New Game", "New Game")])
        )
    );
});

ongoingScene.hears(/.*/, (ctx) => {
    if (!ctx.session.game) {
        return null;
    }
    if (
        isNaN(ctx.message.text) ||
        ctx.message.text.length !== ctx.session.game.number.length
    ) {
        return ctx.reply(
            `Only send ${ctx.session.game.number.length} digit numbers!`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("Quit", "Quit")])
            )
        );
    }
    const digits = ctx.message.text.split("");
    if (digits.includes("0")) {
        return ctx.reply(
            `Cannot send a number with 0 in it!`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("Quit", "Quit")])
            )
        );
    }
    if (notDistinct(digits) === true) {
        return ctx.reply(
            `All digits must be different!`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("Quit", "Quit")])
            )
        );
    }

    const { won, result } = getResult(
        ctx.message.text,
        ctx.session.game.number
    );
    if (won) {
        const { game } = ctx.session;
        delete ctx.session.game;
        return ctx.reply(
            `Congrats!\nNumber is ${game.number.join("")}.\nYou found it in ${
                game.guesses
            } tries.`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("New Game", "New Game")])
            )
        );
    }
    ctx.session.game.guesses += 1;
    return ctx.reply(
        result,
        Extra.HTML().markup((m) =>
            m.inlineKeyboard([m.callbackButton("Quit", "Quit")])
        )
    );
});

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
            m.inlineKeyboard([m.callbackButton("New Game", "New Game")])
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

const gameShortName = "digitGame";
const gameUrl = "https://telegram.me/DigitPuzzleBot?game=digitGame";

const markup = Extra.markup(
    Markup.inlineKeyboard([
        Markup.gameButton("🎮 Play now!"),
        Markup.urlButton("Telegraf help", "http://telegraf.js.org"),
    ])
);

bot.start(({ replyWithGame }) => replyWithGame(gameShortName));
bot.command("foo", ({ replyWithGame }) => replyWithGame(gameShortName, markup));
bot.gameQuery(({ answerGameQuery }) => answerGameQuery(gameUrl));

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
