const transformChatHistory = (history) => {
    try {
        const transformedHistory = history?.map(H => ({
            role: H?.role,
            parts: [{ text: H?.text }]
        }))

        return transformedHistory
    }
    catch(err) {
        console.error(err)
        throw new Error("Error occurred while transforming chat history")
    }
}

module.exports = {
    transformChatHistory
}