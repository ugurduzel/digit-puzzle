const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");

const navigationScene = new Scene("navigationScene");

navigationScene.action("SINGLEPLAYER_GAME", (ctx) => ctx.scene.enter("sp_beginScene"));

navigationScene.action("MULTIPLAYER_GAME", (ctx) => ctx.reply("Multiplayer is under construction.\n"));

navigationScene.action("NEW_GAME", (ctx) => {
    if (!ctx.gameStat.players) {
        ctx.gameStat.players = {};
    }
    if (ctx.gameStat.players[ctx.from.id]) {
        console.log("Player " + ctx.from.id + " is found\n" + ctx.gameStat.players[ctx.from.id]);
    } else {
        ctx.gameStat.players[ctx.from.id] = {};
        console.log("Adding a player with id" + ctx.from.id);
        ctx.reply("We have added you to our userbase. 👏\n\nHave fun! ");
    }
    ctx.gameStatDB.write();
    ctx.gameStatDB.read();

    return ctx.reply(
        `Singleplayer or Multiplayer?`,
        Markup.inlineKeyboard([
            Markup.callbackButton("Singleplayer", "SINGLEPLAYER_GAME"),
            Markup.callbackButton("Multiplayer", "MULTIPLAYER_GAME"),
        ]).extra()
    );
});

navigationScene.enter((ctx) => {
    return ctx.reply(
        `Singleplayer or Multiplayer?`,
        Markup.inlineKeyboard([
            Markup.callbackButton("Singleplayer", "SINGLEPLAYER_GAME"),
            Markup.callbackButton("Multiplayer", "MULTIPLAYER_GAME"),
        ]).extra()
    );
});

navigationScene.on("message", (ctx) =>
    ctx.reply(
        "Try /newgame",
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "NEW_GAME")]))
    )
);

module.exports = navigationScene;
