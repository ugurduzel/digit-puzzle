const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");

const { getResult, notDistinct, getTime } = require("../../utils");

const sp_ongoingScene = new Scene("sp_ongoingScene");

sp_ongoingScene.enter((ctx) => {
    return ctx.reply(`I have a ${ctx.session.number.length} digit number in mind.\n\nStart guessing... 🧐`);
});

sp_ongoingScene.action("PLAY_AGAIN", (ctx) => {
    ctx.session = null;
    return ctx.scene.enter("navigationScene");
});

sp_ongoingScene.action("Quit", (ctx) => {
    const { number } = ctx.session;
    delete ctx.session;
    ctx.reply(
        `Quitted\nThe number was ${number.join("")}`,
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "PLAY_AGAIN")]))
    );
    //ctx.scene.
});

sp_ongoingScene.action("History", (ctx) => {
    const { history } = ctx.session;
    let s = "Your guesses,\n";
    for (let i = 0; i < history.length; i++) {
        s += "▪️ " + history[i].guess + " ➡️ ";
        s += history[i].result + "\n";
    }
    return ctx.reply(s);
});

sp_ongoingScene.hears(/.*/, (ctx) => {
    if (!ctx.session) {
        return null;
    }
    if (isNaN(ctx.message.text)) {
        return ctx.reply(
            `Only send numbers!`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("Get History", "History"), m.callbackButton("Quit", "Quit")])
            )
        );
    }
    if (isNaN(ctx.message.text) || ctx.message.text.length !== ctx.session.number.length) {
        return ctx.reply(
            `Only send ${ctx.session.number.length} digit numbers!`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("Get History", "History"), m.callbackButton("Quit", "Quit")])
            )
        );
    }
    const digits = ctx.message.text.split("");
    if (digits.includes("0")) {
        return ctx.reply(
            `Cannot send a number with 0 in it!`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("Get History", "History"), m.callbackButton("Quit", "Quit")])
            )
        );
    }
    if (notDistinct(digits) === true) {
        return ctx.reply(
            `All digits must be different!`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("Get History", "History"), m.callbackButton("Quit", "Quit")])
            )
        );
    }

    const { won, result } = getResult(ctx.message.text, ctx.session.number);

    ctx.session.history.push({ guess: ctx.message.text, result });

    if (won) {
        const { number, guesses, start } = ctx.session;
        ctx.session = null;
        if (start) {
            return ctx.reply(
                `<b>Congrats!</b> 🎊🎉\n\nNumber is <b>${number.join("")}</b>.\nYou found it in ${getTime(start)}. 🤯`,
                Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "PLAY_AGAIN")]))
            );
        }
        return ctx.reply(
            `<b>Congrats!</b> 🎊🎉\n\nNumber is <b>${number.join("")}</b>.\nYou found it in ${guesses} tries. 🤯`,
            Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "PLAY_AGAIN")]))
        );
    }
    ctx.session.guesses += 1;
    return ctx.reply(
        result,
        Extra.HTML()
            .inReplyTo(ctx.message.message_id)
            .markup((m) =>
                m.inlineKeyboard([m.callbackButton("Get History", "History"), m.callbackButton("Quit", "Quit")])
            )
    );
});

module.exports = sp_ongoingScene;
