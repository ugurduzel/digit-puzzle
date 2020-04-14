const LocalSession = require("telegraf-session-local");
const { sessionDatabase } = JSON.parse(require("../configs/dbInfo.json"));

module.exports = (function () {
    this.sessionModel = new LocalSession({
        database: sessionDatabase,
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
