const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')

exports.home = async (req, res) => {
  const { user } = req.session
  if (user) {
    // fetch posts feed
    const posts = await Post.getFeed(req.session.user._id)
    res.render('home/dashboard', {posts})
  } else {
    res.render('home/guest', {
      regErrors: req.flash('regErrors')
    })
  }
}

exports.register = async (req, res) => {
  let user = new User(req.body)
  await user.register()
  if (user.errors.length) {
    user.errors.forEach((error) => req.flash('regErrors', error))
  } else {
    req.session.user = { username: user.data.username, avatar: user.avatar, _id: user.data._id }
  }
  req.session.save(() => res.redirect('/'))
}

exports.login = (req, res) => {
  let user = new User(req.body)
  user.login()
    .then(async () => {
      req.session.user = { username: user.data.username, avatar: user.avatar, _id: user.data._id }
      await req.session.save()
      res.redirect('/')
    })
    .catch(async (err) => {
      await req.flash('errors', err)
      res.redirect('/')
    })
}

exports.logout = async (req, res) => {
  await req.session.destroy()
  res.redirect('/')
}

exports.show = async (req, res) => {
  try {
    const { username, avatar } = req.user
    const { isFollowing, postsCount, followersCount, followingCount } = req

    res.render('users/show', { username, avatar, isFollowing, postsCount, followersCount, followingCount })
  } catch {
    res.render('error')
  }
}

exports.checkIfExists = async (req, res, next) => {
  try {
    const user = await User.findByUsername(req.params.username)
    req.user = user
    next()
  } catch {
    res.render('error')
  }
}

exports.checkAuth = async (req, res, next) => {
  if (Boolean(req.session.user)) {
    next()
  } else {
    req.flash('errors', 'You must be logged it to perform that action')
    await req.session.save()
    res.redirect('/')
   }
}

exports.sharedProfileData = async (req, res, next) => {
  let isFollowing = false
  if (req.session.user) {
    isFollowing = await Follow.isVisitorFollowing(req.user._id, req.visitorId)
  }
  req.isFollowing = isFollowing

  const [postsCount, followersCount, followingCount] = await Promise.all([
    Post.getPostsCount(req.user._id),
    Follow.getFollowersCount(req.user._id),
    Follow.getFollowingCount(req.user._id)
  ])

  req.postsCount = postsCount
  req.followersCount = followersCount
  req.followingCount = followingCount

  next()
}

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.findByAuthorId(req.user._id)
    res.json(posts)
  } catch {
    res.json({ error: 'Something went wrong' })
  }
}

exports.getFollowers = async (req, res) => {
  try {
    const followers = await Follow.getFollowersById(req.user._id)
    res.json(followers)
  } catch {
    res.json({error: 'Something went wrong'})
  }
}

exports.getFollowing = async (req, res) => {
  try {
    const following = await Follow.getFollowingById(req.user._id)
    res.json(following)
  } catch {
    res.json({ error: 'Something went wrong' })
  }
}

exports.doesUsernameExist = async (req, res) => {
  try {
    const user = await User.findByUsername(req.body.username)
    if (user) {
      res.json(true)
    } else {
      res.json(false)
    }
  } catch {
    res.json(false)
  }
}

exports.doesEmailExist = async (req, res) => {
  try {
    const isEmail = await User.doesEmailExist(req.body.email)
    res.json(isEmail)
  } catch {
    res.json(false)
  }
}
