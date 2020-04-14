const { isUnderMaintenance, admin_from_id } = require("../configs/constants.json");
const { logMessage } = require("../utils");

const underMaintenance = () => (ctx, next) => {
    console.log(ctx);
    if (isUnderMaintenance === true && ctx.from.id !== admin_from_id) {
        logMessage(ctx.chat.first_name + " is trying to play.");
        return ctx.reply(
            "Thank you for your message. 🤗\n\nGame is under maintenance now.\nBut not for long... ⏳\n\nCheck back again later."
        );
    }
    return next();
};

module.exports = underMaintenance;
