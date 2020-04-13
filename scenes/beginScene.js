const _ = require("lodash");
const Scene = require("telegraf/scene");

const minLevel = 3;
const maxLevel = 5;

const levels = _.range(minLevel, maxLevel + 1);

const beginScene = new Scene("beginScene");
beginScene.enter((ctx) => {
    ctx.session.game = {};
    return ctx.reply(
        "Choose difficulty level",
        Extra.HTML().markup((m) =>
            m.inlineKeyboard(
                levels.map((l) =>
                    m.callbackButton(`${l} digits`, `${l} digits`)
                )
            )
        )
    );
});

beginScene.action(/^[0-9] digits/, (ctx) => {
    const level = eval(ctx.match[0][0]);

    if (level < minLevel || level > maxLevel) {
        return ctx.reply(
            "Choose difficulty level",
            "<p>Plase select from these inline options!</p>",
            Extra.HTML().markup((m) =>
                m.inlineKeyboard(
                    levels.map((l) =>
                        m.callbackButton(`${l} digits`, `${l} digits`)
                    )
                )
            )
        );
    }
    ctx.session.game.number = generateRandomNumber(level);
    ctx.session.game.guesses = 1;

    return ctx.scene.enter("ongoingScene");
});

beginScene.on("message", (ctx) => {
    ctx.session.game = {};
    return ctx.reply(
        "Choose difficulty level",
        Extra.HTML().markup((m) =>
            m.inlineKeyboard(
                levels.map((l) =>
                    m.callbackButton(`${l} digits`, `${l} digits`)
                )
            )
        )
    );
});

function generateRandomNumber(digits) {
    return _.sampleSize(_.range(1, 10), digits);
}

module.exports = beginScene;
