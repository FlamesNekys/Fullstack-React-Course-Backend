const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minLength: 3,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    password: String,
    blogs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Blog',
        },
    ],
})

userSchema.plugin(uniqueValidator)

userSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
        delete returnedObject.password
    },
})

module.exports = mongoose.model('User', userSchema)
