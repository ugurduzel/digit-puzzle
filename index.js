const Telegraf = require("telegraf");
const Stage = require("telegraf/stage");
const Extra = require("telegraf/extra");
const session = require("telegraf/session");

// Middlewares
const howto = require("./middleware/howto");
const commandParts = require("telegraf-command-parts");
const underMaintenanceMiddleware = require("./middleware/maintenance");

// Scenes
const sp_beginScene = require("./scenes/singleplayer/sp_beginScene");
const sp_ongoingScene = require("./scenes/singleplayer/sp_ongoingScene");

const stage = new Stage([sp_beginScene, sp_ongoingScene]);

const bot = new Telegraf(process.env.BOT_TOKEN || "");

bot.use(commandParts());
bot.use(howto());
bot.use(underMaintenanceMiddleware());
bot.use(session());

bot.use(stage.middleware());

bot.action("NEW_GAME", (ctx) => ctx.scene.enter("navigationScene"));

bot.command("start", (ctx) =>
    ctx.reply(
        `Hi ${ctx.chat.first_name},\nWelcome to Digit Puzzle! 🧩\n`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "NEW_GAME")]))
    )
);

bot.command("play", (ctx) =>
    ctx.reply(Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "NEW_GAME")])))
);

console.log("Launching the application... " + new Date(Date.now()).toTimeString().substring(0, 8));
bot.launch();
