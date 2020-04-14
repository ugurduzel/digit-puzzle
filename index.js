const Telegraf = require("telegraf");
const Stage = require("telegraf/stage");
const Extra = require("telegraf/extra");

// Middlewares
const log = require("./middleware/log");
const howto = require("./middleware/howto");
const commandParts = require("telegraf-command-parts");
const underMaintenanceMiddleware = require("./middleware/maintenance");

// Scenes
const navigationScene = require("./scenes/navigationScene");
const sp_beginScene = require("./scenes/singleplayer/sp_beginScene");
const sp_ongoingScene = require("./scenes/singleplayer/sp_ongoingScene");

// Models
const gameModel = require("./models/gameModel");
const sessionModel = require("./models/sessionModel");

console.log("\n\n SessionModel: \n\n", sessionModel);

const stage = new Stage([navigationScene, sp_beginScene, sp_ongoingScene]);

const bot = new Telegraf(process.env.BOT_TOKEN || "");

bot.use(commandParts());
//bot.use(howto());
bot.use(gameModel.middleware());
bot.use(sessionModel.middleware());
bot.use(underMaintenanceMiddleware());
bot.use(stage.middleware());
//bot.use(log());

bot.action("NEW_GAME", (ctx) => {
    if (ctx.game.players[ctx.from.id]) {
        console.log("Player " + ctx.from.id + " is found\n" + ctx.game.players[ctx.from.id]);
    } else {
        ctx.game.players[ctx.from.id] = {};
        console.log("Adding a player with id" + ctx.from.id);
        ctx.reply("We have added you to our userbase. 👏\n\nHave fun! ");
    }

    return ctx.scene.enter("navigationScene");
});

bot.command("start", (ctx) => {
    console.log("ctx.game : ", ctx.game);
    console.log("ctx.session : ", ctx.session);
    return ctx.reply(
        `Hi ${ctx.chat.first_name},\nWelcome to Digit Puzzle! 🧩\n\nUse /howto command to see the detailed explanation.`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "NEW_GAME")]))
    );
});

console.log("Launching the application... " + new Date(Date.now()).toTimeString().substring(0, 8));
bot.launch();
