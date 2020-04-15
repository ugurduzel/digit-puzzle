const LocalSession = require("telegraf-session-local");

const low = require("lowdb");
const FileAsync = require("lowdb/adapters/FileAsync");

const adapter = new FileAsync("myDb.json");
const db = low(adapter);

db.defaults({ sp_step_top10: [], players: [] }).write();

// const gameModel = new LocalSession({
//     database: "gameInformation.json",
//     property: "gameStat",
//     storage: LocalSession.storageFileAsync,
//     format: {
//         serialize: (obj) => JSON.stringify(obj, null, 2),
//         deserialize: (str) => JSON.parse(str),
//     },
//     state: {
//         sp_step_top10: [],
//         sp_time_top10: [],
//         mp_step_wins_top10: [],
//         mp_time_wins_top10: [],
//         mp_total_wins_top10: [],
//         players: {},
//     },
// });

// gameModel.DB.then((DB) => {
//     console.log("Current gameModel:", DB.value());
// });

// const low = require("lowdb");
// const FileSync = require("lowdb/adapters/FileSync");

// const adapter = new FileSync("db.json");
// const db = low(adapter);

module.exports = db;

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
