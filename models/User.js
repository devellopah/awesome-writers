const validator = require('validator')
const bcrypt = require('bcryptjs')
const md5 = require('md5')
const usersCollection = require('../db').db().collection('users')
const User = function (data, isAvatar = false) {
  this.data = data
  this.errors = []

  isAvatar && this.getAvatar()
}

User.prototype.cleanUp = function () {
  let { username, email, password } = this.data
  if (typeof(username) !== "string") username = ""
  if (typeof(email) !== "string") email = ""
  if (typeof(password) !== "string") password = ""

  this.data = {
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    password
  }
}

User.prototype.validate = async function() {
  const isUsernameOk = validator.isAlphanumeric(this.data.username)
  const isEmailOk = validator.isEmail(this.data.email)

  if (validator.isEmpty(this.data.username)) this.errors.push("Please, provide a username.")
  if (!validator.isEmpty(this.data.username) && !isUsernameOk) this.errors.push("Username must only contain letters and numbers.")

  if (this.data.username.length > 0 && this.data.username.length < 3) this.errors.push("Username must be at least 3 characters long.")
  if (this.data.username.length > 30) this.errors.push("Username cannot exceed 30 characters.")

  if (this.data.username.length > 2 && this.data.username.length < 31 && isUsernameOk) {
    const usernameExists = await usersCollection.findOne({username: this.data.username})
    if (usernameExists) {
      this.errors.push('That username is already taken.')
    }
  }

  if (isEmailOk) {
    const emailExists = await usersCollection.findOne({ email: this.data.email })
    if (emailExists) {
      this.errors.push('That email is already being used.')
    }
  } else {
    this.errors.push("Please, provide a valid email address.")
  }

  if (this.data.password === "") this.errors.push("Please, provide a password.")
  if (this.data.password.length > 0 && this.data.password.length < 12) this.errors.push("Password must be at least 12 characters long.")
  if (this.data.password.length > 50) this.errors.push("Password cannot exceed 50 characters.")
}

User.prototype.register = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate()

    if (!this.errors.length) {
      const salt = bcrypt.genSaltSync(10)
      this.data.password = bcrypt.hashSync(this.data.password, salt)
      await usersCollection.insertOne(this.data)
      this.getAvatar()
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

User.prototype.login = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp()
    usersCollection.findOne({username: this.data.username})
      .then((user) => {
        if (user && bcrypt.compareSync(this.data.password, user.password)) {
          this.data = user
          this.getAvatar()
          resolve(`Hey ${this.data.username}! Happy to see you back!`)
        } else {
          reject('Invalid username or password.')
        }
      })
      .catch(() => reject('Please, try again later.'))
  })
}

User.prototype.getAvatar = function() {
  this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findByUsername = function (username) {
  return new Promise(async(resolve, reject) => {
    if (typeof(username) !== 'string') {
      reject()
      return
    }
    const userDoc = await usersCollection.findOne({username})
    if (userDoc) {
      const { data: { _id, username }, avatar } = new User(userDoc, true)
      resolve({_id, username, avatar})
    } else {
      reject()
    }
  })
}

User.doesEmailExist = function (email) {
  return new Promise(async (resolve, reject) => {
    if (typeof(email) !== 'string') {
      resolve(false)
      return
    }
    const user = await usersCollection.findOne({email})
    if (user) {
      resolve(true)
    } else {
      resolve(false)
    }
  })
}

module.exports = User