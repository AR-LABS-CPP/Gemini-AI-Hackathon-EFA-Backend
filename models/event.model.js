const { default: mongoose } = require("mongoose");

const EventModel = new mongoose.Schema({
    eventName: {
        type: String,
        required: true
    },
    eventDescription: {
        type: String,
        required: true
    },
    formGoal: {
        type: String,
        required: true
    },
    assistantId: {
        type: String
    }
})

module.exports = mongoose.model("Event", EventModel)