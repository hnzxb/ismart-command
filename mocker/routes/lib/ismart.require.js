module.exports = function (file) {
    delete require.cache[file]
    return require(file)
}