const { getUserChat } = require("../services/assistant.service")
const { createNewEvent } = require("../services/event.service")
const {
    chatForEventWithModel,
    getSpecificEvent,
    getAllEvents,
    getGeneratedQuestionsForEvent,
    getEventSummary
} = require("../services/organizer.service")

const router = require("express").Router()

router.get("/events", getAllEvents)

router.post("/events/new", createNewEvent)

router.get("/events/:eventId", getSpecificEvent)

router.get("/events/:eventId/questions", getGeneratedQuestionsForEvent)

router.post("/:userId/events/:eventId/conversate", chatForEventWithModel)

router.get("/:userId/events/:eventId/chat", getUserChat)

router.get("/:userId/events/:eventId/summary", getEventSummary)

module.exports = router