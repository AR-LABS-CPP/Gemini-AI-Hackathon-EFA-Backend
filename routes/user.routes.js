const { conversateWithAssistant } = require("../services/assistant.service")
const { createNewUser, updateUserIfExists } = require("../services/user.service")

const router = require("express").Router()

router.post("/", createNewUser)

router.post("/:userId/events/:eventId/conversate", conversateWithAssistant)

router.patch("/:userId", updateUserIfExists)

module.exports = router