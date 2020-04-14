const log = () => (ctx, next) => {
    console.log(ctx);
    return next();
};

module.exports = log;
