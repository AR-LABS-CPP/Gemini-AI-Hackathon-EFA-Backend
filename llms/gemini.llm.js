const { GoogleGenerativeAI } = require("@google/generative-ai")

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_STUDIO_API_KEY)

const geminiModel = genAI.getGenerativeModel({
    model: "gemini-1.0-pro",
})

module.exports = geminiModel