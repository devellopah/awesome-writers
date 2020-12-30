const User = require('../../models/User')
const jwt = require('jsonwebtoken')

exports.login = (req, res) => {
  let user = new User(req.body)
  user.login()
    .then(async () => {
      res.json(jwt.sign({ _id: user.data._id }, process.env.JWT_SECRET, { expiresIn: '1d' }))
    })
    .catch(async (err) => {
      res.json('Incorrect')
    })
}

exports.checkAuth = (req, res, next) => {
  try {
    req.apiUser = jwt.verify(req.body.token, process.env.JWT_SECRET)
    next()
  } catch {
    res.json('Sorry, you must provide a valide token')
  }
}

exports.getPostsByUsername = async (req, res) => {
  try {
    const authorDoc = await User.findByUsername(req.params.username)
    const posts = await Post.findByAuthorId(authorDoc._id)
    res.json(posts)
  } catch {
    res.json('Sorry, invalid user requested.')
  }
}