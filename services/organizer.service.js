const { chatWithGeminiModel } = require("./gemini.service")
const EventModel = require("../models/event.model")
const ChatHistoryModel = require("../models/chatHistory.model")
const { transformChatHistory } = require("../utils/history.util")
const eventQuestionModel = require("../models/eventQuestion.model")
const { default: mongoose } = require("mongoose")
const AnalysisModel = require("../models/analysis.model")
const summaryModel = require("../models/summary.model")

const chatForEventWithModel = async (req, res) => {
    try {
        return await chatWithGeminiModel(req, res)
    }
    catch (err) {
        console.error(err)
        return res.sendStatus(500)
    }
}

const getAllEvents = async (_, res) => {
    try {
        const events = await EventModel.find({}).lean()
        return res.status(200).send(events)
    }
    catch (err) {
        console.error(err)
        return res.sendStatus(500)
    }
}

const getSpecificEvent = async (req, res) => {
    try {
        const event = await EventModel.findById(req.params?.eventId).lean()

        if (!event) {
            return res.status(404).send("Event could not be found")
        }

        return res.status(200).send(event)
    }
    catch (err) {
        console.error(err)
        return res.sendStatus(500)
    }
}

const getGeneratedQuestionsForEvent = async (req, res) => {
    try {
        const eventQuestions = await eventQuestionModel.findOne({
            eventId: req.params?.eventId
        }).lean()

        return res.status(200).send({ questions: eventQuestions })
    }
    catch (err) {
        console.error(err)
        return res.sendStatus(500)
    }
}

const getSpecificEventChatHistory = async (req, res) => {
    try {
        const eventChatHistory = await ChatHistoryModel.find({
            eventId: req.params?.eventId
        })

        const transformedHistory = transformChatHistory(eventChatHistory)

        return res.status(200).send({ history: transformedHistory })
    }
    catch (err) {
        console.error(err)
        return res.sendStatus(500)
    }
}

const getEventSummary = async (req, res) => {
    try {
        const eventSummary = await summaryModel
            .findOne({ eventId: req.params?.eventId })
            .select("summarySoFar")

        const percentagesAndCounts = await AnalysisModel.aggregate([
            {
                $match: {
                    "eventId": new mongoose.Types.ObjectId(req.params?.eventId)
                }
            },
            {
                $project: {
                    answers: {
                        $split: ["$answersWithSentiment", "\n\n"]
                    }
                }
            },
            {
                $unwind: "$answers"
            },
            {
                $project: {
                    parts: {
                        $regexFindAll: {
                            input: "$answers",
                            regex: /QUESTION: (.+)\nANSWER: (.+)\[([A-Z]+)\]/
                        }
                    }
                }
            },
            {
                $project: {
                    sentiment: {
                        $arrayElemAt: ["$parts.captures", 0]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAnswers: { $sum: 1 },
                    totalPositivesCount: {
                        $sum: {
                            $cond: [{ $in: ["POSITIVE", "$sentiment"] }, 1, 0]
                        }
                    },
                    totalNegativesCount: {
                        $sum: {
                            $cond: [{ $in: ["NEGATIVE", "$sentiment"] }, 1, 0]
                        }
                    },
                    totalNeutralCount: {
                        $sum: {
                            $cond: [{ $in: ["NEUTRAL", "$sentiment"] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalAnswers: 1,
                    totalPositivesCount: 1,
                    totalNegativesCount: 1,
                    totalNeutralCount: 1,
                    positivePercentage: {
                        $round: [{ $multiply: [{ $divide: ["$totalPositivesCount", "$totalAnswers"] }, 100] }, 2]
                    },
                    negativePrecentage: {
                        $round: [{ $multiply: [{ $divide: ["$totalNegativesCount", "$totalAnswers"] }, 100] }, 2]
                    },
                    neutralPercentage: {
                        $round: [{ $multiply: [{ $divide: ["$totalNeutralCount", "$totalAnswers"] }, 100] }, 2]
                    }
                }
            }
        ])
        
        return res.status(200).send({
            summarySoFar: eventSummary.summarySoFar,
            stats: percentagesAndCounts[0]
        })
    }
    catch (err) {
        console.error(err)
        return res.sendStatus(500)
    }
}

module.exports = {
    chatForEventWithModel,
    getAllEvents,
    getSpecificEvent,
    getGeneratedQuestionsForEvent,
    getSpecificEventChatHistory,
    getEventSummary
}