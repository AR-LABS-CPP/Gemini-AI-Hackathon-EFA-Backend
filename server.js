require("dotenv").config()

const connectDB = require("./config/mongo.config")
const express = require("express")
const morgan = require("morgan")
const app = express()

const PORT = process.env.PORT || 3040

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan("short"))

const userRouter = require("./routes/user.routes")
const organizerRouter = require("./routes/organizer.routes")

app.use("/users", userRouter)
app.use("/organizers", organizerRouter)

connectDB().then(() => {
    app.listen(PORT, () => {
        console.debug(`[server]: listening on port: ${PORT}`)
    })
})