const Scene = require("telegraf/scenes/base");
const Extra = require("telegraf/extra");

const ongoingScene = new Scene("ongoingScene");
ongoingScene.enter((ctx) => {
    console.log(ctx.session.game);
    return ctx.reply(
        "Only send your guesses. Each message counts. Start guessing..."
    );
});

ongoingScene.action("New Game", (ctx) => {
    delete ctx.session.game;
    return ctx.scene.enter("beginScene");
});

ongoingScene.action("Quit", (ctx) => {
    const { number } = ctx.session.game;
    delete ctx.session.game;
    return ctx.reply(
        `Quitted\nThe number was ${number.join("")}`,
        Extra.HTML().markup((m) =>
            m.inlineKeyboard([m.callbackButton("New Game", "New Game")])
        )
    );
});

ongoingScene.hears(/.*/, (ctx) => {
    if (!ctx.session.game) {
        return null;
    }
    if (
        isNaN(ctx.message.text) ||
        ctx.message.text.length !== ctx.session.game.number.length
    ) {
        return ctx.reply(
            `Only send ${ctx.session.game.number.length} digit numbers!`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("Quit", "Quit")])
            )
        );
    }
    const digits = ctx.message.text.split("");
    if (digits.includes("0")) {
        return ctx.reply(
            `Cannot send a number with 0 in it!`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("Quit", "Quit")])
            )
        );
    }
    if (notDistinct(digits) === true) {
        return ctx.reply(
            `All digits must be different!`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("Quit", "Quit")])
            )
        );
    }

    const { won, result } = getResult(
        ctx.message.text,
        ctx.session.game.number
    );
    if (won) {
        const { game } = ctx.session;
        delete ctx.session.game;
        return ctx.reply(
            `Congrats!\nNumber is ${game.number.join("")}.\nYou found it in ${
                game.guesses
            } tries.`,
            Extra.HTML().markup((m) =>
                m.inlineKeyboard([m.callbackButton("New Game", "New Game")])
            )
        );
    }
    ctx.session.game.guesses += 1;
    return ctx.reply(
        result,
        Extra.HTML().markup((m) =>
            m.inlineKeyboard([m.callbackButton("Quit", "Quit")])
        )
    );
});

function getResult(msg, number) {
    let pos = 0;
    let neg = 0;
    const guess = msg.split("").map(eval);
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === number[i]) {
            pos++;
            continue;
        }
        if (number.includes(guess[i])) {
            neg++;
        }
    }

    if (pos === number.length) {
        return { won: true, result: "+${pos}" };
    }
    let s = "";
    if (pos > 0) {
        s += `+${pos}`;
    }
    if (neg > 0) {
        s += `-${neg}`;
    }
    if (s === "") {
        s = "+0 -0";
    }
    return { won: false, result: s };
}

function notDistinct(_digits) {
    let digits = [..._digits];
    while (digits.length > 0) {
        const d = digits.pop();
        if (digits.includes(d)) {
            return true;
        }
    }
    return false;
}

module.exports = ongoingScene;
