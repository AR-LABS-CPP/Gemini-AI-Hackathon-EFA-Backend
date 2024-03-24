const geminiModel = require("../llms/gemini.llm")
const ChatHistoryModel = require("../models/chatHistory.model")
const EventModel = require("../models/event.model")
const EventQuestionModel = require("../models/eventQuestion.model")
const UserModel = require("../models/user.model")
const { transformChatHistory } = require("../utils/history.util")

const generateResponse = async (history, promptText) => {
    try {
        const chat = geminiModel.startChat({
            history,
            generationConfig: {
                maxOutputTokens: 256
            }
        })

        const result = await chat.sendMessage(promptText)
        const response = await result.response
        
        return response.text()
    }
    catch (err) {
        console.debug(err)
        return "Failed to generate response, please try again"
    }
}

const saveChatHistory = async (
    eventId,
    userId,
    userPrompt,
    modelResponse
) => {
    try {
        const chatFinished = userPrompt == "FINISH"

        if (chatFinished) {
            /*
                Conversation has finished, store questions
                in the event question model and call it a day. No
                time for optimizations
            */
            const questions = await ChatHistoryModel.find({
                eventId
            }).sort({ _id: -1 }).limit(1)

            await EventQuestionModel.create({
                eventId,
                questions: questions[0].text,
                questionCount: questions[0]?.text?.split("\n")?.length
            })
        }

        await ChatHistoryModel.insertMany([
            {
                eventId,
                userId,
                role: "user",
                text: userPrompt,
                finished: chatFinished
            },
            {
                eventId,
                userId,
                role: "model",
                text: modelResponse,
                finished: chatFinished
            }
        ])
    }
    catch (err) {
        console.error(err)
        throw new Error("Error occurred while saving history")
    }
}

/*
    Not the most optimized way but will work for our usecase
*/
const chatWithGeminiModel = async (req, res) => {
    try {
        const user = await UserModel.findById(req.params?.userId)

        if (!user) {
            return res.status(404).send("User does not exist, please create one and then conversate")
        }

        const chatHistory = await ChatHistoryModel
            .find({
                userId: req.params?.userId,
                eventId: req.params?.eventId
            })
            .select("-_id")

        if (!chatHistory || chatHistory.length === 0) {
            const event = await EventModel
                .findById(req.params?.eventId)

            const promptText = "Given " + event?.eventName + " as event name and " + event.eventDescription + " as event description" +
                " and " + event.formGoal + " as goal for the feedback form. Given these things you have to" +
                " generate a set of questions (atleast 7) that will be asked from the event attendees. Make sure that each generated question includes" +
                " the event name. The user can ask you to add, remove and/or modify questions. Your responses should include the previous generated questions" +
                " (if there are any) + the newly generated questions and nothing else like affirmations or acknowledgement. I am repeating," +
                " please include previous generated questions if there are any and donot skip them. If the user says \"FINISH\". Please reply" +
                " with \"FINISH\" as well, which marks the end of the conversation so do not respond to any future questions and just" +
                " say \"Thank you, the conversation has ended\"" +

                "Answer in the format: Question-NUMBER: QUESTION_TEXT" +
                "Where NUMBER is the number you have generated for that question e.g. 1, 2, 3" +
                "and QUESTION_TEXT is the actual generated question"

            const modelResponse = await generateResponse([], promptText)

            if(modelResponse != "Failed to generate response, please try again") {
                await saveChatHistory(
                    req.params?.eventId,
                    req.params?.userId,
                    promptText,
                    modelResponse
                )
            }

            return res.status(200).send({ response: modelResponse })
        }

        const transformedChatHistory = transformChatHistory(chatHistory)
        const modelResponse = await generateResponse(transformedChatHistory, req.body?.prompt)

        if(modelResponse != "Failed to generate response, please try again") {
            await saveChatHistory(
                req.params?.eventId,
                req.params?.userId,
                req.body?.prompt,
                modelResponse
            )
        }

        return res.status(200).send({ response: modelResponse })
    }
    catch (err) {
        console.error(err)
        return res.sendStatus(500)
    }
}

module.exports = {
    chatWithGeminiModel,
    generateResponse
}