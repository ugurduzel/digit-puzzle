const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");
const db = require("../../models/gameModel");
const {
    generateRandomNumber,
    getResult,
    notDistinct,
    extractUsername,
    logMessage,
    unexpectedErrorKeyboard,
} = require("../../utils");

const _ = require("lodash");

const { storage } = require("../../cache");
const { minLevel, maxLevel } = require("../../configs/constants.json");
const levels = _.range(minLevel, maxLevel + 1);
const mp_ongoingScene = new Scene("mp_ongoingScene");

mp_ongoingScene.action("OK", (ctx) => {
    return ctx.reply("OK!");
});

mp_ongoingScene.action("FIN_PLAY_AGAIN", (ctx) => {
    return ctx.replyWithHTML(
        `Okay, let's play again.\n\nChoose difficulty level\n\n<b>3</b> is too easy, <b>4</b> is the most fun`,
        Markup.keyboard(levels.map((l) => `${l} digits`))
            .removeKeyboard(true)
            .forceReply(true)
            .oneTime()
            .resize()
            .extra()
    );
});

mp_ongoingScene.action("Quit", (ctx) => {
    let user1 = { ...storage.get(ctx.chat.id).user1 };
    let user2 = { ...storage.get(ctx.chat.id).user2 };

    let loser = null;
    let winner = user1;

    mpGame = storage.get(ctx.chat.id);

    let copy = { ...mpGame };

    if (ctx.from.id === user1.id) {
        loser = user1;
        winner = user2;

        winner.wins = winner.wins + 1 || 1;

        copy.user2 = winner;

        storage.set(ctx.chat.id, copy);
    } else {
        loser = user2;
        winner = user1;

        winner.wins = winner.wins + 1 || 1;

        copy.user1 = winner;

        storage.set(ctx.chat.id, copy);
    }

    return ctx.reply(
        `<b>${loser.name} quitted. ${winner.name} won!</b> 🎊🎉\n\n${winner.name}'s number was ${winner.number}\n${
            loser.name
        }'s number was ${loser.number}\n\n
        ${user1.name} won ${user1.wins || 0} times\n${user2.name} won ${user2.wins || 0} times`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "FIN_PLAY_AGAIN")]))
    );
});

mp_ongoingScene.action("History", (ctx) => {
    try {
        const currentPlayer = getCurrentPlayer(ctx);

        let players = storage.get(ctx.chat.id);

        let history = null;
        let s = null;

        if (players.user1.id === ctx.from.id) {
            history = players.user1.history;
            s = user1.name + "\n";
        } else {
            history = players.user2.history;
            s = user2.name + "\n";
        }

        for (let i = 0; i < history.length; i++) {
            s += "▪️ " + history[i].guess + " ➡️ ";
            s += history[i].result + "\n";
        }
        return ctx.reply(s);
    } catch (ex) {
        console.log("Unexpected error. " + ex);
        unexpectedErrorKeyboard(ctx);
    }
});

mp_ongoingScene.enter((ctx) => {
    try {
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
    } catch (ex) {
        console.log("Unexpected error. " + ex);
        unexpectedErrorKeyboard(ctx);
    }
});

mp_ongoingScene.hears(/.*/, (ctx) => {
    try {
        if (ctx.message.text === "3 digits" || ctx.message.text === "4 digits" || ctx.message.text === "5 digits") {
            let mpGame = storage.get(ctx.chat.id);

            const level = eval(ctx.match[0][0]);

            console.log(level + " digit level chosen in play again");

            let user1 = { ...mpGame.user1 };
            let user2 = { ...mpGame.user2 };

            user1.number = generateRandomNumber(level);
            user2.number = generateRandomNumber(level);

            logMessage(
                `****** Multiplayer Game ******\n${user1.name}'s number is ${user1.number}\n${user2.name}'s number is ${user2.number}\n`
            );

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
                `Two different ${user1.number.length} digit numbers have been set for you guys.\n\nStart guessing....`
            );
        }

        if (storage.get(ctx.chat.id).turn && storage.get(ctx.chat.id).turn !== ctx.from.id) {
            return ctx.reply(
                "It's not your turn. " + extractUsername(ctx),
                Extra.HTML().inReplyTo(ctx.message.message_id)
            );
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
            return ctx.reply(
                `Cannot send a number with 0 in it!`,
                Markup.inlineKeyboard([withHistoryKeyboard]).extra()
            );
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

            return ctx.reply(
                `<b>Congrats ${winner.name}!</b> 🎊🎉\n\nNumber is <b>${winner.number.join("")}</b>.\nYou found it in ${
                    winner.guesses
                } tries. 🤯\n\n${user1.name} won ${user1.wins || 0} times\n${user2.name} won ${user2.wins || 0} times`,
                Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "FIN_PLAY_AGAIN")]))
            );
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
    } catch (ex) {
        console.log("Unexpected error. " + ex);
        unexpectedErrorKeyboard(ctx);
    }
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
