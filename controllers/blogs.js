const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (req, res) => {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    res.json(blogs)
})

blogsRouter.get('/:id', async (req, res) => {
    const blog = await Blog.findById(req.params.id)
    blog ? res.json(blog) : res.status(404).end()
})

blogsRouter.post('/', async (req, res) => {
    if (!req.token) return res.status(401).json({ error: 'token is not provided' })

    const body = req.body
    const user = req.user

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0,
        user: user.id,
    })

    const savedBlog = await blog.save()

    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    res.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', async (req, res) => {
    const id = req.params.id
    const user = req.user
    const blog = await Blog.findById(id)
    if (user.id.toString() === blog.user.toString()) {
        await Blog.findByIdAndDelete(blog.id)

        user.blogs = user.blogs.filter((b) => b.toString() !== id)
        await user.save()

        res.status(204).end()
    } else res.status(401).json({ error: 'You do not have permission to delete this blog' })
})

blogsRouter.put('/:id', async (req, res) => {
    const body = req.body

    const blog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
        user: body.userId,
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, blog, { new: true })
    res.status(204).json(updatedBlog)
})

module.exports = blogsRouter
