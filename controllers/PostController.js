const Post = require('../models/Post')

exports.create = (req, res) => {
  res.render('posts/create')
}

exports.store = async (req, res) => {
  const post = new Post(req.body, req.session.user._id)
  try {
    const _id = await post.store()
    req.flash('success', 'New post successfully created!')
    await req.session.save()
    res.redirect(`/posts/${_id}`)
  } catch(errors) {
    errors.forEach(error => req.flash('errors', error))
    await req.session.save()
    res.redirect('/posts/create')
  }
}

exports.show = async (req, res) => {
  try {
    const post = await Post.findSingleById(req.params.id, req.visitorId)
    res.render('posts/show', { post })
  } catch {
    res.render('error')
  }
}

exports.edit = async (req, res) => {
  try {
    const post = await Post.findSingleById(req.params.id, req.visitorId)
    if (post.isOwner) {
      res.render('posts/edit', { post })
    } else {
      req.flash("errors", "You do not have permission to perform that action.")
      await req.session.save()
      res.redirect('/')
    }
  } catch {
    res.render('error')
  }
}

exports.update = async (req, res) => {
  try {
    const post = new Post(req.body, req.visitorId, req.params.id)
    const status = await post.update()
    status === 'success'
      ? req.flash('success', 'Post successfully updated.')
      : post.errors.forEach(error => req.flash('errors', error))

    await req.session.save()
    res.redirect(`/posts/${req.params.id}/edit`)
  } catch {
    req.flash('errors', 'You dont have permission to perform that action.')
    await req.session.save()
    res.redirect('/')
  }
}

exports.delete = async (req, res) => {
  const status = await Post.delete(req.params.id, req.visitorId)
  status === 'success'
    ? req.flash('success', 'Post successfully deleted.')
    : req.flash('errors', 'You do not have permission to perform that action.')

  await req.session.save()

  status === 'success'
    ? res.redirect(`/users/${req.session.user.username}`)
    : res.redirect('/')
}

exports.search = async (req, res) => {
  try {
    const posts = await Post.search(req.body.searchTerm)
    posts ? res.json(posts) : res.json([])
  } catch {
    res.render('error')
  }
}