const { default: mongoose } = require("mongoose");

const AnalysisModel = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    answersWithSentiment: {
        type: String
    }
})

module.exports = mongoose.model("Analysis", AnalysisModel)