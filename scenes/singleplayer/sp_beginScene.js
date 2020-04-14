const { generateRandomNumber, playerLog } = require("../../utils");
const { minLevel, maxLevel } = require("../../configs/constants.json");
const Markup = require("telegraf/markup");
const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const _ = require("lodash");

const levels = _.range(minLevel, maxLevel + 1);

const sp_beginScene = new Scene("sp_beginScene");

sp_beginScene.enter((ctx) => {
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

    return ctx.reply(
        "Do you want to play against time?\nYou can aslo play to find in minimum steps.\n\n<b>Your Choice</b> 🤨",
        Extra.HTML().markup((m) =>
            m.inlineKeyboard([m.callbackButton("Time", "Against_Time"), m.callbackButton("Steps", "Against_Steps")])
        )
    );
});

sp_beginScene.action("Against_Time", (ctx) => {
    ctx.session.start = Date.now();
    return ctx.scene.enter("sp_ongoingScene");
});

sp_beginScene.action("Against_Steps", (ctx) => ctx.scene.enter("sp_ongoingScene"));

module.exports = sp_beginScene;
