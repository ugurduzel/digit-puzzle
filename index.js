const Telegraf = require("telegraf");
const Stage = require("telegraf/stage");
const Extra = require("telegraf/extra");
const session = require("telegraf/session");

// Middlewares
const commandArgsMiddleware = require("./middleware/commandArgs");
const underMaintenanceMiddleware = require("./middleware/maintenance");

// Scenes
const beginScene = require("./scenes/singleplayer/beginScene");
const ongoingScene = require("./scenes/singleplayer/ongoingScene");

const stage = new Stage([beginScene, ongoingScene]);

const bot = new Telegraf(process.env.BOT_TOKEN || "");

bot.use(commandArgsMiddleware());
bot.use(underMaintenanceMiddleware());
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
