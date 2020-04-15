const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");

const mpFilter = () => (ctx, next) => {
    if (ctx.chat.type !== "group" && ctx.session && ctx.session.user && ctx.session.users.length === 2) {
        if (ctx.message.id === ctx.session.users[0].id || ctx.message.id === ctx.session.users[1].id) {
            if (ctx.session.turn && ctx.message.id === ctx.session.turn) {
                return next();
            }
            return ctx.reply("It's not your turn.", Extra.HTML().inReplyTo(ctx.message.message_id));
        }
        return;
    }
    return next();
};

module.exports = mpFilter;
