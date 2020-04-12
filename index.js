const Telegraf = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply("Welcome to Digit Puzzle!"));

bot.command("newgame", ({ ctx }) => {
    console.log(ctx);
    ctx.reply("Choose a difficulty level\n3 digits\n4 digits\n5 digits");
});

bot.launch();
