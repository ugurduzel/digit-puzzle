const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");

let { storage } = require("../cache");

const mpFilter = () => (ctx, next) => {
    if (ctx.chat.type !== "supergroup") {
        return next();
    }

    const mpGame = storage.get(ctx.chat.id);
    if (storage.has(ctx.chat.id) && mpGame.user1 && mpGame.user2) {
        if (ctx.from.id === mpGame.user1 && storage.get(ctx.chat.id).turn === ctx.from.id) {
            return next();
        }
        return ctx.reply("It's not your turn.", Extra.HTML().inReplyTo(ctx.message.message_id));
    }

    return next();
};

module.exports = mpFilter;
