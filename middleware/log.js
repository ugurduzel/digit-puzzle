const log = () => (ctx, next) => {
    console.log(ctx.message);
    return next();
};

module.exports = log;
