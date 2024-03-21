const { default: mongoose } = require("mongoose");

const UserModel = new mongoose.Schema({
    username: {
        type: String,
    }
})

module.exports = mongoose.model("User", UserModel)