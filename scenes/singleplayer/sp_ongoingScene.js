const Extra = require("telegraf/extra");
const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");
const db = require("../../models/gameModel");
const { getResult, notDistinct, formatTime } = require("../../utils");

const sp_ongoingScene = new Scene("sp_ongoingScene");

sp_ongoingScene.enter((ctx) => {
    return ctx.reply(`I have a ${ctx.session.number.length} digit number in mind.\n\nStart guessing... 🧐`);
});

sp_ongoingScene.action("FIN_PLAY_AGAIN", (ctx) => {
    deleteSessionFeatures(ctx.session);
    return ctx.scene.enter("navigationScene");
});

sp_ongoingScene.action("Quit", (ctx) => {
    const { number } = ctx.session;
    deleteSessionFeatures(ctx.session);
    return ctx.reply(
        `Quitted\nThe number was `, //${number.join("")}
        Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "FIN_PLAY_AGAIN")]))
    );
});

sp_ongoingScene.action("History", (ctx) => {
    const { history } = ctx.session;

    let s = "Your guesses,\n";
    for (let i = 0; i < history.length; i++) {
        s += "▪️ " + history[i].guess + " ➡️ ";
        s += history[i].result + "\n";
    }
    return ctx.reply(s);
});

sp_ongoingScene.hears(/.*/, (ctx) => {
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
        return ctx.reply(`Cannot send a number with 0 in it!`, Markup.inlineKeyboard([withHistoryKeyboard]).extra());
    }
    if (notDistinct(digits) === true) {
        return ctx.reply(`All digits must be different!`, Markup.inlineKeyboard([withHistoryKeyboard]).extra());
    }

    const { won, result } = getResult(ctx.message.text, ctx.session.number);

    ctx.session.history.push({ guess: ctx.message.text, result });

    if (won) {
        const { number, guesses, start } = ctx.session;

        if (start) {
            const now = Date.now();
            const result = formatTime(start, now);
            //addSpTimeResult(ctx, result);
            ctx.reply(
                `<b>Congrats!</b> 🎊🎉\n\nNumber is <b>${number.join("")}</b>.\nYou found it in ${
                    result.formattedTime
                }. 🤯\n\n${getTimeLeaderboard(ctx.gameStat.sp_time_top10)}`,
                Extra.HTML().markup((m) => m.inlineKeyboard([m.callbackButton("🎮 Play Again", "FIN_PLAY_AGAIN")]))
            );
            deleteSessionFeatures(ctx.session);
            return;
        }
        addSpStepResult(ctx, guesses);

        ctx.reply(
            `<b>Congrats!</b> 🎊🎉\n\nNumber is <b>${number.join(
                ""
            )}</b>.\nYou found it in ${guesses} tries. 🤯\n\n${getStepLeaderboard(db.get("sp3_step_top10").value())}`,
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
});

module.exports = sp_ongoingScene;

function deleteSessionFeatures(session) {
    delete session.number;
    delete session.guesses;
    delete session.start;
}

function addSpTimeResult(ctx, result) {
    // if (!ctx.gameStat.players[ctx.from.id].sp_time) {
    //     ctx.gameStat.players[ctx.from.id].sp_time = {};
    // }
    // const numberOfGames = getTimeGameNumber(ctx);
    // if (numberOfGames) {
    //     setTimeGameNumber(ctx, numberOfGames + 1 || 1);
    // }
    // let avgScore = getAvgTimeScore(ctx);
    // if (!avgScore) {
    //     setAvgTimeScore(ctx, result);
    // } else {
    //     setAvgTimeScore(ctx, calculateTimeAvg(avgScore, numberOfGames + 1 || 1, result));
    // }
    // numberOfGames = getTimeGameNumber(ctx);
    // avgScore = getAvgTimeScore(ctx);
    // handleTop10Time(ctx, numberOfGames, avgScore);
}

function getTimeGameNumber(ctx) {
    const tuple = ctx.gameStat.players[ctx.from.id].sp_time[ctx.session.number.length];
    return tuple ? tuple[0] : undefined;
}

function setTimeGameNumber(ctx, number) {
    if (!ctx.gameStat.players[ctx.from.id].sp_time[ctx.session.number.length]) {
        ctx.gameStat.players[ctx.from.id].sp_time[ctx.session.number.length] = [];
    }
    ctx.gameStat.players[ctx.from.id].sp_time[ctx.session.number.length][0] = number;
}

function getAvgTimeScore(ctx) {
    const tuple = ctx.gameStat.players[ctx.from.id].sp_time[ctx.session.number.length];
    return tuple ? tuple[1] : undefined;
}

function setAvgTimeScore(ctx, result) {
    if (!ctx.gameStat.players[ctx.from.id].sp_time[ctx.session.number.length]) {
        ctx.gameStat.players[ctx.from.id].sp_time[ctx.session.number.length] = [];
    }

    let totalMillis = 0;

    if (result.seconds) totalMillis += result.seconds * 1000;
    if (result.minutes) totalMillis += result.minutes * 60 * 1000;
    if (result.hours) totalMillis += result.hours * 60 * 60 * 1000;
    if (result.days) totalMillis += result.days * 24 * 60 * 60 * 1000;

    ctx.gameStat.players[ctx.from.id].sp_time[ctx.session.number.length][1] = totalMillis;
}

function calculateTimeAvg(avgScore, numberOfGames, result) {
    let totalMillis = avgScore;

    if (result.seconds) totalMillis += result.seconds * 1000;
    if (result.minutes) totalMillis += result.minutes * 60 * 1000;
    if (result.hours) totalMillis += result.hours * 60 * 60 * 1000;
    if (result.days) totalMillis += result.days * 24 * 60 * 60 * 1000;

    totalMillis /= numberOfGames + 1;
    totalMillis = Math.floor(totalMillis);

    return totalMillis;
}

//
//
function addSpStepResult(ctx, step) {
    // if (!ctx.gameStat.players[ctx.from.id].sp_step) {
    //     ctx.gameStat.players[ctx.from.id].sp_step = {};
    // }
    // let numberOfGames = getStepGameNumber(ctx);
    // setStepGameNumber(ctx, numberOfGames + 1 || 1);
    // let avgScore = getAvgStepScore(ctx);
    // if (!avgScore) {
    //     setAvgStepScore(ctx, step);
    // } else {
    //     setAvgStepScore(ctx, calculateStepAvg(avgScore, numberOfGames, step));
    // }
    // console.log("Player: ", ctx.gameStat.players[ctx.from.id]);
    // handleTop10Step(ctx, getStepGameNumber(ctx), getAvgStepScore(ctx));
    // console.log("Leaderboard:", ctx.gameStatDB.get("sp_step_top10"));
    let result = db.get("players").find({ id: ctx.from.id });
    console.log(result.value());
    if (!result.value()) return null;

    let { count, avgScore } = result.value();
    if (!count && !avgScore) {
        db.get("players").find({ id: ctx.from.id }).assign({ "3_count": 1, "3_avg": step }).write();
        return;
    }
    const newAvg = (avgScore * count + step) / (count + 1);
    const newCount = count + 1;
    db.get("players").find({ id: ctx.from.id }).assign({ "3_count": newCount, "3_avg": newAvg }).write();
    console.log("db.get: ", db.get("players").value());
    handleTop10Step(ctx, newCount, newAvg);
}

function calculateStepAvg(avgScore, numberOfGames, step) {
    return (avgScore * numberOfGames + step) / (numberOfGames + 1);
}

function handleTop10Time(ctx, numberOfGames, avgScore) {
    if (!ctx.gameStat.sp_time_top10) {
        ctx.gameStat.sp_time_top10 = [];
    }
    if (ctx.gameStat.sp_time_top10.length < 10) {
        ctx.gameStat.sp_time_top10.push({
            avgScore,
            numberOfGames,
            username: (ctx.chat.first_name || "") + (ctx.chat.last_name || ""),
        });
        ctx.gameStat.sp_time_top10.sort((e1, e2) => (e1.avgScore < e2.avgScore ? -1 : 1));
        return;
    }
    if (ctx.gameStat.sp_time_top10[9] > avgScore) {
        ctx.gameStat.sp_time_top10[9] = {
            avgScore,
            numberOfGames,
            username: (ctx.chat.first_name || "") + (ctx.chat.last_name || ""),
        };
        ctx.gameStat.sp_time_top10.sort((e1, e2) => (e1.avgScore < e2.avgScore ? -1 : 1));
    }
}

function handleTop10Step(ctx, numberOfGames, avgScore) {
    // if (!ctx.gameStat.sp_step_top10) {
    //     ctx.gameStat.sp_step_top10 = [];
    // }
    // let player = ctx.gameStat.sp_step_top10.find(
    //     (e) => e.username === (ctx.chat.first_name || "") + (ctx.chat.last_name || "") + ""
    // );
    // if (player) {
    //     player.avgScore = avgScore;
    //     player.numberOfGames = numberOfGames;
    //     return;
    // }

    // if (ctx.gameStat.sp_step_top10.length < 10) {
    //     ctx.gameStat.sp_step_top10.push({
    //         avgScore,
    //         numberOfGames,
    //         username: (ctx.chat.first_name || "") + (ctx.chat.last_name || "") + "",
    //     });
    //     ctx.gameStat.sp_step_top10.sort((e1, e2) => (e1.avgScore < e2.avgScore ? -1 : 1));
    //     return;
    // }
    // if (ctx.gameStat.sp_step_top10[9] > avgScore) {
    //     ctx.gameStat.sp_step_top10[9] = {
    //         avgScore,
    //         numberOfGames,
    //         username: (ctx.chat.first_name || "") + (ctx.chat.last_name || "") + "",
    //     };
    //     ctx.gameStat.sp_step_top10.sort((e1, e2) => (e1.avgScore < e2.avgScore ? -1 : 1));
    // }
    const username = (ctx.chat.first_name || "") + (ctx.chat.last_name || "") + "";
    let top10 = db.get("sp3_step_top10");
    let found = top10.find({ username });
    if (found.value()) {
        found.assign({ avgScore, numberOfGames }).write();
    }
    if (top10.value() && top10.value().length < 10) {
        db.get("sp3_step_top10")
            .push({
                avgScore,
                numberOfGames,
                username,
            })
            .write();
    }
}

function getTimeLeaderboard(lst) {
    return "Time leaderboard is under construction.";
}

function getStepLeaderboard(lst) {
    let s = "<b>Singleplayer Step Leaderboard</b>\n\n";
    let max = -1;
    for (let i = 0; i < lst.length; i++) {
        const item = lst[i];
        max = item.username.length > max ? item.username.length : max;
    }
    if (max < 4) {
        max = 4;
    }
    let temp_s = "";
    temp_s += "Name  ";
    temp_s += " ".repeat(max - 4);
    temp_s += "  | ";
    const avg_len = temp_s.length - 5;
    temp_s += "Avg Steps | ";
    const total_len = temp_s.length - 1;
    temp_s += "Total Games\n";
    s += temp_s;

    for (let i = 0; i < lst.length; i++) {
        const item = lst[i];
        s += item.username;
        s += " ".repeat(avg_len - item.username.length) + "| ";
        s += item.avgScore;
        s += " ".repeat(total_len - item.username.length) + "| ";
        s += item.numberOfGames + "\n";
    }

    return s;
}
