const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");
const db = require("../../models/gameModel");
const { getResult, notDistinct, formatTime } = require("../../utils");
const _ = require("lodash");

const { storage: mpGame } = require("../../cache");

const mp_ongoingScene = new Scene("mp_ongoingScene");

mp_ongoingScene.enter((ctx) => {
    let mpGame = storage.get(ctx.chat.id);
    return ctx.reply(
        `A ${mpGame.get("user1").number.length} digit number is set for both of you.\n\nStart guessing... 🧐\n\n${
            mpGame.get("user1").name
        }\'s turn.`
    );
});

mp_ongoingScene.action("FIN_PLAY_AGAIN", (ctx) => {
    return ctx.scene.enter("mp_navigationScene");
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

mp_ongoingScene.hears(/.*/, (ctx) => {
    let mpGame = storage.get(ctx.chat.id);
    let currentPlayer = getCurrentPlayer(ctx);

    const { history, number, guesses } = currentPlayer;

    if (isNaN(ctx.message.text)) {
        return ctx.reply(
            `Only send numbers!`,
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

        setPlayer(ctx, currentPlayer);

        const user1 = mpGame.get("user1");
        const user2 = mpGame.get("user2");

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

    if (mpGame.get("user1").id === currentPlayer) {
        mpGame.set("turn", mpGame.get("user2").id);
    } else {
        mpGame.set("turn", mpGame.get("user1").id);
    }

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
    let mpGame = storage.get(ctx.chat.id);

    const id = mpGame.get("turn");
    const user1 = mpGame.get("user1");
    return user1.id === id ? { ...user1 } : { ...mpGame.get("user2") };
}

function setPlayer(ctx, player) {
    let mpGame = storage.get(ctx.chat.id);
    const id = player.id;
    if (mpGame.get("user1").id === id) {
        mpGame.set("user1", player);
        return;
    }
    mpGame.set("user2", player);
}
