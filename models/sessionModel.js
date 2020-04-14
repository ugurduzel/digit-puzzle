const LocalSession = require("telegraf-session-local");

module.exports = (function () {
    this.sessionModel = new LocalSession({
        database: "sessions.json",
        property: "session",
        storage: LocalSession.storageFileAsync,
        format: {
            serialize: (obj) => JSON.stringify(obj, null, 2),
            deserialize: (str) => JSON.parse(str),
        },
        state: {},
    });

    this.sessionModel.DB.then((DB) => {
        console.log("Current sessionModel:", DB.value());
    });

    return this;
})();
