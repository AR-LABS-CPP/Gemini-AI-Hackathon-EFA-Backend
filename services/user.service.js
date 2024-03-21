const UserModel = require("../models/user.model")

const createNewUser = async (req, res) => {
    try {
        const newUser = await UserModel.create({
            username: req.body?.username
        })
        return res.status(200).send({ id: newUser.id })
    }
    catch(err) {
        console.error(err)
        return res.sendStatus(500)
    }
}

const updateUserIfExists = async (req, res) => {
    try {
        const user = await UserModel.findById(req.params?.userId)

        if(user) {
            user.username = username
            await user.save()

            return res.status(200).send("User updated successfully")
        }

        return res.status(404).send("User with the given id does not exist")
    }
    catch(err) {
        console.error(err)
        return res.sendStatus(500)
    }
}

module.exports = {
    createNewUser,
    updateUserIfExists
}