const { createNewEvent } = require("../services/event.service")
const { chatForEventWithModel, getSpecificEvent, getAllEvents, getGeneratedQuestionsForEvent } = require("../services/organizer.service")

const router = require("express").Router()

router.get("/events", getAllEvents)

router.post("/events/new", createNewEvent)

router.get("/events/:eventId", getSpecificEvent)

router.get("/events/:eventId/questions", getGeneratedQuestionsForEvent)

router.post("/:userId/events/:eventId/conversate", chatForEventWithModel)

module.exports = router