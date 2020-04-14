const Telegraf = require("telegraf");
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const Scene = require("telegraf/scenes/base");
const _ = require("lodash");

const commandArgsMiddleware = require("./middleware/commandArgs");
const { generateRandomNumber, getResult, notDistinct, playerLog, logMessage, getTime } = require("./utils");
const { admin_from_id, underMaintenance, minLevel, maxLevel } = require("./configs/constants.json");

const bot = new Telegraf(process.env.BOT_TOKEN || "");

bot.use(session());
bot.use(commandArgsMiddleware());

const levels = _.range(minLevel, maxLevel + 1);

const beginScene = new Scene("beginScene");
beginScene.enter((ctx) => {
    ctx.session.game = {};
    return ctx.reply(
        "Choose difficulty level\n\n3 is too easy, 4 is the most fun",
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

    ctx.session.game.number = ctx.session.game.number ? ctx.session.game.number : generateRandomNumber(level);
    ctx.session.game.guesses = 1;
    ctx.session.game.history = [];
    playerLog(ctx);

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

ongoingScene.command("newgame", (ctx) => {
    delete ctx.session.game;
    return ctx.scene.enter("beginScene");
});

ongoingScene.action("Quit", (ctx) => {
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

const stage = new Stage([beginScene, ongoingScene]);
bot.use(stage.middleware());

bot.command("newgame", (ctx) => {
    console.log(ctx.from);
    console.log(ctx.chat);
    if (underMaintenance === true && ctx.from.id !== admin_from_id) {
        logMessage(ctx.chat.first_name + " is trying to play.");
        return ctx.reply("Game is under maintenance now");
    }
    return ctx.scene.enter("beginScene");
});

bot.action("New Game", (ctx) => {
    if (underMaintenance === true && ctx.from.id !== admin_from_id) {
        logMessage(ctx.chat.first_name + " is trying to play.");
        return ctx.reply("Game is under maintenance now");
    }
    return ctx.scene.enter("beginScene");
});

bot.command("start", (ctx) => {
    if (underMaintenance === true && ctx.from.id !== admin_from_id) {
        logMessage(ctx.chat.first_name + " is trying to play.");
        return ctx.reply("Game is under maintenance now");
    }
    return ctx.reply(
        `Hi ${ctx.chat.first_name},\nWelcome to Digit Puzzle!\n`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "New Game")]))
    );
});

bot.on("message", (ctx) => {
    if (underMaintenance === true && ctx.from.id !== admin_from_id) {
        logMessage(ctx.chat.first_name + " is trying to play.");
        return ctx.reply("Game is under maintenance now");
    }
    return ctx.reply(
        "Try /newgame",
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "New Game")]))
    );
});

console.log("Launching the application... " + new Date(Date.now()).toTimeString().substring(0, 8));
bot.launch();
