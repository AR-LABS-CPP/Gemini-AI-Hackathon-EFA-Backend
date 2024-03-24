const { generateResponse } = require("./gemini.service")

/*
    Don't even know if its good or bad lol
*/
const generateNewSummary = async (eventName, summary, newAnswersSet) => {
    try {
        // There is no previous summary so start fresh
        if(!summary) {
            const promptText = "Given an event named: " + eventName +
                " and a set of questions: " + newAnswersSet + "."
                " Your task is to generate a summary describing the " +
                " the overall sentiment from the answer set along with the possible " +
                " improvements that can be made for that event based on the " +
                " answer set. The summary should ideally be of 6 lines. The" +
                " generated summary should be paraphrased and should not have" +
                " any repeated or old information. The summary should also be in" +
                " text format and not bullet points of any other format." 

            const modelResponse = await generateResponse([], promptText)

            return modelResponse
        }

        const promptText = "Given an event named: " + eventName +
                " and a set of questions: " + newAnswersSet + "."
                " Your task is to update this summary" + `"${summary}"` +
                " and its overall sentiment from the answer set along with the possible " +
                " improvements that can be made for that event based on the " +
                " answer set. The summary should ideally be of 6 lines. The" +
                " generated summary should be paraphrased and should not have" +
                " any repeated or old information. It should also be in text format" +
                " and not bullet points or any other format. However, the summary" +
                " should reflect the overall questions both old and new so that we get the gist of everything"

            const modelResponse = await generateResponse([], promptText)

            return modelResponse
    }
    catch(err) {
        console.error(err)
        return null
    }
}

module.exports = {
    generateNewSummary
}