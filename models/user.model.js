const { default: mongoose } = require("mongoose");

const UserModel = new mongoose.Schema({
    username: {
        type: String,
    },
    assistantId: {
        type: String,
    },
    threadId: {
        type: String
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event"
    },
    finalAnswers: {
        type: String
    }
})

module.exports = mongoose.model("User", UserModel)