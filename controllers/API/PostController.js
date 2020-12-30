const Post = require('../../models/Post')

exports.store = async (req, res) => {
  const post = new Post(req.body, req.apiUser._id)
  try {
    const _id = await post.store()
    res.json('New post successfully created!')
  } catch (errors) {
    res.json(errors)
  }
}

exports.delete = async (req, res) => {
  try {
    await Post.delete(req.params.id, req.apiUser._id)
    res.json('Post successfully deleted.')
  } catch (errors) {
    res.json('You do not have permission to perform that action.')
  }
}
