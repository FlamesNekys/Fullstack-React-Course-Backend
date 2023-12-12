const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const helper = require('./test_helper')

const api = supertest(app)

beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = helper.initialBlogs.map((blog) => new Blog(blog))
    const promiseArray = blogObjects.map((blog) => blog.save())
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

            expect(resultBlog.body).toEqual(blogToView)
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
                _id: '65757bb54a8dcc4e81f7b878',
                title: 'Classes vs. Data Structures',
                author: 'Robert C. Martin',
                url: 'https://blog.cleancoder.com/uncle-bob/2019/06/16/ObjectsAndDataStructures.html',
                likes: 4,
                __v: 0,
            }

            await api
                .post('/api/blogs')
                .send(newBlog)
                .expect(201)
                .expect('Content-Type', /application\/json/)

            const blogsAtEnd = await helper.blogsInDb()
            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

            const titles = blogsAtEnd.map((b) => b.title)
            expect(titles).toContain('Classes vs. Data Structures')
        })

        test('like defaults to 0', async () => {
            const newBlog = {
                _id: '65757bb54a8dcc4e81f7b878',
                title: 'Classes vs. Data Structures',
                author: 'Robert C. Martin',
                url: 'https://blog.cleancoder.com/uncle-bob/2019/06/16/ObjectsAndDataStructures.html',
                __v: 0,
            }

            await api
                .post('/api/blogs')
                .send(newBlog)
                .expect(201)
                .expect('Content-Type', /application\/json/)

            const blogsAtEnd = await helper.blogsInDb()
            const addedBlog = blogsAtEnd.find(
                (blog) => blog.title === 'Classes vs. Data Structures'
            )
            expect(addedBlog.likes).toBe(0)
        })

        test('blog without title is not added', async () => {
            await api
                .post('/api/blogs')
                .send({ ...helper.initialBlogs[0], title: null })
                .expect(400)

            const blogsAtEnd = await helper.blogsInDb()
            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
        })

        test('blog without url is not added', async () => {
            await api
                .post('/api/blogs')
                .send({ ...helper.initialBlogs[0], url: null })
                .expect(400)

            const blogsAtEnd = await helper.blogsInDb()
            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
        })
    })

    describe('deleting of an individual blog', () => {
        test('succeeds with status code 204 if id is valid', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToDelete = blogsAtStart[1]

            await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)

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
