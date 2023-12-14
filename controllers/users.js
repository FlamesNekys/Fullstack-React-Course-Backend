const usersRouter = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcryptjs')

usersRouter.post('/', async (req, res) => {
    const { username, name, password } = req.body

    if (password && password.length >= 3) {
        const saltRounds = 10
        const passwordHash = await bcrypt.hash(password, saltRounds)

        const user = new User({
            username,
            name,
            password: passwordHash,
        })

        const savedUser = await user.save()

        res.status(201).json(savedUser)
    } else if (password)
        res.status(400).send({ error: 'Password must be at least 3 characters long' })
    else res.status(400).send({ error: 'Password is missing' })
})

usersRouter.get('/', async (req, res) => {
    const users = await User.find({}).populate('blogs', { url: 1, title: 1, author: 1 })

    res.json(users)
})

module.exports = usersRouter
