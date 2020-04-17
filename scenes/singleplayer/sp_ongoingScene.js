const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");
const db = require("../../models/gameModel");
const { getResult, unexpectedErrorKeyboard, notDistinct, formatTime } = require("../../utils");
const _ = require("lodash");
const sp_ongoingScene = new Scene("sp_ongoingScene");

sp_ongoingScene.enter((ctx) => {
    try {
        return ctx.reply(`I have a ${ctx.session.number.length} digit number in mind.\n\nStart guessing... 🧐`);
    } catch (ex) {
        console.log("Unexpected error. " + ex);
        unexpectedErrorKeyboard(ctx);
    }
});

sp_ongoingScene.action("FIN_PLAY_AGAIN", (ctx) => {
    try {
        deleteSessionFeatures(ctx.session);
        return ctx.scene.enter("navigationScene");
    } catch (ex) {
        console.log("Unexpected error. " + ex);
        unexpectedErrorKeyboard(ctx);
    }
});

sp_ongoingScene.action("Quit", (ctx) => {
    try {
        const { number } = ctx.session;
        deleteSessionFeatures(ctx.session);
        return ctx.reply(
            `Quitted\nThe number was ${number.join("")}`,
            Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "FIN_PLAY_AGAIN")]))
        );
    } catch (ex) {
        console.log("Unexpected error. " + ex);
        unexpectedErrorKeyboard(ctx);
    }
});

sp_ongoingScene.action("History", (ctx) => {
    try {
        const { history } = ctx.session;

        let s = "Your guesses,\n";
        for (let i = 0; i < history.length; i++) {
            s += "▪️ " + history[i].guess + " ➡️ ";
            s += history[i].result + "\n";
        }
        return ctx.reply(s);
    } catch (ex) {
        console.log("Unexpected error. " + ex);
        unexpectedErrorKeyboard(ctx);
    }
});

sp_ongoingScene.hears(/.*/, (ctx) => {
    try {
        if (!ctx.session) {
            return null;
        }
        if (isNaN(ctx.message.text)) {
            return ctx.reply(
                `Only send numbers!`,
                Extra.HTML().markup((m) =>
                    m.inlineKeyboard([m.callbackButton("Get History", "History"), m.callbackButton("Quit", "Quit")])
                )
            );
        }
        let withHistoryKeyboard = [];
        if (ctx.session.history && ctx.session.history.length > 0) {
            withHistoryKeyboard.push(Markup.callbackButton("Get History", "History"));
        }
        withHistoryKeyboard.push(Markup.callbackButton("Quit", "Quit"));

        if (isNaN(ctx.message.text) || ctx.message.text.length !== ctx.session.number.length) {
            return ctx.reply(
                `Only send ${ctx.session.number.length} digit numbers!`,
                Markup.inlineKeyboard([withHistoryKeyboard]).extra()
            );
        }
        const digits = ctx.message.text.split("");
        if (digits.includes("0")) {
            return ctx.reply(
                `Cannot send a number with 0 in it!`,
                Markup.inlineKeyboard([withHistoryKeyboard]).extra()
            );
        }
        if (notDistinct(digits) === true) {
            return ctx.reply(`All digits must be different!`, Markup.inlineKeyboard([withHistoryKeyboard]).extra());
        }

        const { won, result } = getResult(ctx.message.text, ctx.session.number);

        ctx.session.history.push({ guess: ctx.message.text, result });

        if (won) {
            const { number, guesses } = ctx.session;

            addSpStepResult(ctx, guesses, number.length);

            ctx.reply(
                `<b>Congrats!</b> 🎊🎉\n\nNumber is <b>${number.join(
                    ""
                )}</b>.\nYou found it in ${guesses} tries. 🤯\n\n${getStepLeaderboard(
                    db.get(`sp${number.length}_step_top10`).value(),
                    number.length
                )}`,
                Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "FIN_PLAY_AGAIN")]))
            );
            deleteSessionFeatures(ctx.session);
            return;
        }
        ctx.session.guesses += 1;
        return ctx.reply(
            result,
            Extra.HTML()
                .inReplyTo(ctx.message.message_id)
                .markup((m) =>
                    m.inlineKeyboard([m.callbackButton("Get History", "History"), m.callbackButton("Quit", "Quit")])
                )
        );
    } catch (ex) {
        console.log("Unexpected error. " + ex);
        unexpectedErrorKeyboard(ctx);
    }
});

