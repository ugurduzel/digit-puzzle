const { generateRandomNumber, playerLog } = require("../../utils");
const { minLevel, maxLevel } = require("../../configs/constants.json");
const Markup = require("telegraf/markup");
const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const _ = require("lodash");

const levels = _.range(minLevel, maxLevel + 1);

const mp_beginScene = new Scene("mp_beginScene");

mp_beginScene.enter((ctx) => {
    return ctx.reply(
        "Choose difficulty level\n\n<b>3</b> is too easy, <b>4</b> is the most fun",
        Extra.HTML().markup((m) => m.inlineKeyboard(levels.map((l) => m.callbackButton(`${l} digits`, `${l} digits`))))
    );
});

mp_beginScene.action(/^[0-9] digits/, (ctx) => {
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

    ctx.session.users[0].number = ctx.session.users[0].number || generateRandomNumber(level);
    ctx.session.users[1].number = ctx.session.users[1].number || generateRandomNumber(level);

    ctx.session.users[0].guesses = 1;
    ctx.session.users[1].guesses = 1;

    ctx.session.users[0].history = [];
    ctx.session.users[1].history = [];
    //playerLog(ctx);

    return ctx.scene.enter("mp_ongoingScene");
});

module.exports = mp_beginScene;
