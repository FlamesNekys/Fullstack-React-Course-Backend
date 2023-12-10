const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const helper = require('./test_helper')
const blog = require('../models/blog')

const api = supertest(app)

beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = helper.initialBlogs.map((blog) => new Blog(blog))
    const promiseArray = blogObjects.map((blog) => blog.save())
    await Promise.all(promiseArray)
})

describe('tests of blog API', () => {
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

    test('property is named "id"', async () => {
        const res = await api.get('/api/blogs')

        expect(res.body[0].id).toBeDefined()
    })

    test('a specific blog is within the returned blogs', async () => {
        const res = await api.get('/api/blogs')

        const titles = res.body.map((b) => b.title)
        expect(titles).toContain('Canonical string reduction')
    })

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
        const addedBlog = blogsAtEnd.find((blog) => blog.title === 'Classes vs. Data Structures')
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

    afterAll(async () => {
        await mongoose.connection.close()
    })
})
