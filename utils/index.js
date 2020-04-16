const _ = require("lodash");
const { admin_from_id, admin_chat_id: chat_id } = require("../configs/constants.json");
const Telegram = require("telegraf/telegram");
const telegram = new Telegram(process.env.BOT_TOKEN || "");

const { storage } = require("../cache");

function howMany(ctx) {
    try {
        let mpGame = storage.get(ctx.chat.id);

        if (mpGame.user2) return 2;
        if (mpGame.user1) return 1;
        return 0;
    } catch (ex) {
        console.log("Unexpected error. " + ex);
    }
}

function logMessage(msg) {
    telegram.sendMessage(chat_id, msg);
    console.log(msg);
}

function playerLog(ctx) {
    const msg = ctx.chat.first_name + " is playing. The number is " + ctx.session.number.join("");
    if (ctx.from.id === admin_from_id) {
        console.log(msg);
        return;
    }
    logMessage(msg);
}

function formatTime(start, now) {
    const millis = now - start;
    let seconds = Math.floor(millis / 1000);
    let minutes = 0;
    let hours = 0;
    let days = 0;
    if (seconds >= 60) {
        minutes = Math.floor(seconds / 60);
    }
    seconds -= minutes * 60;

    if (minutes >= 60) {
        hours = Math.floor(minutes / 60);
    }
    minutes -= hours * 60;
    if (hours >= 24) {
        days = Math.floor(hours / 24);
    }
    hours -= days * 24;

    const dayString = `${days !== 0 ? (days === 1 ? "1 day, " : days + " days, ") : ""}`;
    const hoursString = `${hours !== 0 ? (hours === 1 ? "1 hour, " : hours + " hours, ") : ""}`;
    const minutesString = `${minutes !== 0 ? (minutes === 1 ? "1 minute, " : minutes + " minutes, ") : ""}`;
    const secondsString = `${seconds !== 0 ? (seconds === 1 ? "1 second" : seconds + " seconds") : ""}`;
    const formattedTime = dayString + hoursString + minutesString + secondsString;
    return {
        seconds,
        minutes,
        hours,
        days,
        formattedTime,
    };
}

function generateRandomNumber(digits) {
    return _.sampleSize(_.range(1, 10), digits);
}

function getResult(msg, number) {
    let pos = 0;
    let neg = 0;
    const guess = msg.split("").map(eval);
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === number[i]) {
            pos++;
            continue;
        }
        if (number.includes(guess[i])) {
            neg++;
        }
    }

    if (pos === number.length) {
        return { won: true, result: "+${pos}" };
    }
    let s = "";
    if (pos > 0) {
        s += `+${pos}`;
    }
    if (neg > 0) {
        s += ` -${neg}`;
    }
    if (s === "") {
        s = "+0 -0";
    }
    return { won: false, result: s };
}

function notDistinct(_digits) {
    let digits = [..._digits];
    while (digits.length > 0) {
        const d = digits.pop();
        if (digits.includes(d)) {
            return true;
        }
    }
    return false;
}

function extractUsername(ctx) {
    return ctx.from.username || "" + (ctx.from.first_name + " " || "") + (ctx.from.last_name || "") || ctx.from.id;
}

function unexpectedErrorKeyboard(ctx) {
    try {
        return ctx.reply(
            "Unexpected error occured. Please restart.",
            Markup.keyboard(["/start"]).oneTime().resize().extra()
        );
    } catch (ex) {
        console.log("Unexpected error witht the restart keyboard. " + ex);
        return;
    }
}

module.exports = {
    generateRandomNumber,
    getResult,
    notDistinct,
    playerLog,
    logMessage,
    formatTime,
    extractUsername,
    howMany,
    unexpectedErrorKeyboard,
};
