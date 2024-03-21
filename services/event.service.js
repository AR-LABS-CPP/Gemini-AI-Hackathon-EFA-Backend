const EventModel = require("../models/event.model")

const createNewEvent = async (req, res) => {
    try {
        const newEvent = await EventModel.create({
            eventName: req.body?.eventName,
            eventDescription: req.body?.eventDescription,
            formGoal: req.body?.formGoal
        })

        return res.status(201).send({ eventId: newEvent._id })
    }
    catch(err) {
        console.error(err)
        return res.sendStatus(500)
    }
}

module.exports = {
    createNewEvent
}