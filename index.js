const Telegraf = require("telegraf");
const Stage = require("telegraf/stage");
const Markup = require("telegraf/markup");
const Extra = require("telegraf/extra");

// Middlewares
const howto = require("./middleware/howto");
const commandParts = require("telegraf-command-parts");
const underMaintenanceMiddleware = require("./middleware/maintenance");

// Scenes
const navigationScene = require("./scenes/navigationScene");
const sp_beginScene = require("./scenes/singleplayer/sp_beginScene");
const sp_ongoingScene = require("./scenes/singleplayer/sp_ongoingScene");
const mp_beginScene = require("./scenes/multiplayer/mp_beginScene");
const mp_ongoingScene = require("./scenes/multiplayer/mp_ongoingScene");

// Models
const db = require("./models/gameModel");
const sessionModel = require("./models/sessionModel");

const { extractUsername, howMany, unexpectedErrorKeyboard } = require("./utils");
let { storage } = require("./cache");

const stage = new Stage([navigationScene, sp_beginScene, sp_ongoingScene, mp_beginScene, mp_ongoingScene]);

const bot = new Telegraf(process.env.BOT_TOKEN || "");

bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username;
});

bot.catch((err, ctx) => {
    console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
});

bot.use(commandParts());
bot.use(howto());
bot.use(sessionModel.middleware());
//bot.use(underMaintenanceMiddleware());
bot.use(stage.middleware());

bot.action("NEW_GAME", (ctx) => {
    try {
        let player = db.get("players").find({ id: ctx.from.id });
        if (!player.value()) {
            db.get("players")
                .push({
                    id: ctx.from.id,
                })
                .write();
            ctx.reply("We have added you to our userbase. 👏\n\nHave fun! ");
        }

        return ctx.scene.enter("navigationScene");
    } catch (ex) {
        console.log("Unexpected error. " + ex);
        unexpectedErrorKeyboard(ctx);
    }
});

bot.action("NEW_MP_GAME", (ctx) => {
    try {
        let mpGame = storage.get(ctx.chat.id);

        return ctx.reply(
            `Only 2 players should join the game.\nCurrently ${howMany(ctx)}/2`,
            Markup.inlineKeyboard([Markup.callbackButton("Join!", "JOIN_GAME")]).extra()
        );
    } catch (ex) {
        console.log("Unexpected error. " + ex);
        unexpectedErrorKeyboard(ctx);
    }
});

bot.action("JOIN_GAME", (ctx) => {
    try {
        if (!storage.has(ctx.chat.id)) {
            storage.set(ctx.chat.id, {
                user1: null,
                user2: null,
                turn: null,
            });
        }
        let mpGame = storage.get(ctx.chat.id);

        if (howMany(ctx) === 0) {
            const name = extractUsername(ctx);
            let copy = { ...mpGame };
            copy.user1 = { id: ctx.from.id, name, ctx };
            storage.set(ctx.chat.id, copy);
            ctx.reply(
                `I added ${name}. Currently 1/2.\n\nWe are waiting for another player`,
                Markup.inlineKeyboard([Markup.callbackButton("Join!", "JOIN_GAME")]).extra()
            );
            return ctx.scene.enter("mp_beginScene");
        }

        if (howMany(ctx) === 1) {
            if (ctx.from.id === mpGame.user1.id) {
                return ctx.reply(`${mpGame.user1.name} You have already joined.`);
            }

            const name = extractUsername(ctx);
            let copy = { ...mpGame };
            copy.user2 = { id: ctx.from.id, name, ctx };
            storage.set(ctx.chat.id, copy);

            ctx.reply(` Both players joined.\n\n${mpGame.user1.name} vs ${name}\n\nLet\'s begin...`);
            return ctx.scene.enter("mp_beginScene");
        }

        return ctx.reply(
            `This session is currently full.\nThere is a heating match between 
        ${mpGame.user1.name} vs ${mpGame.user2.name}`
        );
    } catch (ex) {
        console.log("Unexpected error. " + ex);
        unexpectedErrorKeyboard(ctx);
    }
});

bot.command("start", (ctx) => {
    try {
        if (ctx.chat.type !== "supergroup") {
            return ctx.reply(
                `Hi ${ctx.chat.first_name},\nWelcome to Digit Puzzle! 🧩\n\nUse /howto command to see the detailed explanation.`,
                Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "NEW_GAME")]))
            );
        }
        if (!storage.has(ctx.chat.id)) {
            storage.set(ctx.chat.id, {
                user1: null,
                user2: null,
                turn: null,
            });
        }

        return ctx.reply(
            `Hi group ${ctx.chat.title},\nWelcome to Digit Puzzle! 🧩\n\nUse /howto command to see the detailed explanation.`,
            Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "NEW_MP_GAME")]))
        );
    } catch (ex) {
        console.log("Unexpected error. " + ex);
        unexpectedErrorKeyboard(ctx);
    }
});

console.log("Launching the application... " + new Date(Date.now()).toTimeString().substring(0, 8));
bot.launch();
