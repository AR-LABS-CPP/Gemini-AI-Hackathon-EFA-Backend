const { default: mongoose } = require("mongoose");

const EventQuestion = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    questions: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model("EventQuestion", EventQuestion)