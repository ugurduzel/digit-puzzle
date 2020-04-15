const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");
const db = require("../../models/gameModel");
const { getResult, notDistinct, formatTime } = require("../../utils");
const _ = require("lodash");

const { storage } = require("../../cache");

const mp_ongoingScene = new Scene("mp_ongoingScene");

mp_ongoingScene.action("FIN_PLAY_AGAIN", (ctx) => {
    storage.get(ctx.chat.id).user1.ctx.scene.enter("mp_beginScene");
    storage.get(ctx.chat.id).user1.ctx.scene.enter("mp_beginScene");
    return;
});

mp_ongoingScene.action("Quit", (ctx) => {
    deleteSessionFeatures();
    return ctx.reply(
        `Quit is not fully implemented.`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "FIN_PLAY_AGAIN")]))
    );
    const { number } = ctx.session;
    deleteSessionFeatures();
    return ctx.reply(
        `Quitted\nThe number was ${number.join("")}`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "FIN_PLAY_AGAIN")]))
    );
});

mp_ongoingScene.action("History", (ctx) => {
    const currentPlayer = getCurrentPlayer(ctx);

    const { history } = currentPlayer;

    let s = "Your guesses,\n";
    for (let i = 0; i < history.length; i++) {
        s += "▪️ " + history[i].guess + " ➡️ ";
        s += history[i].result + "\n";
    }
    return ctx.reply(s);
});

mp_ongoingScene.action("OK", (ctx) => {
    ctx.reply("OK!");
});

mp_ongoingScene.hears(/^.*/, (ctx) => {
    console.log("Message: ", ctx.message.text);

    ctx.reply("We got your number " + ctx.message.text);

    if (!storage.has(ctx.chat.id)) {
        storage.set(ctx.chat.id, {
            user1: null,
            user2: null,
            turn: null,
        });
    }
    let mpGame = storage.get(ctx.chat.id);

    let currentPlayer = getCurrentPlayer(ctx);

    const { history, number, guesses } = currentPlayer;

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

    console.log(currentPlayer.name + " - Number: ", number);
    console.log(currentPlayer.name + " - Result: ", result);

    if (won) {
        currentPlayer.wins = currentPlayer.wins + 1 || 1;

        setPlayer(ctx, currentPlayer);

        const user1 = mpGame.user1;
        const user2 = mpGame.user2;

        ctx.reply(
            `<b>Congrats!</b> 🎊🎉\n\nNumber is <b>${number.join("")}</b>.\nYou found it in ${guesses} tries. 🤯\n\n
            ${user1.name} won ${user1.wins || 0} times\n
            ${user2.name} won ${user2.wins || 0} times`,
            Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "FIN_PLAY_AGAIN")]))
        );

        deleteSessionFeatures();
        return;
    }

    currentPlayer.guesses += 1;

    currentPlayer.history.push({ guess: ctx.message.text, result });

    let copy = { ...mpGame };
    if (mpGame.user1.id === currentPlayer) {
        copy.turn = mpGame.user2.id;
    } else {
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
            }\'s turn.`,
            Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("OK", "OK")]))
        );
    }
    return;
});

module.exports = mp_ongoingScene;

function deleteSessionFeatures() {
    delete session.users[0].number;
    delete session.users[0].guesses;
    delete session.users[0].history;
    delete session.users[1].number;
    delete session.users[1].guesses;
    delete session.users[1].history;
    delete session.turn;
    delete session.ready;
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
