const { generateRandomNumber, playerLog } = require("../../utils");
const { minLevel, maxLevel } = require("../../configs/constants.json");
const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const _ = require("lodash");

// Models
const { gameModel } = require("../../models/gameModel");

const levels = _.range(minLevel, maxLevel + 1);

const sp_beginScene = new Scene("sp_beginScene");

sp_beginScene.enter((ctx) => {
    ctx.session.game = {};
    return ctx.reply(
        "Choose difficulty level\n\n<b>3</b> is too easy, <b>4</b> is the most fun",
        Extra.HTML().markup((m) => m.inlineKeyboard(levels.map((l) => m.callbackButton(`${l} digits`, `${l} digits`))))
    );
});

sp_beginScene.action(/^[0-9] digits/, (ctx) => {
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

    ctx.session.number = ctx.session.number ? ctx.session.number : generateRandomNumber(level);
    ctx.session.guesses = 1;
    ctx.session.history = [];
    playerLog(ctx);

    if (ctx.game.players[ctx.from.id]) {
        console.log("Player " + ctx.from.id + " is found\n" + ctx.game.players[ctx.from.id]);
    } else {
        ctx.game.players[ctx.from.id] = {};
        console.log("Adding a player with id" + ctx.from.id);
    }

    return ctx.reply(
        "Do you want to play against time?\nYou can aslo play to find in minimum steps.\n\n<b>Your Choice</b> 🤨",
        Extra.HTML().markup((m) =>
            m.inlineKeyboard([m.callbackButton("Time", "Against_Time"), m.callbackButton("Steps", "Against_Steps")])
        )
    );
});

sp_beginScene.action("Against_Time", (ctx) => {
    ctx.session.start = Date.now();
    return ctx.scene.leave("sp_beginScene");
});

sp_beginScene.action("Against_Steps", (ctx) => ctx.scene.leave("sp_beginScene"));

sp_beginScene.leave((ctx) => ctx.scene.enter("sp_ongoingScene"));

module.exports = sp_beginScene;
