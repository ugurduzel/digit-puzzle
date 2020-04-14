const Telegraf = require("telegraf");
const Stage = require("telegraf/stage");
const Extra = require("telegraf/extra");
const LocalSession = require("telegraf-session-local");

// Middlewares
const log = require("./middleware/log");
const howto = require("./middleware/howto");
const commandParts = require("telegraf-command-parts");
const underMaintenanceMiddleware = require("./middleware/maintenance");

// Scenes
const sp_beginScene = require("./scenes/singleplayer/sp_beginScene");
const sp_ongoingScene = require("./scenes/singleplayer/sp_ongoingScene");

const stage = new Stage([sp_beginScene, sp_ongoingScene]);

console.log(process.env.BOT_TOKEN);
const bot = new Telegraf(process.env.BOT_TOKEN || "");

const localSession = new LocalSession({
    storage: LocalSession.storageFileAsync,
    format: {
        serialize: (obj) => JSON.stringify(obj, null, 2), // null & 2 for pretty-formatted JSON
        deserialize: (str) => JSON.parse(str),
    },
    state: { messages: [] },
});

localSession.DB.then((DB) => {
    console.log("Current LocalSession DB:", DB.value());
});

bot.use(commandParts());

bot.use(howto());
bot.use(localSession.middleware());
bot.use(underMaintenanceMiddleware());
bot.use(stage.middleware());
bot.use(log());

bot.action("NEW_GAME", (ctx) => ctx.scene.enter("navigationScene"));

bot.command("start", (ctx) => {
    console.log(ctx.sessionDB);
    return ctx.reply(
        `Hi ${ctx.chat.first_name},\nWelcome to Digit Puzzle! 🧩\n`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "NEW_GAME")]))
    );
});

bot.command("play", (ctx) =>
    ctx.reply(Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "NEW_GAME")])))
);

console.log("Launching the application... " + new Date(Date.now()).toTimeString().substring(0, 8));
bot.launch();
