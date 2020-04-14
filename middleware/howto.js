const message =
    "I am Digit Puzzle Bot. I have a number in mind. You will try to guess what it is. Smarter you guess faster you will find. 🤓\n\n \
    \
    <b>Rules:</b>\n \
    The number you are trying to find has distinct digits.\n \
    They can be in the range [1...9].\n\n \
    \
    For <b>a digit</b> in your guess\n \
    +1 -> A digit is correctly placed\n \
    -1 -> A digit is in the number but placed incorrectly\n \
     0 -> Not in the number \n\n \
    \
    Example:\n \
    The number: 1234\n \
    <b>Your guess: 1438</b>\n\n \
    \
      1    2    3   4  ➡️  The number\n \
      1    4    3   8  ➡️  Your guess\n \
    (+1) (-1) (+1) (0) ➡️  +2 -1\n \
    So we return +2 -1 for your guess but you will not know which one is for what.\n\n \
    You need to make intelligent guesses. That is the fun part. 😁";
const howto = () => (ctx, next) => {
    console.log(ctx.message);
    if (ctx.state.command && ctx.state.command.command === "howto") {
        return ctx.reply(message);
    }
};

module.exports = howto;
