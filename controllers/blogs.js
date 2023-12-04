const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', (req, res) => {
    Blog.find({}).then((blogs) => {
        res.json(blogs)
    })
})

blogsRouter.get('/:id', (req, res, next) => {
    Blog.findById(req.params.id)
        .then((blog) => {
            if (blog) {
                res.json(blog)
            } else {
                res.status(404).end()
            }
        })
        .catch((e) => next(e))
})

blogsRouter.post('/', (req, res, next) => {
    const body = req.body

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
    })

    blog.save()
        .then((savedBlog) => {
            res.json(savedBlog)
        })
        .catch((e) => next(e))
})

blogsRouter.delete('/:id', (req, res, next) => {
    Blog.findByIdAndDelete(req.params.id)
        .then(() => {
            res.status(204).end()
        })
        .catch((e) => next(e))
})

blogsRouter.put('/:id', (req, res, next) => {
    const body = req.body

    const blog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
    }

    Blog.findByIdAndUpdate(req.params.id, blog, { new: true })
        .then((updatedBlog) => {
            res.json(updatedBlog)
        })
        .catch((e) => next(e))
})

module.exports = blogsRouter
