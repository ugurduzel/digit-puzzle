const levels = _.range(minLevel, maxLevel + 1);
const { generateRandomNumber, playerLog } = require("../../utils");
const { minLevel, maxLevel } = require("./configs/constants.json");
const Telegraf = require("telegraf");
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const Scene = require("telegraf/scenes/base");
const _ = require("lodash");

const { minLevel, maxLevel } = require("./configs/constants.json");

const beginScene = new Scene("beginScene");
beginScene.enter((ctx) => {
    ctx.session.game = {};
    return ctx.reply(
        "Choose difficulty level\n\n<b>3</b> is too easy, <b>5</b> is the most fun",
        Extra.HTML().markup((m) => m.inlineKeyboard(levels.map((l) => m.callbackButton(`${l} digits`, `${l} digits`))))
    );
});

beginScene.action(/^[0-9] digits/, (ctx) => {
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

    ctx.session.game.number = ctx.session.game.number ? ctx.session.game.number : generateRandomNumber(level);
    ctx.session.game.guesses = 1;
    ctx.session.game.history = [];
    playerLog(ctx);

    return ctx.reply(
        "Do you want to play against time?\nYou can aslo play to find in minimum steps.\n\n<b>Your Choice</b> 🤨",
        Extra.HTML().markup((m) =>
            m.inlineKeyboard([m.callbackButton("Time", "Against_Time"), m.callbackButton("Steps", "Against_Steps")])
        )
    );
});

beginScene.action("Against_Time", (ctx) => {
    ctx.session.game.start = Date.now();
    return ctx.scene.enter("ongoingScene");
});

beginScene.action("Against_Steps", (ctx) => {
    return ctx.scene.enter("ongoingScene");
});

beginScene.on("message", (ctx) => {
    ctx.session.game = {};
    ctx.session.game;
    return ctx.reply(
        "Choose difficulty level",
        Extra.HTML().markup((m) => m.inlineKeyboard(levels.map((l) => m.callbackButton(`${l} digits`, `${l} digits`))))
    );
});

module.exports = beginScene;
