const fsp = require("fs").promises

const writeFile = async (fileName, jsonData) => {
    try {
        await fsp.writeFile(fileName, JSON.stringify(jsonData, null, 4))

        console.debug(`[server]: ${fileName} file written successfully`)
    }
    catch(err) {
        console.debug("[server]: Error occurred while writing file")
        throw new Error("Error occurred while writing file")
    }
}

const deleteFile = async (fileName) => {
    try {
        fsp.unlink(fileName)

        console.debug(`[server]: ${fileName} file deleted successfully`)
    }
    catch(err) {
        console.debug("[server]: Error occurred while deleting file")
        throw new Error("Error occurred while deleting file")
    }
}

module.exports = {
    writeFile,
    deleteFile
}