const { default: mongoose } = require("mongoose");

const ChatHistory = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    role: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    finished: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model("ChatHistory", ChatHistory)