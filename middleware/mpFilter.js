const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");

const { storage: mpGame } = require("../cache");

const
const mpFilter = () => (ctx, next) => {
    if (ctx.chat.type === "group") {

        if(mpGame.has(ctx.chat.id)) {
            mpGame = mpGame.get(ctx.chat.id);
            if(ctx.message.id === mpGame.user1.id || ctx.message.id === mpGame.user2.id) {
                if(mpGame.get("turn") && ctx.message.id === mpGame.get("turn")) {
                    return next();
                }
                return ctx.reply("It's not your turn.", Extra.HTML().inReplyTo(ctx.message.message_id));
            }
            else {
                return;
            }
        }
    }
    return next();
};

module.exports = mpFilter;
