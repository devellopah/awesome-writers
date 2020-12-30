const express = require('express')
const UserController = require('./controllers/UserController')
const PostController = require('./controllers/PostController')
const FollowController = require('./controllers/FollowController')

// const Post = require('./models/Post')

const router = express.Router()

router.get('/', UserController.home)

// auth routes
router.post('/register', UserController.register)
router.post('/login', UserController.login)
router.post('/logout', UserController.logout)

// user routes
// router.get('/users/create', UserController.checkAuth, PostController.create)
router.get('/users/:username', UserController.checkIfExists, UserController.sharedProfileData, UserController.show)
router.get('/users/:username/posts', UserController.checkIfExists, UserController.sharedProfileData, UserController.getPosts)
router.get('/users/:username/followers', UserController.checkIfExists, UserController.sharedProfileData, UserController.getFollowers)
router.get('/users/:username/following', UserController.checkIfExists, UserController.sharedProfileData, UserController.getFollowing)

router.post('/doesUsernameExist', UserController.doesUsernameExist)
router.post('/doesEmailExist', UserController.doesEmailExist)
// router.post('/users', UserController.checkAuth, PostController.store)

// post routes
router.get('/posts/create', UserController.checkAuth, PostController.create)
router.get('/posts/:id/edit', UserController.checkAuth, PostController.edit)
router.get('/posts/:id', PostController.show)
router.post('/posts/:id', UserController.checkAuth, PostController.update)
router.delete('/posts/:id', UserController.checkAuth, PostController.delete)
router.post('/posts', UserController.checkAuth, PostController.store)
router.post('/search', PostController.search)

// follow routes
router.post('/follow/:username', UserController.checkAuth, FollowController.follow)
router.post('/unfollow/:username', UserController.checkAuth, FollowController.unfollow)

module.exports = router
