const { generateRandomNumber, playerLog } = require("../../utils");
const { minLevel, maxLevel } = require("../../configs/constants.json");
const Markup = require("telegraf/markup");
const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const _ = require("lodash");

const { storage: mpGame } = require("../../cache");

const levels = _.range(minLevel, maxLevel + 1);

const mp_beginScene = new Scene("mp_beginScene");

mp_beginScene.action(/^[0-9] digits/, (ctx) => {
    console.log("Action received", ctx.from);

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

    let user1 = { ...mpGame.get("user1") };
    let user2 = { ...mpGame.get("user2") };

    user1.number = user1.number || generateRandomNumber(level);
    user2.number = user2.number || generateRandomNumber(level);

    user1.guesses = 1;
    user2.guesses = 1;

    user1.history = [];
    user2.history = [];

    mpGame.set("user1", user1);
    mpGame.set("user2", user2);

    mpGame.set("turn", user1.id);

    //playerLog(ctx);

    return ctx.scene.enter("mp_ongoingScene");
});

mp_beginScene.enter((ctx) => {
    return ctx.reply(
        `Welcome ${mpGame.get("user1").name} and ${
            mpGame.get("user2").name
        }\n\nChoose difficulty level\n\n<b>3</b> is too easy, <b>4</b> is the most fun`,
        Extra.HTML().markup((m) => m.inlineKeyboard(levels.map((l) => m.callbackButton(`${l} digits`, `${l} digits`))))
    );
});

module.exports = mp_beginScene;
