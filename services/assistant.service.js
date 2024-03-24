const EventModel = require("../models/event.model")
const { openAI } = require("../llms/openai.llm")
const UserModel = require("../models/user.model")
const EventQuestionModel = require("../models/eventQuestion.model")
const { writeFile, deleteFile } = require("../utils/file.util")
const fs = require("fs")
const geminiModel = require("../llms/gemini.llm")
const chatHistoryModel = require("../models/chatHistory.model")
const analysisModel = require("../models/analysis.model")
const { generateResponse } = require("./gemini.service")
const { generateNewSummary } = require("./summary.service")
const SummaryModel = require("../models/summary.model")

const _createNewThreadForUser = async (user) => {
    try {
        if(user.threadId) {
            throw new Error("Thread is already present for this user")
        }

        const newThread = await openAI.beta.threads.create()
        
        return newThread.id
    }
    catch(err) {
        console.error(err)
        throw new Error("Error occurred while creating thread for the user")
    }
}

const _createNewAssistantForEvent = async (
    event,
    assistantName,
    assistantInstructions,
) => {
    try {
        if(event.assistantId) {
            throw new Error("Event assistant is already present")
        }

        const newAssistant = await openAI.beta.assistants.create({
            name: assistantName,
            instructions: assistantInstructions,
            model: process.env.OPEN_AI_GPT_MODEL || "gpt-3.5-turbo-0125"
        })

        return newAssistant.id
    }
    catch(err) {
        console.error(err)
        throw new Error("Error occurred while creating assistant for the event")
    }
}

const _bindQuestionsWithAssistant = async (eventId, assistantId, eventQuestions) => {
    try {
        // Temporarily writing the file, will be deleted once the binding is done
        await writeFile(`files/${eventId}_data.json`, eventQuestions)

        const eventQuestionsFile = await openAI.files.create({
            file: fs.createReadStream(`files/${eventId}_data.json`),
            purpose: "assistants"
        })

        await openAI.beta.assistants.update(
            assistantId,
            {
                file_ids: [eventQuestionsFile.id],
                tools: [{ type: "retrieval" }]
            }
        )

        deleteFile(`files/${eventId}_data.json`)

        return "Questions are now bound with the assistant"
    }
    catch(err) {
        console.error(err)
        throw new Error("Error occurred while binding questions with assistant")
    }
}

const _addMessageInThreadAndRun = async (user, event, promptText, threadId, assistantId) => {
    try {
        await openAI.beta.threads.messages.create(
            threadId,
            {
                role: "user",
                content: promptText
            }
        )

        const messageRun = await openAI.beta.threads.runs.create(
            threadId,
            {
                assistant_id: assistantId
            }
        )

        let threadRun = await openAI.beta.threads.runs.retrieve(
            threadId,
            messageRun.id
        )

        while(["queued", "in_progress", "cancelling"].includes(threadRun.status)) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            threadRun = await openAI.beta.threads.runs.retrieve(
                threadRun.thread_id,
                messageRun.id
            )
        }

        const messages = await openAI.beta.threads.messages.list(
            threadId
        )

        const assistantResponse = messages.data
            .filter(
                (msg) => msg.run_id === threadRun.id && msg.role === "assistant"
            )
            .pop()

        // Not good lol but we need to store the answers somehow
        if(assistantResponse?.content[0]?.text?.value?.includes("Thank you very much for the feedback")) {
            const answers = assistantResponse?.content[0]?.text?.value?.split("Thank you very much for the feedback")[1]

            const response = await generateResponse(
                [],
                "Given these " + answers + " as questions and their answers." +
                " Can you perform sentiment analysis of each answer and append " +
                " the sentiment after each answer as [SENTIMENT] where sentiment " +
                " can be POSITIVE, NEGATIVE or NEUTRAL. Please donot include " +
                " any affirmations or acknowledgement and return the response in this " +
                " format: QUESTION: question-text\nANSWER: answer-text [SENTIMENT]\n\n"
            )

            // Store the answers and their sentiment in the database
            await analysisModel.create({
                eventId: event._id,
                userId: user._id,
                answersWithSentiment: response
            })

            const eventSummary = await SummaryModel.findOne({
                eventId: event._id
            })

            const generatedSummary = await generateNewSummary(
                event.eventName,
                eventSummary?.summarySoFar,
                response
            )

            eventSummary.previousSummary = eventSummary.summarySoFar ?? eventSummary.previousSummary
            eventSummary.summarySoFar = generatedSummary ?? eventSummary.summarySoFar

            user.finalAnswers = answers

            await user.save()
            await eventSummary.save()
        }

        return assistantResponse?.content[0]?.text?.value ?? "Failed to generate response, please try again"
    }
    catch(err) {
        console.error(err)
        throw new Error("Error occurred while generating response, please try again")
    }
}

