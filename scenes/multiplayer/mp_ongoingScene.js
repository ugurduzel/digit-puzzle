const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");
const db = require("../../models/gameModel");
const { getResult, notDistinct, extractUsername, formatTime } = require("../../utils");
const { generateRandomNumber, playerLog } = require("../../utils");
const _ = require("lodash");

const { storage } = require("../../cache");
const { minLevel, maxLevel } = require("../../configs/constants.json");
const levels = _.range(minLevel, maxLevel + 1);
const mp_ongoingScene = new Scene("mp_ongoingScene");

mp_ongoingScene.action("OK", (ctx) => {
    return ctx.reply("OK!");
});

mp_ongoingScene.action("FIN_PLAY_AGAIN", (ctx) => {
    return ctx.reply(
        `Both players have joined.\n\nWe may begin now. Choose difficulty level\n\n<b>3</b> is too easy, <b>4</b> is the most fun`,
        Extra.HTML().markup((m) => m.inlineKeyboard(levels.map((l) => m.callbackButton(`${l} digits`, `${l} digits`))))
    );
});

mp_ongoingScene.action(/^[0-9] digits/, (ctx) => {
    if (!storage.has(ctx.chat.id)) {
        storage.set(ctx.chat.id, {
            user1: null,
            user2: null,
            turn: null,
        });
    }
    let mpGame = storage.get(ctx.chat.id);

    if (
        mpGame.user1 &&
        mpGame.user1.hasOwnProperty("number") &&
        mpGame.user2 &&
        mpGame.user2.hasOwnProperty("number")
    ) {
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

    user1.number = generateRandomNumber(level);
    user2.number = generateRandomNumber(level);

    console.log(`${user1.name}'s number is ${user1.number}`);
    console.log(`${user2.name}'s number is ${user2.number}`);

    user1.guesses = 1;
    user2.guesses = 1;

    user1.history = [];
    user2.history = [];

    let copy = { ...mpGame };
    copy.user1 = user1;
    copy.user2 = user2;
    copy.turn = user1.id;

    storage.set(ctx.chat.id, copy);
    return ctx.reply(
        `Two different ${user1.number} digit numbers have been set for you guys.\n\nStart guessing....`,
        Extra.HTML().markup((m) =>
            m.inlineKeyboard([m.callbackButton("Get History", "History"), m.callbackButton("Quit", "Quit")])
        )
    );
});

mp_ongoingScene.action("Quit", (ctx) => {
    //deleteSessionFeatures(ctx);
    return ctx.reply(
        `Quit is not fully implemented.`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "FIN_PLAY_AGAIN")]))
    );
    const { number } = ctx.session;
    deleteSessionFeatures(ctxctx);
    return ctx.reply(
        `Quitted\nThe number was ${number.join("")}`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "FIN_PLAY_AGAIN")]))
    );
});

mp_ongoingScene.action("History", (ctx) => {
    const currentPlayer = getCurrentPlayer(ctx);

    if (currentPlayer.id !== ctx.from.id) {
        return;
    }

    const { history } = currentPlayer;

    let s = "Your guesses,\n";
    for (let i = 0; i < history.length; i++) {
        s += "▪️ " + history[i].guess + " ➡️ ";
        s += history[i].result + "\n";
    }
    return ctx.reply(s);
});

mp_ongoingScene.enter((ctx) => {
    if (!storage.has(ctx.chat.id)) {
        storage.set(ctx.chat.id, {
            user1: null,
            user2: null,
            turn: null,
        });
    }

    if (ctx.from.id === storage.get(ctx.chat.id).user2.id) {
        return ctx.reply(
            `A ${
                storage.get(ctx.chat.id).user1.number.length
            } digit number is set for both of you.\n\nStart guessing... 🧐\n\n${
                storage.get(ctx.chat.id).user1.name
            }\'s turn.`
        );
    }
    return;
});

