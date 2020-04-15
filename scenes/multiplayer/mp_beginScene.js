const { generateRandomNumber, playerLog } = require("../../utils");
const { minLevel, maxLevel } = require("../../configs/constants.json");
const Markup = require("telegraf/markup");
const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const _ = require("lodash");

const { storage } = require("../../cache");

const { extractUsername } = require("../../utils");

const levels = _.range(minLevel, maxLevel + 1);

const mp_beginScene = new Scene("mp_beginScene");

mp_beginScene.action(/^[0-9] digits/, (ctx) => {
    if (!storage.has(ctx.chat.id)) {
        storage.set(ctx.chat.id, {
            user1: null,
            user2: null,
            turn: null,
        });
    }
    let mpGame = storage.get(ctx.chat.id);

    if (mpGame.get("user1").has("number") && mpGame.get("user1").has("number")) {
        return;
    }

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
    ctx.reply(`Hello ${extractUsername(ctx)}`);

    if (!storage.has(ctx.chat.id)) {
        storage.set(ctx.chat.id, {
            user1: null,
            user2: null,
            turn: null,
        });
    }
    let mpGame = storage.get(ctx.chat.id);

    if (mpGame.get("user1").id === ctx.message.id && !mpGame.get("user1").has("ready")) {
        mpGame.get("user1").set("ready", true);
        if (mpGame.get("user2").has("ready") && mpGame.get("user2").ready) {
            return ctx.reply(
                `Both players have joined.\n\nWe may begin now. Choose difficulty level\n\n<b>3</b> is too easy, <b>4</b> is the most fun`,
                Extra.HTML().markup((m) =>
                    m.inlineKeyboard(levels.map((l) => m.callbackButton(`${l} digits`, `${l} digits`)))
                )
            );
        }
    }
    if (mpGame.get("user2").id === ctx.message.id && !mpGame.get("user2").has("ready")) {
        mpGame.get("user2").set("ready", true);
        if (mpGame.get("user1").has("ready") && mpGame.get("user1").ready) {
            return ctx.reply(
                `Both players have joined.\n\nWe may begin now. Choose difficulty level\n\n<b>3</b> is too easy, <b>4</b> is the most fun`,
                Extra.HTML().markup((m) =>
                    m.inlineKeyboard(levels.map((l) => m.callbackButton(`${l} digits`, `${l} digits`)))
                )
            );
        }
    }
});

module.exports = mp_beginScene;
