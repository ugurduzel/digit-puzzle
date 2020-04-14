const Telegraf = require("telegraf");
const Stage = require("telegraf/stage");
const Extra = require("telegraf/extra");

// Middlewares
const log = require("./middleware/log");
const howto = require("./middleware/howto");
const commandParts = require("telegraf-command-parts");
const underMaintenanceMiddleware = require("./middleware/maintenance");

// Scenes
const nagivationScene = require("./scenes/nagivationScene");
const sp_beginScene = require("./scenes/singleplayer/sp_beginScene");
const sp_ongoingScene = require("./scenes/singleplayer/sp_ongoingScene");

// Models
const { gameModel } = require("./models/gameModel");
const { sessionModel } = require("./models/sessionModel");

const stage = new Stage([nagivationScene, sp_beginScene, sp_ongoingScene]);

const bot = new Telegraf(process.env.BOT_TOKEN || "");

bot.use(commandParts());

bot.use(howto());
bot.use(gameModel.middleware());
bot.use(sessionModel.middleware());
bot.use(underMaintenanceMiddleware());
bot.use(stage.middleware());
bot.use(log());

bot.action("NEW_GAME", (ctx) => ctx.scene.enter("navigationScene"));

bot.command("start", (ctx) => {
    return ctx.reply(
        `Hi ${ctx.chat.first_name},\nWelcome to Digit Puzzle! 🧩\n\nUse /howto command to see the detailed explanation.`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "NEW_GAME")]))
    );
});

console.log("Launching the application... " + new Date(Date.now()).toTimeString().substring(0, 8));
bot.launch();
