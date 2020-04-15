const Cache = require("node-cache");

module.exports = (function () {
    this.storage = new Cache({ stdTTL: 0, checkperiod: 0, useClones: false, deleteOnExpire: false });

    return this;
})();
