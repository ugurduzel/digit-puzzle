const Telegraf = require("telegraf");
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const Scene = require("telegraf/scenes/base");
const _ = require("lodash");

const minLevel = 3;
const maxLevel = 5;

// Handler factoriess
const { enter, leave } = Stage;

const levels = _.range(minLevel, maxLevel + 1);

// Greeter scene
const beginScene = new Scene("beginScene");
beginScene.enter((ctx) => {
    ctx.session.game = {};
    return ctx.reply(
        "<b>Choose difficulty level</b>",
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
    console.log(level);

    if (level < minLevel || level > maxLevel) {
        return ctx.reply(
            "<b>Choose difficulty level</b>",
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
    //ctx.session.game.number = [1, 2, 3];
    ctx.session.game.number = generateRandomNumber(level);
    ctx.session.game.guesses = 1;

    return ctx.scene.enter("ongoingScene");
});

beginScene.on("message", (ctx) => {
    ctx.session.game = {};
    return ctx.reply(
        "<b>Choose difficulty level</b>",
        Extra.HTML().markup((m) =>
            m.inlineKeyboard(
                levels.map((l) =>
                    m.callbackButton(`${l} digits`, `${l} digits`)
                )
            )
        )
    );
});

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

const bot = new Telegraf(process.env.BOT_TOKEN);
//bot.telegram.setWebhook("https://2617c6b3.ngrok.io/new-message");
bot.telegram.setWebhook(
    "https://pacific-journey-79915.herokuapp.com/new-message"
);
bot.use(session());

const stage = new Stage([beginScene, ongoingScene]);
bot.use(stage.middleware());

bot.command("/start", async (ctx) => {
    console.log(await ctx.getChat());
    console.log(await ctx.getChatMembersCount());
    return ctx.reply(
        "Welcome to Digit Puzzle!\n",
        Extra.HTML().markup((m) =>
            m.inlineKeyboard([m.callbackButton("New Game", "New Game")])
        )
    );
});
bot.command("newgame", (ctx) => ctx.scene.enter("beginScene"));
bot.on("message", (ctx) =>
    ctx.reply(
        "Try /newgame",
        Extra.HTML().markup((m) =>
            m.inlineKeyboard([m.callbackButton("New Game", "New Game")])
        )
    )
);
bot.action("New Game", (ctx) => ctx.scene.enter("beginScene"));
bot.launch();

function generateRandomNumber(digits) {
    return _.sampleSize(_.range(1, 10), digits);
}

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
    return { won: false, result: `+${pos} -${neg}` };
}
