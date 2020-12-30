const express = require('express')
const methodOverride = require('method-override')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const markdown = require('marked')
const csrf = require('csurf')
const sanitizeHtml = require('sanitize-html')
const router = require('./router')

const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use('/api', require('./router-api'))

const sessionOptions = session({
  secret: "I buy stocks",
  store: new MongoStore({client: require('./db')}),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
  },
})

app.use(methodOverride('_method'))
app.use(sessionOptions)
app.use(flash())
app.use((req, res, next) => {
  // make markdown available from within templates
  res.locals.filterUserHtml = content => sanitizeHtml(markdown(content), {
    allowedTags: sanitizeHtml.defaults.allowedTags.filter(tag => tag !== 'a'),
    allowedAttributes: {}
  })
  // make user session data available from within view templates
  res.locals.user = req.session.user
  // make current user id available on the req object
  req.visitorId = req.session.user ? req.session.user._id : null
  // make flash error and success messages available from all templates
  res.locals.errors = req.flash('errors')
  res.locals.success = req.flash('success')
  next()
})

app.use(express.static('public'))
app.set('views', 'views')
app.set('view engine', 'ejs')

app.use(csrf())
app.use((req, res, next) => {
  const token = req.csrfToken()
  res.locals.csrfToken = token
  // console.log('token', token)
  next()
})

app.use('/', router)

app.use((err, req, res, next) => {
  if (err) {
    if (err.code === 'EBADCSRFTOKEN') {
      req.flash('errors', 'Cross site request forgery detected.')
      req.session.save(() => res.redirect('/'))
    } else {
    res.render('error')
    }
  }
})

const server = require('http').createServer(app)
const io = require('socket.io')(server)
io.use(function(socket, next) {
  sessionOptions(socket.request, socket.request.res, next)
})
io.on('connection', (socket) => {
  const user = socket.request.session.user
  socket.emit('welcome', {username: user.username, avatar: user.avatar})
  if (user) {
    socket.on('chatMessageFromBrowser', (data) => {
      socket.broadcast.emit('chatMessageFromServer', {
        message: sanitizeHtml(data.message, {allowedTags: [], allowedAttributes: {}}),
        username: user.username,
        avatar: user.avatar
      })
    })
  }
})
module.exports = server