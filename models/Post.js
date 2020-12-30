const postsCollection = require('../db').db().collection('posts')
const followsCollection = require('../db').db().collection('follows')

const ObjectID = require('mongodb').ObjectID
const User = require('./User')
const sanitizeHtml = require('sanitize-html')
function Post (data, userId, postId) {
  this.data = data
  this.userId = userId
  this.postId = postId
  this.errors = []
}

Post.prototype.store = function () {
  this.cleanUp()
  this.validate()

  return new Promise(async (resolve, reject) => {
    if (!this.errors.length) {
      try {
        const info = await postsCollection.insertOne(this.data)
        resolve(info.ops[0]._id)
      } catch {
        this.errors.push('Please, try again later.')
        reject(this.errors)
      }
    } else {
      reject(this.errors)
    }
  })
}

Post.prototype.update = function () {
  return new Promise(async (resolve, reject) => {
    try {
      const post = await Post.findSingleById(this.postId, this.userId)
      if (post.isOwner) {
        const status = await this.actuallyUpdate()
        resolve(status)
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}

Post.prototype.actuallyUpdate = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      await postsCollection.findOneAndUpdate({_id: new ObjectID(this.postId)}, {
        $set: {
          title: this.data.title,
          body: this.data.body,
        }
      })
      resolve("success")
    } else {
      reject("failure")
    }
  })
}

Post.delete = function (id, visitorId) {
  return new Promise(async (resolve, reject) => {
    try {
      const post = await Post.findSingleById(id, visitorId)
      if (post.isOwner) {
        await postsCollection.deleteOne({_id: new ObjectID(id)})
        resolve('success')
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}

Post.prototype.cleanUp = function () {
  if (typeof (this.data.title) !== "string") { this.data.title = "" }
  if (typeof (this.data.body) !== "string") { this.data.body = "" }

  this.data = {
    title: sanitizeHtml(this.data.title.trim(), { allowedTags: [], allowedAttributes: {} }),
    body: sanitizeHtml(this.data.body.trim(), { allowedTags: [], allowedAttributes: {} }),
    created_at: new Date(),
    author: ObjectID(this.userId),
  }
}

Post.prototype.validate = function () {
  if (this.data.title === "") { this.errors.push('Please, provide a title.') }
  if (this.data.body === "") { this.errors.push('Please, provide post content.') }
}

Post.getPosts = function (uniqueOperations, visitorId) {
  return new Promise(async (resolve, reject) => {
    const commonOperations = [
      { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'authorDocument' } },
      {
        $project: {
          title: 1,
          body: 1,
          created_at: 1,
          author: { $arrayElemAt: ['$authorDocument', 0] }
        }
      }
    ]

    const aggOperations = uniqueOperations.concat(commonOperations)

    let posts = await postsCollection
      .aggregate(aggOperations)
      .toArray()

    posts = posts.map(post => {
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar,
        _id: String(post.author._id),
      }
      post.isOwner = visitorId ===  post.author._id ? true : false
      // disallow accessing author id from posts search result
      post.author._id = undefined
      return post
    })

    resolve(posts)
  })
}

Post.findSingleById = function(id, visitorId) {
  return new Promise( async (resolve, reject) => {
    if(typeof(id) !== 'string' || !ObjectID.isValid(id)) {
      reject()
      return
    }
    const posts = await Post.getPosts([{ $match: { _id: new ObjectID(id) } }], visitorId)
    posts.length ? resolve(posts[0]) : reject()
  })
}

Post.findByAuthorId = function (id) {
  return Post.getPosts([
    { $match: { author: new ObjectID(id)} },
    { $sort: {created_at: -1} }
  ])
}

Post.search = function(searchTerm) {
  return new Promise(async(resolve, reject) => {
    if (typeof(searchTerm) === "string") {
      const posts = await Post.getPosts([
        {$match: {$text: {$search: searchTerm}}},
        {$sort: {score: {$meta: "textScore"}}}
      ])
      resolve(posts)
    } else {
      reject()
    }
  })
}

Post.getPostsCount = function(id) {
  return new Promise(async (resolve, reject) => {
    const postsCount = await postsCollection.countDocuments({author: new ObjectID(id)})
    resolve(postsCount)
  })
}

Post.getFeed = async function(id) {
  const followedUsers = await followsCollection.find({
    authorId: new ObjectID(id)
  }).toArray()
  const followedIds = followedUsers.map(followDoc => followDoc.followedId)

  return Post.getPosts([
    { $match: { author: { $in: followedIds}}},
    {$sort: {createDate: -1}}
  ])
}

module.exports = Post