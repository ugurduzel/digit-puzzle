const LocalSession = require("telegraf-session-local");
const { gameDatabase } = JSON.parse(require("../configs/dbInfo.json"));

module.exports = (function () {
    this.gameModel = new LocalSession({
        database: gameDatabase,
        property: "game",
        storage: LocalSession.storageFileAsync,
        format: {
            serialize: (obj) => JSON.stringify(obj, null, 2),
            deserialize: (str) => JSON.parse(str),
        },
        state: {
            sp_step_top10: [],
            sp_time_top10: [],
            mp_step_wins_top10: [],
            mp_time_wins_top10: [],
            mp_total_wins_top10: [],
            players: {},
        },
    });

    this.gameModel.DB.then((DB) => {
        console.log("Current gameModel:", DB.value());
    });

    return this;
})();

/**
    sp_step_top10: [ids],
    sp_time_top10: [ids],
    mp_step_wins_top10: [ids],
    mp_time_wins_top10: [ids],
    mp_total_wins_top10: [ids],
    players: {
        id: {
            sp_step: {
                games: {
                    sp_3, sp_4, sp_5, sp_6, 
                },
                scores: {
                    avg_steps_sp3, avg_steps_sp4, avg_steps_sp5, avg_steps_sp6,
                },
            },
            sp_time: {
                games: {
                    sp_3, sp_4, sp_5, sp_6, 
                },
                time: {
                    avg_time_sp3, avg_time_sp4, avg_time_sp5, avg_time_sp6,
                },
            }
            mp {
                step: {
                    games: {
                        mp_3, mp_4, mp_5, mp_6
                    },
                    wins: {
                        w_mp_3, w_mp_4, mp_5, mp_6
                    }
                }
                last_10: [{
                    type, score, opponent?
                }]
            }
        }
    }

 */
