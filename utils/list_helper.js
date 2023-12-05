const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs.reduce((acc, el) => (acc += el.likes), 0)
}

module.exports = {
    dummy,
    totalLikes,
}
