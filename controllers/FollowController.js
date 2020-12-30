const Follow = require('../models/Follow')

exports.follow = function(req, res) {
  const follow = new Follow(req.params.username, req.visitorId)
  follow
    .create()
    .then(async () => {
      req.flash('success', `Successfully followed ${req.params.username}`)
      await req.session.save()
      res.redirect(`/users/${req.params.username}`)
    })
    .catch(async errors => {
      errors.forEach(error => req.flash('errors', error))
      await req.session.save()
      res.redirect('/')
    })
}

exports.unfollow = function (req, res) {
  const follow = new Follow(req.params.username, req.visitorId)
  follow
    .delete()
    .then(async () => {
      req.flash('success', `Successfully stop following ${req.params.username}`)
      await req.session.save()
      res.redirect(`/users/${req.params.username}`)
    })
    .catch(async errors => {
      errors.forEach(error => req.flash('errors', error))
      await req.session.save()
      res.redirect('/')
    })
}