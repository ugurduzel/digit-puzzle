const Telegraf = require("telegraf");
const Stage = require("telegraf/stage");
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
const mp_navigationScene = require("./scenes/multiplayer/mp_navigationScene");
const mp_beginScene = require("./scenes/multiplayer/mp_beginScene");
const mp_ongoingScene = require("./scenes/multiplayer/mp_ongoingScene");

// Models
const db = require("./models/gameModel");
const sessionModel = require("./models/sessionModel");

const { extractUsername } = require("./utils");

const stage = new Stage([
    navigationScene,
    sp_beginScene,
    sp_ongoingScene,
    mp_navigationScene,
    mp_beginScene,
    mp_ongoingScene,
]);

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

bot.action("JOIN_GAME", (ctx) => {
    if (ctx.session.users.length < 2) {
        ctx.session.users.push({ id: ctx.from.id, name: extractUsername(ctx) });
        let addedPlayer = ctx.session.users.find((u) => u.id === ctx.from.id);
        let replyStr = `We added ${addedPlayer.name}. Currently ${ctx.session.users.length}/2\n\n`;
        if (ctx.session.users.length < 2) {
            replyStr += `We are waiting for another player`;
            return ctx.reply(replyStr, Markup.inlineKeyboard([Markup.callbackButton("Join!", "JOIN_GAME")]).extra());
        }
        if (ctx.session.users.length === 2) {
            replyStr += `Both players joind.\n\n${ctx.session.users[0].name} vs ${ctx.session.users[1].name}\n\nLet\'s begin...`;
            ctx.reply(replyStr);
            return ctx.scene.enter("mp_beginScene");
        }
    }
    return ctx.reply(
        `This session is currently full.\nThere is a heating match between ${ctx.session.users[0].name} and ${ctx.session.users[1].name}`
    );
});

bot.action("NEW_MP_GAME", (ctx) => {
    return ctx.reply(
        `Only 2 players can join the game.\nCurrently ${ctx.session.users.length}/2`,
        Markup.inlineKeyboard([Markup.callbackButton("Join!", "JOIN_GAME")]).extra()
    );
});

bot.command("start", (ctx) => {
    if (ctx.chat.type !== "group") {
        return ctx.reply(
            `Hi ${ctx.chat.first_name},\nWelcome to Digit Puzzle! 🧩\n\nUse /howto command to see the detailed explanation.`,
            Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "NEW_GAME")]))
        );
    }
    if (!ctx.session.users) {
        ctx.session.users = [];
    }

    return ctx.reply(
        `Hi ${ctx.chat.first_name},\nWelcome to Digit Puzzle! 🧩\n\nUse /howto command to see the detailed explanation.`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "NEW_MP_GAME")]))
    );
});

console.log("Launching the application... " + new Date(Date.now()).toTimeString().substring(0, 8));
bot.launch();
