const LocalSession = require("telegraf-session-local");

const sessionModel = new LocalSession({
    database: "sessions.json",
    property: "session",
    storage: LocalSession.storageFileAsync,
    format: {
        serialize: (obj) => JSON.stringify(obj, null, 2),
        deserialize: (str) => JSON.parse(str),
    },
    state: {
        number: null,
        guesses: null,
        history: [],
    },
});

sessionModel.DB.then((DB) => {
    console.log("Current sessionModel:", DB.value());
});

module.exports = sessionModel;
