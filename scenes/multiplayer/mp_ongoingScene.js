const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");
const db = require("../../models/gameModel");
const { getResult, notDistinct, formatTime } = require("../../utils");
const _ = require("lodash");

function getCurrentPlayer(ctx) {
    const id = ctx.session.turn;
    return ctx.session.users.find((entry) => entry.id === id);
}

const mp_ongoingScene = new Scene("mp_ongoingScene");

mp_ongoingScene.enter((ctx) => {
    ctx.session.turn = ctx.session.users[0].id;
    return ctx.reply(
        `A ${ctx.session.users[0].number.length} digit number is set for both of you.\n\nStart guessing... 🧐\n\n${ctx.session.users[0].name}\'s turn.`
    );
});

mp_ongoingScene.action("FIN_PLAY_AGAIN", (ctx) => {
    return ctx.scene.enter("mp_navigationScene");
});

mp_ongoingScene.action("Quit", (ctx) => {
    deleteSessionFeatures(ctx.session);

    return ctx.reply(
        `Quit is not fully implemented.`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "FIN_PLAY_AGAIN")]))
    );
    const { number } = ctx.session;
    deleteSessionFeatures(ctx.session);
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
    if (!ctx.session) {
        return null;
    }

    let currentPlayer = getCurrentPlayer(ctx);

    const { history, number } = currentPlayer;

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

    ctx.session.users.find((e) => e.id === ctx.session.turn).history.push({ guess: ctx.message.text, result });

    currentPlayer = getCurrentPlayer(ctx);

    if (won) {
        const { number, guesses } = currentPlayer;

        ctx.reply(
            `<b>Congrats!</b> 🎊🎉\n\nNumber is <b>${number.join("")}</b>.\nYou found it in ${guesses} tries. 🤯\n\n
            ${ctx.session.users[0].name} won ${ctx.session.users[0].wins || 0} times\n
            ${ctx.session.users[1].name} won ${ctx.session.users[1].wins || 0} times`,
            Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "FIN_PLAY_AGAIN")]))
        );

        currentPlayer.wins = currentPlayer.wins + 1 || 1;

        deleteSessionFeatures(ctx.session);
        return;
    }
    currentPlayer.guesses += 1;

    if (ctx.session.users[0].id !== ctx.session.turn) {
        ctx.session.turn = ctx.session.users[0].id;
    } else {
        ctx.session.turn = ctx.session.users[1].id;
    }
    currentPlayer = getCurrentPlayer(ctx);
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

function deleteSessionFeatures(session) {
    delete session.users[0].number;
    delete session.users[0].guesses;
    delete session.users[0].history;
    delete session.users[1].number;
    delete session.users[1].guesses;
    delete session.users[1].history;
    delete session.turn;
}