const _conversationHelper = async (user, event, assistantId, promptText) => {
    try {
        if(!user.threadId) {
            const newThreadId = await _createNewThreadForUser(user)

            user.threadId = newThreadId
            await user.save()

            const assistantResponse = await _addMessageInThreadAndRun(
                user,
                event,
                promptText,
                user.threadId,
                assistantId
            )

            return assistantResponse
        }

        const assistantResponse = await _addMessageInThreadAndRun(
            user,
            event,
            promptText,
            user.threadId,
            assistantId
        )

        return assistantResponse
    }
    catch(err) {
        console.error(err)
        return res.sendStatus(500)
    }
}

const getUserChat = async (req, res) => {
    try {
        const userChat = await chatHistoryModel
            .find({
                eventId: req.params?.eventId,
                userId: req.params?.userId
            })
            .skip(1)
            .select("-_id -__v -userId -eventId")
            .lean()

        return res.status(200).send({
            chatHistory: userChat
        })
    }
    catch(err) {
        console.error(err)
        return res.sendStatus(500)
    }
}

const conversateWithAssistant = async (req, res) => {
    try {
        const [user, event] = await Promise.all([
            UserModel.findById(req.params?.userId),
            EventModel.findById(req.params?.eventId)
        ])

        if(!user) {
            return res.status(404).send("User could not be found")
        }

        if(!event) {
            return res.status(404).send("Event could not be found")
        }

        /*
            When a new user starts conversation, initally there
            won't be any assistant present so we will create one
            and bind it. Additionally, we will check if the user
            has a thread, if not then we will create one for them
        */
        if(!event.assistantId) {
            const eventQuestions = await EventQuestionModel.findOne({
                eventId: req.params?.eventId
            })

            const assistantInstructions = "As an assistant for an event, you are provided with these set of question" + eventQuestions.questions +
                " . Your job is to ask them one by one" +
                " from the user. When the user says 'Let us start', you should start with the first question from the list. Please do not paraphrase or change the questions," +
                " make sure they are the same and move to the next question from the list as each answer is given by the user. Once All the questions are asked, you" +
                " should say 'Thank you very much for the feedback'. And then list down all the questions along with their answers. The format for listing down" +
                " questions and answers at the end shall be like this: QUESTION: question-text followed by" +
                " the ANSWER: answer-of-the-user and then a new line. Each question and answer will be grouped" +
                " together as stated and then separated by a new line. One important thing to remember is that" +
                " when asking questions, you should not have any affirmations or acknowledgement so just the question"

            const assistantId = await _createNewAssistantForEvent(
                event,
                `${event.id}_event_assistant`,
                assistantInstructions
            )

            event.assistantId = assistantId
            await event.save()

            await SummaryModel.create({ eventId: event._id })

            if(!user.eventId) {
                user.eventId = event._id
                await user.save()
            }

            const conversationResponse = await _conversationHelper(
                user,
                event,
                assistantId,
                req.body?.prompt
            )

            return res.status(200).send({ response: conversationResponse })
        }

        if(!user.eventId) {
            user.eventId = event._id
            await user.save()
        }

        const conversationResponse = await _conversationHelper(
            user,
            event,
            event.assistantId,
            req.body?.prompt
        )

        return res.status(200).send({ response: conversationResponse })
    }
    catch(err) {
        console.error(err)
        return res.status(500).send(err?.message)
    }
}

module.exports = {
    conversateWithAssistant,
    getUserChat
}