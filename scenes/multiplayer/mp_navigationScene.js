const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");

const { extractUsername } = require("../../utils");

const mp_navigationScene = new Scene("mp_navigationScene");

mp_navigationScene.action("JOIN_GAME", (ctx) => {
    if (ctx.session.users.length < 2) {
        ctx.session.users.push({ id: ctx.from.id, name: extractUsername(ctx) });
        let addedPlayer = ctx.session.users.find((u) => u.id === ctx.from.id);
        let replyStr = `We added ${addedPlayer.name}. Currently ${ctx.session.users.length}/2\n\n`;
        if (ctx.session.users.length < 2) {
            replyStr += `We are waiting for another player`;
            return ctx.reply(replyStr);
        }
        if (ctx.session.users.length === 2) {
            replyStr += `Both players joind.\n\n${ctx.session.users[0].name} vs ${ctx.session.users[1].name}\n\nLet\'s begin...`;
            ctx.reply(replyStr);
            return ctx.scene.enter("mp_beginScene");
        }
    }
    return ctx.reply(
        `This session is currently full.\nThere is a heating match between ${ctx.session.users[0].name} and ${ctx.session.users[1].name}`
    );
});

mp_navigationScene.enter((ctx) => {
    return ctx.reply(
        `Only 2 players can join the game.\nCurrently ${ctx.session.users.length}/2`,
        Markup.inlineKeyboard([Markup.callbackButton("Join!", "JOIN_GAME")]).extra()
    );
});

mp_navigationScene.on("message", (ctx) =>
    ctx.reply(
        "Try /newgame",
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "NEW_GAME")]))
    )
);

module.exports = mp_navigationScene;
