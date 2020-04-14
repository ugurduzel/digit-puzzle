const { isUnderMaintenance, admin_from_id } = require("../configs/constants.json");
const { logMessage } = require("../utils");

underMaintenance = () => (ctx, next) => {
    if (isUnderMaintenance === true && ctx.from.id !== admin_from_id) {
        logMessage(ctx.chat.first_name + " is trying to play.");
        return ctx.reply("Thank you for your message. 🤗\n\nGame is under maintenance now. But not for long... ⏳");
    }
    return next();
};

module.export = underMaintenance;
