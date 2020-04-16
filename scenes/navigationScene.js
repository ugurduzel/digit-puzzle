const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");

const navigationScene = new Scene("navigationScene");

navigationScene.action("SINGLEPLAYER_GAME", (ctx) => ctx.scene.enter("sp_beginScene"));

navigationScene.action("MULTIPLAYER_GAME", (ctx) =>
    ctx.reply(
        "To play multiplayer,\n- Create a group chat with your friend\n- Add @DigitPuzzleBot to the group\n- Make the bot admin\n- Re-add the bot to the group again so that admin privilages are set\n\nThen you are good to go ✅🏃‍♂️/🏃‍♀️"
    )
);

navigationScene.action("NEW_GAME", (ctx) => {
    try {
        let player = db.get("players").find({ id: ctx.from.id });
        if (!player.value()) {
            ctx.reply("Just a second...");
            db.get("players")
                .push({
                    id: ctx.from.id,
                })
                .write();
            ctx.reply("We have added you to our userbase. 👏\n\nHave fun! ");
        }

        return ctx.reply(
            `Singleplayer or Multiplayer?`,
            Markup.inlineKeyboard([
                Markup.callbackButton("Singleplayer", "SINGLEPLAYER_GAME"),
                Markup.callbackButton("Multiplayer", "MULTIPLAYER_GAME"),
            ]).extra()
        );
    } catch (ex) {
        console.log("Unexpected error. " + ex);
    }
});

navigationScene.enter((ctx) => {
    try {
        return ctx.reply(
            `Singleplayer or Multiplayer?`,
            Markup.inlineKeyboard([
                Markup.callbackButton("Singleplayer", "SINGLEPLAYER_GAME"),
                Markup.callbackButton("Multiplayer", "MULTIPLAYER_GAME"),
            ]).extra()
        );
    } catch (ex) {
        console.log("Unexpected error. " + ex);
    }
});

navigationScene.on("message", (ctx) =>
    ctx.reply(
        "Try /newgame",
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play now!", "NEW_GAME")]))
    )
);

module.exports = navigationScene;
