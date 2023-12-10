const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs.reduce((acc, el) => (acc += el.likes), 0)
}

const favoriteBlog = (blogs) => {
    const topLikes = blogs.map((blog) => blog.likes).sort((a, b) => b - a)[0]
    const topBlog = blogs.find((blog) => blog.likes === topLikes)
    return topBlog
        ? {
              title: topBlog.title,
              author: topBlog.author,
              likes: topBlog.likes,
          }
        : null
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
}
