const Telegraf = require("telegraf");
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const Scene = require("telegraf/scenes/base");
const _ = require("lodash");

const beginScene = require("./scenes/singleplayer/beginScene");
const ongoingScene = require("./scenes/singleplayer/ongoingScene");

const commandArgsMiddleware = require("./middleware/commandArgs");
const { getResult, notDistinct, logMessage, getTime } = require("./utils");
const { admin_from_id, underMaintenance, minLevel, maxLevel } = require("./configs/constants.json");

const bot = new Telegraf(process.env.BOT_TOKEN || "");

bot.use(session());
bot.use(commandArgsMiddleware());

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
