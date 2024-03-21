const { createNewUser, updateUserIfExists } = require("../services/user.service")

const router = require("express").Router()

router.post("/", createNewUser)

router.patch("/:userId", updateUserIfExists)

module.exports = router