mp_ongoingScene.hears(/.*/, (ctx) => {
    if (storage.get(ctx.chat.id).turn && storage.get(ctx.chat.id).turn !== ctx.from.id) {
        return ctx.reply("It's not your turn. " + extractUsername(ctx), Extra.HTML().inReplyTo(ctx.message.message_id));
    }

    // if (!storage.has(ctx.chat.id)) {
    //     storage.set(ctx.chat.id, {
    //         user1: null,
    //         user2: null,
    //         turn: null,
    //     });
    // }
    let mpGame = storage.get(ctx.chat.id);

    let currentPlayer = getCurrentPlayer(ctx);

    const { history, number } = currentPlayer;

    if (isNaN(ctx.message.text)) {
        return ctx.reply(
            `Only send numbers! asdasd`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("Get History", "History"), m.callbackButton("Quit", "Quit")])
            )
        );
    }

    let withHistoryKeyboard = [];
    if (history && history.length > 0) {
        withHistoryKeyboard.push(Markup.callbackButton("Get History", "History"));
    }
    withHistoryKeyboard.push(Markup.callbackButton("Quit", "Quit"));

    if (isNaN(ctx.message.text) || ctx.message.text.length !== number.length) {
        return ctx.reply(
            `Only send ${number.length} digit numbers!`,
            Markup.inlineKeyboard([withHistoryKeyboard]).extra()
        );
    }
    const digits = ctx.message.text.split("");
    if (digits.includes("0")) {
        return ctx.reply(`Cannot send a number with 0 in it!`, Markup.inlineKeyboard([withHistoryKeyboard]).extra());
    }
    if (notDistinct(digits) === true) {
        return ctx.reply(`All digits must be different!`, Markup.inlineKeyboard([withHistoryKeyboard]).extra());
    }

    const { won, result } = getResult(ctx.message.text, number);

    if (won) {
        currentPlayer.wins = currentPlayer.wins + 1 || 1;

        mpGame = storage.get(ctx.chat.id);

        let copy = { ...mpGame };
        if (mpGame.user1.id === currentPlayer.id) {
            copy.user1 = currentPlayer;
        } else {
            copy.user2 = currentPlayer;
        }
        storage.set(ctx.chat.id, copy);

        const user1 = copy.user1;
        const user2 = copy.user2;

        let winner = null;

        if (currentPlayer.id === user1.id) {
            winner = user1;
        } else {
            winner = user2;
        }

        // storage.get(ctx.chat.id).user1.ctx.scene.enter("mp_beginScene");
        // storage.get(ctx.chat.id).user2.ctx.scene.enter("mp_beginScene");

        return ctx.reply(
            `<b>Congrats!</b> 🎊🎉\n\nNumber is <b>${winner.number.join("")}</b>.\nYou found it in ${
                winner.guesses
            } tries. 🤯\n\n${user1.name} won ${user1.wins || 0} times\n${user2.name} won ${user2.wins || 0} times`,
            Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "FIN_PLAY_AGAIN")]))
        );

        //deleteSessionFeatures(ctx);
        storage.get(ctx.chat.id).user1.ctx.scene.enter("mp_beginScene");
        storage.get(ctx.chat.id).user2.ctx.scene.enter("mp_beginScene");
        return;
    }

    currentPlayer.guesses += 1;

    currentPlayer.history.push({ guess: ctx.message.text, result });

    let copy = { ...mpGame };
    if (mpGame.user1.id === currentPlayer.id) {
        copy.user1 = currentPlayer;
        copy.turn = mpGame.user2.id;
    } else {
        copy.user2 = currentPlayer;
        copy.turn = mpGame.user1.id;
    }
    storage.set(ctx.chat.id, copy);

    ctx.reply(`It's your turn ${getCurrentPlayer(ctx).name}`);

    return ctx.reply(
        result,
        Extra.HTML()
            .inReplyTo(ctx.message.message_id)
            .markup((m) =>
                m.inlineKeyboard([m.callbackButton("Get History", "History"), m.callbackButton("Quit", "Quit")])
            )
    );
});

module.exports = mp_ongoingScene;

function deleteSessionFeatures(ctx) {
    let copy = { ...storage.get(ctx.chat.id) };

    delete copy.users1.number;
    delete copy.users1.guesses;
    delete copy.users1.history;
    delete copy.users2.number;
    delete copy.users2.guesses;
    delete copy.users2.history;
    copy.turn = null;

    storage.set(ctx.chat.id, copy);
}

function getCurrentPlayer(ctx) {
    if (!storage.has(ctx.chat.id)) {
        storage.set(ctx.chat.id, {
            user1: null,
            user2: null,
            turn: null,
        });
    }
    let mpGame = storage.get(ctx.chat.id);

    const id = mpGame.turn;
    const user1 = mpGame.user1;
    return user1.id === id ? { ...user1 } : { ...mpGame.user2 };
}

function setPlayer(ctx, player) {
    let mpGame = storage.get(ctx.chat.id);
    let copy = { ...mpGame };
    const id = player.id;
    if (mpGame.user1.id === id) {
        copy.user1 = player;
    } else {
        copy.user2 = player;
    }
    storage.set(ctx.chat.id, copy);
}
