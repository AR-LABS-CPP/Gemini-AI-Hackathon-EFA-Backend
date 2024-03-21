const mongoose = require("mongoose")

const connectDB = async () => {
    try {
        await mongoose.connect(String(process.env.MONGO_URI))
        console.debug("[Mongo] Connected to mongo")
    }
    catch(err) {
        console.error(err)
        console.error("[Mongo] Failed to connect with mongo")
        process.exit(1)
    }
}

module.exports = connectDB