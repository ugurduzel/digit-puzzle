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

    if (mpGame.user1.hasOwnProperty("number") && mpGame.user2.hasOwnProperty("number")) {
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

    let user1 = { ...mpGame.user1 };
    let user2 = { ...mpGame.user2 };

    user1.number = user1.number || generateRandomNumber(level);
    user2.number = user2.number || generateRandomNumber(level);

    user1.guesses = 1;
    user2.guesses = 1;

    user1.history = [];
    user2.history = [];

    let copy = { ...mpGame };
    copy.user1 = user1;
    copy.user2 = user2;
    copy.turn = user1.id;

    storage.set(ctx.chat.id, copy);

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

    console.log("In begin scene now, ", mpGame);
    console.log("In begin scene now, in if -> ", mpGame.user1);

    if (mpGame.user1 && mpGame.user1.id === ctx.from.id && !mpGame.user1.hasOwnProperty("ready")) {
        let copy = { ...mpGame };
        copy.user1.ready = true;
        storage.set(ctx.chat.id, copy);
        if (mpGame.user2.hasOwnProperty("ready") && mpGame.user2.ready) {
            return ctx.reply(
                `Both players have joined.\n\nWe may begin now. Choose difficulty level\n\n<b>3</b> is too easy, <b>4</b> is the most fun`,
                Extra.HTML().markup((m) =>
                    m.inlineKeyboard(levels.map((l) => m.callbackButton(`${l} digits`, `${l} digits`)))
                )
            );
        }
    }
    if (mpGame.user2 && mpGame.user2.id === ctx.from.id && !mpGame.user2.hasOwnProperty("ready")) {
        let copy = { ...mpGame };
        copy.user2.ready = true;
        storage.set(ctx.chat.id, copy);
        if (mpGame.user1.hasOwnProperty("ready") && mpGame.user1.ready) {
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
