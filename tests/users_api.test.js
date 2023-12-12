const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const bcrypt = require('bcryptjs')
const User = require('../models/user')
const helper = require('./test_helper')

const api = supertest(app)

describe('when there is initially one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', password: passwordHash, name: 'root' })

        await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'mluukkai',
            name: 'Matti Luukkainen',
            password: 'salainen',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map((u) => u.username)
        expect(usernames).toContain(newUser.username)
    })

    describe('validation tests', () => {
        test('creation fails with proper statuscode and message if username already taken', async () => {
            const usersAtStart = await helper.usersInDb()

            const newUser = {
                username: 'root',
                name: 'Superuser',
                password: 'salainen',
            }

            const result = await api
                .post('/api/users')
                .send(newUser)
                .expect(400)
                .expect('Content-Type', /application\/json/)

            expect(result.body.error).toContain('expected `username` to be unique')

            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toEqual(usersAtStart)
        })

        test('creation fails with proper statuscode and message if username is missing', async () => {
            const usersAtStart = await helper.usersInDb()

            const newUser = {
                name: 'Fake Name',
                password: 'fakePassword',
            }

            const result = await api
                .post('/api/users')
                .send(newUser)
                .expect(400)
                .expect('Content-Type', /application\/json/)

            expect(result.body.error).toContain('Path `username` is required.')

            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toEqual(usersAtStart)
        })

        test('creation fails with proper statuscode and message if password is missing', async () => {
            const usersAtStart = await helper.usersInDb()

            const newUser = {
                username: 'fakeUsername',
                name: 'Fake Name',
            }

            const result = await api
                .post('/api/users')
                .send(newUser)
                .expect(400)
                .expect('Content-Type', /application\/json/)

            expect(result.body.error).toContain('Password is missing')

            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toEqual(usersAtStart)
        })

        test('creation fails with proper statuscode and message if username is less than 3 characters', async () => {
            const usersAtStart = await helper.usersInDb()

            const newUser = {
                username: 'li',
                name: 'Fake Name',
                password: 'fakePassword',
            }

            const result = await api
                .post('/api/users')
                .send(newUser)
                .expect(400)
                .expect('Content-Type', /application\/json/)

            expect(result.body.error).toContain(
                'Path `username` (`li`) is shorter than the minimum allowed length (3).'
            )

            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toEqual(usersAtStart)
        })

        test('creation fails with proper statuscode and message if password is less than 3 characters', async () => {
            const usersAtStart = await helper.usersInDb()

            const newUser = {
                username: 'fakeUsername',
                name: 'Fake Name',
                password: 'mi',
            }

            const result = await api
                .post('/api/users')
                .send(newUser)
                .expect(400)
                .expect('Content-Type', /application\/json/)

            expect(result.body.error).toContain('Password must be at least 3 characters long')

            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toEqual(usersAtStart)
        })
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })
})
