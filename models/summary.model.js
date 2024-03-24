const { default: mongoose } = require("mongoose");

const SummaryModel = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event"
    },
    previousSummary: {
        type: String
    },
    summarySoFar: {
        type: String
    }
})

module.exports = mongoose.model("Summary", SummaryModel)