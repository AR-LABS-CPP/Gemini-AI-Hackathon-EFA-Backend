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
    },
    questionCount: {
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model("EventQuestion", EventQuestion)