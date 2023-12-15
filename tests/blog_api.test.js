const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const helper = require('./test_helper')
const User = require('../models/user')

const api = supertest(app)

beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})

    const defUser = new User(helper.defaultUser)
    const savedUser = await defUser.save()

    const userObjects = helper.initialUsers.map((user) => new User(user))
    const blogObjects = helper.initialBlogs
        .map((blog) => {
            const linkedBlog = blog
            linkedBlog.user = savedUser._id
            return linkedBlog
        })
        .map((blog) => new Blog(blog))
    const promiseArray = blogObjects
        .map((blog) => blog.save())
        .concat(userObjects.map((user) => user.save()))
    await Promise.all(promiseArray)
})

describe('tests of blog API', () => {
    describe('when there is initially some blogs saved', () => {
        test('blogs are returned as json', async () => {
            await api
                .get('/api/blogs')
                .expect(200)
                .expect('Content-Type', /application\/json/)
        })

        test('all blogs are returned', async () => {
            const res = await api.get('/api/blogs')

            expect(res.body).toHaveLength(helper.initialBlogs.length)
        })

        test('a specific blog is within the returned blogs', async () => {
            const res = await api.get('/api/blogs')

            const titles = res.body.map((b) => b.title)
            expect(titles).toContain('Canonical string reduction')
        })

        test('property is named "id"', async () => {
            const res = await api.get('/api/blogs')

            expect(res.body[0].id).toBeDefined()
        })
    })

    describe('viewing a specific blog', () => {
        test('succeeds with a valid id', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToView = blogsAtStart[1]

            const resultBlog = await api
                .get(`/api/blogs/${blogToView.id}`)
                .expect(200)
                .expect('Content-Type', /application\/json/)

            expect(resultBlog.body.title).toEqual(blogToView.title)
        })

        test('fails with statuscode 404 if blog does not exist', async () => {
            const validNonExistingId = await helper.nonExistingId()

            await api.get(`/api/blogs/${validNonExistingId}`).expect(404)
        })
        test('fails with statuscode 400 if id is invalid', async () => {
            const invalidId = '5a3d5da59070081a82a3445'

            await api.get(`/api/blogs/${invalidId}`).expect(400)
        })
    })

    describe('addition of a new blog', () => {
        test('a valid blog can be added', async () => {
            const newBlog = {
                title: 'Classes vs. Data Structures',
                author: 'Robert C. Martin',
                url: 'https://blog.cleancoder.com/uncle-bob/2019/06/16/ObjectsAndDataStructures.html',
                likes: 4,
            }

            const login = await api.post('/api/login').send({
                username: helper.initialUsers[0].username,
                password: 'password',
            })

            const token = `Bearer ${login.body.token}`

            await api
                .post('/api/blogs')
                .send(newBlog)
                .set('Authorization', token)
                .expect(201)
                .expect('Content-Type', /application\/json/)

            const blogsAtEnd = await helper.blogsInDb()
            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

            const titles = blogsAtEnd.map((b) => b.title)
            expect(titles).toContain('Classes vs. Data Structures')
        })

        test('like defaults to 0', async () => {
            const newBlog = {
                title: 'Classes vs. Data Structures',
                author: 'Robert C. Martin',
                url: 'https://blog.cleancoder.com/uncle-bob/2019/06/16/ObjectsAndDataStructures.html',
            }

            const login = await api.post('/api/login').send({
                username: helper.initialUsers[0].username,
                password: 'password',
            })

            const token = `Bearer ${login.body.token}`

            await api
                .post('/api/blogs')
                .send(newBlog)
                .set('Authorization', token)
                .expect(201)
                .expect('Content-Type', /application\/json/)

            const blogsAtEnd = await helper.blogsInDb()
            const addedBlog = blogsAtEnd.find(
                (blog) => blog.title === 'Classes vs. Data Structures'
            )
            expect(addedBlog.likes).toBe(0)
        })

        test('blog without title is not added', async () => {
            const login = await api.post('/api/login').send({
                username: helper.initialUsers[0].username,
                password: 'password',
            })

            const token = `Bearer ${login.body.token}`

            await api
                .post('/api/blogs')
                .send({ ...helper.initialBlogs[0], title: null })
                .set('Authorization', token)
                .expect(400)

            const blogsAtEnd = await helper.blogsInDb()
            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
        })

        test('blog without url is not added', async () => {
            const login = await api.post('/api/login').send({
                username: helper.initialUsers[0].username,
                password: 'password',
            })

            const token = `Bearer ${login.body.token}`

            await api
                .post('/api/blogs')
                .send({ ...helper.initialBlogs[0], url: null })
                .set('Authorization', token)
                .expect(400)

            const blogsAtEnd = await helper.blogsInDb()
            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
        })

        test('adding a blog fails with the proper status code if token is not provided', async () => {
            await api.post('/api/blogs').send(helper.initialBlogs[0]).expect(401)

            const blogsAtEnd = await helper.blogsInDb()
            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
        })
    })

    describe('deleting of an individual blog', () => {
        test('succeeds with status code 204 if id is valid', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToDelete = blogsAtStart[1]

            const login = await api.post('/api/login').send({
                username: helper.defaultUser.username,
                password: 'password',
            })

            const token = `Bearer ${login.body.token}`

            await api
                .delete(`/api/blogs/${blogToDelete.id}`)
                .set('Authorization', token)
                .expect(204)

            const blogsAtEnd = await helper.blogsInDb()

            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

            const titles = blogsAtEnd.map((b) => b.title)
            expect(titles).not.toContain(blogToDelete.title)
        })

        test('fails with statuscode 400 if id is invalid', async () => {
            const invalidId = '5a3d5da59070081a82a3445'

            await api.delete(`/api/blogs/${invalidId}`).expect(400)
        })
    })

    describe('updating of an individual blog', () => {
        test('succeeds with status code 204 if id is valid', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToUpdate = blogsAtStart[1]

            await api
                .put(`/api/blogs/${blogToUpdate.id}`)
                .send({ ...blogToUpdate, title: 'New awesome title' })
                .expect(204)

            const blogsAtEnd = await helper.blogsInDb()

            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

            const titles = blogsAtEnd.map((b) => b.title)
            expect(titles).toContain('New awesome title')
        })

        test('fails with statuscode 400 if id is invalid', async () => {
            const invalidId = '5a3d5da59070081a82a3445'

            await api.put(`/api/blogs/${invalidId}`).expect(400)
        })
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })
})