module.exports = sp_ongoingScene;

function deleteSessionFeatures(session) {
    delete session.number;
    delete session.guesses;
}

function addSpStepResult(ctx, step, level) {
    let result = db.get("players").find({ id: ctx.from.id });
    if (!result.value()) return null;

    const count = result.value()[`${level}_count`];
    const avgScore = result.value()[`${level}_avg`];

    if (!count && !avgScore) {
        db.get(`players`)
            .find({ id: ctx.from.id })
            .assign({ [`${level}_count`]: 1, [`${level}_avg`]: step })
            .write();
        handleTop10Step(ctx, 1, step, level);
        return;
    }
    const newAvg = (avgScore * count + step) / (count + 1);
    const newCount = count + 1;
    db.get(`players`)
        .find({ id: ctx.from.id })
        .assign({ [`${level}_count`]: newCount, [`${level}_avg`]: newAvg })
        .write();
    handleTop10Step(ctx, newCount, newAvg, level);
}

function handleTop10Step(ctx, numberOfGames, avgScore, level) {
    const username = (ctx.chat.first_name || "") + (ctx.chat.last_name || "") + "";
    let top10 = db.get(`sp${level}_step_top10`);
    let arr = [...top10.value()];
    let found = arr.find((e) => e.username === username);

    if (found) {
        found[`${level}_count`] = numberOfGames;
        found[`${level}_avg`] = avgScore;

        arr.sort((e1, e2) => (e1[[`${level}_avg`]] < e2[[`${level}_avg`]] ? -1 : 1));

        db.set(`sp${level}_step_top10`, arr).write();
        return;
    }

    if (arr && arr.length < 10) {
        arr.push({
            [`${level}_count`]: numberOfGames,
            [`${level}_avg`]: avgScore,
            username,
        });
        arr.sort((e1, e2) => (e1[[`${level}_avg`]] < e2[[`${level}_avg`]] ? -1 : 1));

        db.set(`sp${level}_step_top10`, arr).write();
        return;
    }
    if (arr && arr[9][[`${level}_avg`]] > avgScore) {
        arr[9] = {
            [`${level}_count`]: numberOfGames,
            [`${level}_avg`]: avgScore,
            username,
        };
        arr.sort((e1, e2) => (e1[[`${level}_avg`]] < e2[[`${level}_avg`]] ? -1 : 1));

        db.set(`sp${level}_step_top10`, arr).write();
        return;
    }
}

function getStepLeaderboard(lst, level) {
    let returnString = "<b>Singleplayer Step Leaderboard</b>\n\n";

    // let max = -1;
    // for (let i = 0; i < lst.length; i++) {
    //     const item = lst[i];
    //     max = item.username.length > max ? item.username.length : max;
    // }
    // if (max < 4) {
    //     max = 4;
    // }

    // let headString = "";
    // headString += "Name";
    // headString += " ".repeat(max - 4);
    // headString += " | ";
    // const ref_A = headString.length;
    // headString += "Avg Steps | ";
    // const ref_T = headString.length;
    // headString += "Total Games\n";

    //returnString += headString;

    for (let i = 0; i < lst.length; i++) {
        const item = lst[i];

        let line = `${i + 1}. ` + item.username + "\n";

        line += "  " + _.take(item[[`${level}_avg`]].toString(), 4).join("") + " average guess - ";

        line += item[`${level}_count`] + " total games\n";

        returnString += line;
    }

    return returnString;
}
