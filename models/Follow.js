const { ObjectID } = require('mongodb')
const usersCollection = require('../db').db().collection('users')
const followsCollection = require('../db').db().collection('follows')
const User = require('./User')
const Follow = function(followedUsername, authorId) {
  this.followedUsername = followedUsername
  this.authorId = authorId
  this.errors = []
}

Follow.prototype.cleanUp = function() {
  if (typeof this.followedUsername !== 'string') {
    this.followedUsername = ''
  }
}

Follow.prototype.validate = async function (action) {
  const followedAccount = await usersCollection.findOne({username: this.followedUsername})
  if (followedAccount) {
    this.followedId = followedAccount._id
  } else {
    this.errors.push('You cannot follow user that does not exist')
  }
  let isFollowExists = await followsCollection.findOne({ followedId: this.followedId, authorId: new ObjectID(this.authorId) })
  if (action === 'create') {
    if (isFollowExists) {
      this.errors.push('You are already following the user')
    }
  }
  if (action === 'delete') {
    if (!isFollowExists) {
      this.errors.push('You cannot stop follow user you are not following')
    }
  }
  if (this.followedId.equals(this.authorId)) {
    this.errors.push('You cannot follow yourself')
  }
}

Follow.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate('create')
    if (!this.errors.length) {
      await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

Follow.prototype.delete = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate('delete')
    if (!this.errors.length) {
      await followsCollection.deleteOne({ followedId: this.followedId, authorId: new ObjectID(this.authorId) })
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

Follow.isVisitorFollowing = async function(followedId, visitorId) {
  let followDoc = await followsCollection.findOne({followedId, authorId: new ObjectID(visitorId)})
  return Boolean(followDoc)
}

Follow.getFollowersById = function(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const followersData = await followsCollection.aggregate([
        {$match: {followedId: new ObjectID(id)}},
        {$lookup: {from: 'users', localField: 'authorId', foreignField: '_id', as: 'userDoc'}},
        {$project: {
          username: {$arrayElemAt: ['$userDoc.username', 0]},
          email: {$arrayElemAt: ['$userDoc.email', 0] },
        }},
      ]).toArray()
      const followers = followersData.map(follower => {
        let user  = new User(follower, true)
        return { username: follower.username, avatar: user.avatar }
      })
      resolve(followers)
    } catch {
      reject()
    }
  })
}

Follow.getFollowingById = function (id) {
  return new Promise(async (resolve, reject) => {
    try {
      const followingData = await followsCollection.aggregate([
        { $match: { authorId: new ObjectID(id) } },
        { $lookup: { from: 'users', localField: 'followedId', foreignField: '_id', as: 'userDoc' } },
        {
          $project: {
            username: { $arrayElemAt: ['$userDoc.username', 0] },
            email: { $arrayElemAt: ['$userDoc.email', 0] },
          }
        },
      ]).toArray()
      const following = followingData.map(follower => {
        let user = new User(follower, true)
        return { username: follower.username, avatar: user.avatar }
      })
      resolve(following)
    } catch {
      reject()
    }
  })
}

Follow.getFollowersCount = function (id) {
  return new Promise(async (resolve, reject) => {
    const followersCount = await followsCollection.countDocuments({ followedId: new ObjectID(id) })
    resolve(followersCount)
  })
}

Follow.getFollowingCount = function (id) {
  return new Promise(async (resolve, reject) => {
    const followingCount = await followsCollection.countDocuments({ authorId: new ObjectID(id) })
    resolve(followingCount)
  })
}

module.exports = Follow