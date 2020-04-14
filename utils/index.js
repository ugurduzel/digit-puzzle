const _ = require("lodash");
const { admin_chat_id: chat_id } = require("./configs/constants.json");
const Telegram = require("telegraf/telegram");
const telegram = new Telegram(process.env.BOT_TOKEN || "");

function logMessage(msg) {
    telegram.sendMessage(chat_id, msg);
    console.log(msg);
}

function playerLog(ctx) {
    const msg = ctx.chat.first_name + " is playing. The number is " + ctx.session.game.number.join("");
    if (ctx.chat.user_name === "ugurduzel") {
        console.log(msg);
        return;
    }
    logMessage(chat_id, msg);
}

function getTime(start) {
    const millis = Date.now() - start;
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
    return dayString + hoursString + minutesString + secondsString;
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

module.exports = {
    generateRandomNumber,
    getResult,
    notDistinct,
    playerLog,
    getTime,
};
