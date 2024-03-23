const { OpenAI } = require("openai")

const openAI = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY
})

module.exports = {
    openAI
}