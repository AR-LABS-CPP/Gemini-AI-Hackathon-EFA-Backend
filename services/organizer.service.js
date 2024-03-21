const { chatWithGeminiModel } = require("./gemini.service")
const EventModel = require("../models/event.model")
const ChatHistoryModel = require("../models/chatHistory.model")
const { transformChatHistory } = require("../utils/history.util")
const eventQuestionModel = require("../models/eventQuestion.model")

const chatForEventWithModel = async (req, res) => {
    try {
        return await chatWithGeminiModel(req, res)
    }
    catch(err) {
        console.error(err)
        return res.sendStatus(500)
    }
}

const getAllEvents = async (_, res) => {
    try {
        const events = await EventModel.find({}).lean()
        return res.status(200).send(events)
    }
    catch(err) {
        console.error(err)
        return res.sendStatus(500)
    }
}

const getSpecificEvent = async (req, res) => {
    try {
        const event = await EventModel.findById(req.params?.eventId).lean()

        if(!event) {
            return res.status(404).send("Event could not be found")
        }

        return res.status(200).send(event)
    }
    catch(err) {
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
    catch(err) {
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
    catch(err) {
        console.error(err)
        return res.sendStatus(500)
    }
}

module.exports = {
    chatForEventWithModel,
    getAllEvents,
    getSpecificEvent,
    getGeneratedQuestionsForEvent,
    getSpecificEventChatHistory
}