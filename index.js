var telegram = require("telegram-bot-api");

var api = new telegram({
    token: "973273396:AAEbU_Nj4z3pwCM-nnyk0inizNWH2ys5hk4",
    updates: {
        enabled: true,
    },
});

api.on("message", function (message) {
    // Received text message
    console.log(message);

    api.sendMessage({
        chat_id: message.chat_id,
        text: message,
    })
        .then(function (data) {
            console.log(util.inspect(data, false, null));
        })
        .catch(function (err) {
            console.log(err);
        });
});
