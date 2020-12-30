const apiRouter = require('express').Router()
const UserController = require('./controllers/API/UserController')
const PostController = require('./controllers/API/PostController')
const cors = require('cors')

apiRouter.use(cors())

apiRouter.post('/login', UserController.login)
apiRouter.post('/posts', UserController.checkAuth, PostController.store)
apiRouter.delete('/posts/:id', UserController.checkAuth, PostController.delete)
apiRouter.get('/users/:username/posts', UserController.getPostsByUsername)

module.exports = apiRouter