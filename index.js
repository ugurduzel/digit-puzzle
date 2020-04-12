const Telegraf = require("telegraf");
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply("Welcome to Digit Puzzle!"));

bot.command("newgame", (ctx) => {
    console.log(ctx);
    ctx.reply("Choose a difficulty level\n3 digits\n4 digits\n5 digits");
});

bot.hears("onetime", ({ reply }) =>
    reply(
        "One time keyboard",
        Markup.keyboard(["/simple", "/inline", "/pyramid"])
            .oneTime()
            .resize()
            .extra()
    )
);

bot.hears("custom", ({ reply }) => {
    return reply(
        "Custom buttons keyboard",
        Markup.keyboard([
            ["🔍 Search", "😎 Popular"], // Row1 with 2 buttons
            ["☸ Setting", "📞 Feedback"], // Row2 with 2 buttons
            ["📢 Ads", "⭐️ Rate us", "👥 Share"], // Row3 with 3 buttons
        ])
            .oneTime()
            .resize()
            .extra()
    );
});

bot.hears("special", (ctx) => {
    return ctx.reply(
        "Special buttons keyboard",
        Extra.markup((markup) => {
            return markup
                .resize()
                .keyboard([
                    markup.contactRequestButton("Send contact"),
                    markup.locationRequestButton("Send location"),
                ]);
        })
    );
});

bot.hears("pyramid", (ctx) => {
    return ctx.reply(
        "Keyboard wrap",
        Extra.markup(
            Markup.keyboard(["one", "two", "three", "four", "five", "six"], {
                wrap: (btn, index, currentRow) =>
                    currentRow.length >= (index + 1) / 2,
            })
        )
    );
});

bot.hears("simple", (ctx) => {
    return ctx.replyWithHTML(
        "<b>Coke</b> or <i>Pepsi?</i>",
        Extra.markup(Markup.keyboard(["Coke", "Pepsi"]))
    );
});

bot.hears("inline", (ctx) => {
    return ctx.reply(
        "<b>Coke</b> or <i>Pepsi?</i>",
        Extra.HTML().markup((m) =>
            m.inlineKeyboard([
                m.callbackButton("Coke", "Coke"),
                m.callbackButton("Pepsi", "Pepsi"),
            ])
        )
    );
});

bot.hears("random", (ctx) => {
    return ctx.reply(
        "random example",
        Markup.inlineKeyboard([
            Markup.callbackButton("Coke", "Coke"),
            Markup.callbackButton(
                "Dr Pepper",
                "Dr Pepper",
                Math.random() > 0.5
            ),
            Markup.callbackButton("Pepsi", "Pepsi"),
        ]).extra()
    );
});

bot.hears("hi", (ctx) => {
    return ctx.reply(
        "Keyboard wrap",
        Extra.markup(
            Markup.keyboard(["one", "two", "three", "four", "five", "six"], {
                columns: parseInt(ctx.match[1]),
            })
        )
    );
});

bot.action("Dr Pepper", (ctx, next) => {
    return ctx.reply("👍").then(() => next());
});

bot.action("plain", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageCaption(
        "Caption",
        Markup.inlineKeyboard([
            Markup.callbackButton("Plain", "plain"),
            Markup.callbackButton("Italic", "italic"),
        ])
    );
});

bot.action("italic", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageCaption(
        "_Caption_",
        Extra.markdown().markup(
            Markup.inlineKeyboard([
                Markup.callbackButton("Plain", "plain"),
                Markup.callbackButton("* Italic *", "italic"),
            ])
        )
    );
});

bot.action(/.+/, (ctx) => {
    return ctx.answerCbQuery(`Oh, ${ctx.match[0]}! Great choice`);
});

bot.launch();
