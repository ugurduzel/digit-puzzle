const telegram = require("telegram-bot-api");

const api = new telegram({
    token: "973273396:AAEbU_Nj4z3pwCM-nnyk0inizNWH2ys5hk4",
    updates: {
        enabled: true,
    },
});

async function sendMessage(chat_id) {
    try {
        const result = await api.sendMessage({
            chat_id: chat_id,
            text: "This is my kind message to you",
        });
        console.log(result);
    } catch (ex) {
        console.log("Error: ex");
    }
}

api.on("message", function (message) {
    // Received text message
    console.log("Hey, message received\n", message);

    sendMessage(message.chat.id);
});
