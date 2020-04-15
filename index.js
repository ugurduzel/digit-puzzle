const Telegraf = require("telegraf");
const Stage = require("telegraf/stage");
const Markup = require("telegraf/markup");
const Extra = require("telegraf/extra");

// Middlewares
const log = require("./middleware/log");
const howto = require("./middleware/howto");
const commandParts = require("telegraf-command-parts");
const underMaintenanceMiddleware = require("./middleware/maintenance");
const mpFilter = require("./middleware/mpFilter");

// Scenes
const navigationScene = require("./scenes/navigationScene");
const sp_beginScene = require("./scenes/singleplayer/sp_beginScene");
const sp_ongoingScene = require("./scenes/singleplayer/sp_ongoingScene");
const mp_beginScene = require("./scenes/multiplayer/mp_beginScene");
const mp_ongoingScene = require("./scenes/multiplayer/mp_ongoingScene");

// Models
const db = require("./models/gameModel");
const sessionModel = require("./models/sessionModel");

const { extractUsername, howMany } = require("./utils");
let { storage: mpGame } = require("./cache");

const stage = new Stage([navigationScene, sp_beginScene, sp_ongoingScene, mp_beginScene, mp_ongoingScene]);

const bot = new Telegraf(process.env.BOT_TOKEN || "");

bot.use(commandParts());
bot.use(howto());
bot.use(mpFilter());
bot.use(sessionModel.middleware());
bot.use(underMaintenanceMiddleware());
bot.use(stage.middleware());
//bot.use(log());

bot.action("NEW_GAME", (ctx) => {
    let player = db.get("players").find({ id: ctx.from.id });
    if (!player.value()) {
        ctx.reply("Just a second...");
        db.get("players")
            .push({
                id: ctx.from.id,
            })
            .write();
        ctx.reply("We have added you to our userbase. 👏\n\nHave fun! ");
    } else {
        console.log("Player " + ctx.from.id + " is found\n" + player);
    }

    return ctx.scene.enter("navigationScene");
});

bot.action("NEW_MP_GAME", (ctx) => {
    return ctx.reply(
        `Only 2 players should join the game.\nCurrently ${howMany(mpGame)}/2`,
        Markup.inlineKeyboard([Markup.callbackButton("Join!", "JOIN_GAME")]).extra()
    );
});

bot.action("JOIN_GAME", (ctx) => {
    if (howMany(mpGame) === 0) {
        const name = extractUsername(ctx);
        mpGame.set("user1", { id: ctx.from.id, name });
        return ctx.reply(
            `I added ${name}. Currently 1/2.\n\nWe are waiting for another player`,
            Markup.inlineKeyboard([Markup.callbackButton("Join!", "JOIN_GAME")]).extra()
        );
    }

    if (howMany(mpGame) === 1) {
        const name = extractUsername(ctx);
        mpGame.set("user2", { id: ctx.from.id, name });
        ctx.reply(` Both players joind.\n\n${mpGame.get("user1").name} vs ${name}\n\nLet\'s begin...`);
        return ctx.scene.enter("mp_beginScene");
    }

    return ctx.reply(
        `This session is currently full.\nThere is a heating match between 
        ${mpGame.get("user1").name} vs ${mpGame.get("user2").name}`
    );
});

bot.command("start", (ctx) => {
    // console.log("Chat: ", ctx.chat);
    // console.log("\n\nFrom: ", ctx.from);
    if (ctx.chat.type !== "group") {
        return ctx.reply(
            `Hi ${ctx.chat.first_name},\nWelcome to Digit Puzzle! 🧩\n\nUse /howto command to see the detailed explanation.`,
            Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "NEW_GAME")]))
        );
    }
    if (!mpGame.has(ctx.chat.id)) {
        mpGame.set(ctx.chat.id, {
            user1: null,
            user2: null,
            turn: null,
        });
    }
    mpGame = mpGame.get(ctx.chat.id);

    return ctx.reply(
        `Hi group ${ctx.chat.title},\nWelcome to Digit Puzzle! 🧩\n\nUse /howto command to see the detailed explanation.`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "NEW_MP_GAME")]))
    );
});

console.log("Launching the application... " + new Date(Date.now()).toTimeString().substring(0, 8));
bot.launch();
