import axios from 'axios'

export default class RegistrationForm {
  constructor() {
    this.form = document.querySelector('#registration-form')
    this.allFields = this.form.querySelectorAll('.form-control')
    this._csrf = document.querySelector('[name="_csrf"]')
    this.username = document.querySelector('#username-register')
    this.email = document.querySelector('#email-register')
    this.password = document.querySelector('#password-register')

    this.username.previousValue = ''
    this.email.previousValue = ''
    this.password.previousValue = ''

    this.insertValidationElements()

    this.username.isUnique = false
    this.email.isUnique = false

    this.events()
  }

  events() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault()
      this.formSubmitHandler()
    })
    this.username.addEventListener('keyup', () => {
      this.isDifferent(this.username, this.usernameHandler)
    })
    this.email.addEventListener('keyup', () => {
      this.isDifferent(this.email, this.emailHandler)
    })
    this.password.addEventListener('keyup', () => {
      this.isDifferent(this.password, this.passwordHandler)
    })
    this.username.addEventListener('blur', () => {
      this.isDifferent(this.username, this.usernameHandler)
    })
    this.email.addEventListener('blur', () => {
      this.isDifferent(this.email, this.emailHandler)
    })
    this.password.addEventListener('blur', () => {
      this.isDifferent(this.password, this.passwordHandler)
    })
  }

  formSubmitHandler() {
    this.usernameImmediately()
    this.usernameAfterDelay()
    this.emailAfterDelay()
    this.passwordImmediately()
    this.passwordAfterDelay()

    if (this.username.isUnique && !this.username.errors && this.email.isUnique && !this.email.errors && !this.password.errors) {
      this.form.submit()
    }
  }

  isDifferent(el, handler) {
    if (el.value !== el.previousValue) {
      handler.call(this)
    }
    el.previousValue = el.value
  }

  usernameHandler() {
    this.username.errors = false
    this.usernameImmediately()
    clearTimeout(this.username.timer)
    this.username.timer = setTimeout(() => {
      this.usernameAfterDelay()
    }, 750);
  }

  emailHandler() {
    this.email.errors = false
    clearTimeout(this.email.timer)
    this.email.timer = setTimeout(() => {
      this.emailAfterDelay()
    }, 750);
  }

  passwordHandler() {
    this.password.errors = false
    this.passwordImmediately()
    clearTimeout(this.password.timer)
    this.password.timer = setTimeout(() => {
      this.passwordAfterDelay()
    }, 750);
  }

  passwordImmediately() {
    if (this.password.value.length > 50) {
      this.showValidationError(this.password, 'Password cannot exceed 50 chars')
    }
    if (!this.password.errors) {
      this.hideValidationError(this.password)
    }
  }

  passwordAfterDelay() {
    if (this.password.value.length < 12) {
      this.showValidationError(this.password, 'Password must be at least 12 chars')
    }
  }

  emailAfterDelay() {
    if (!/^\S+@\S+$/.test(this.email.value)) {
      this.showValidationError(this.email, 'You must provide a valid email address')
    }
    if (!this.email.errors) {
      axios.post('/doesEmailExist', { _csrf:this._csrf.value, email: this.email.value.trim() }).then((response) => {
        if (response.data) {
          this.showValidationError(this.email, 'That email is already being used')
          this.email.isUnique = false
        } else {
          this.email.isUnique = true
          this.hideValidationError(this.email)
        }
      }).catch(() => {
        console.log('Please, try again later')
      })
    }
  }

  usernameImmediately() {
    if (this.username.value !== '' && !/^([a-zA-z0-9]+)$/.test(this.username.value)) {
      this.showValidationError(this.username, 'Username can only contain letters and numbers')
    }
    if (this.username.value.length > 30) {
      this.showValidationError(this.username, 'Username cannot exceed 30 chars')
    }
    if (!this.username.errors) {
      this.hideValidationError(this.username)
    }
  }
  usernameAfterDelay() {
    if (this.username.value.length < 3) {
      this.showValidationError(this.username, 'Username must be at least 3 chars')
    }
    if (!this.username.errors) {
      axios.post('/doesUsernameExist', {_csrf:this._csrf.value, username: this.username.value.trim()}).then((response) => {
        if (response.data) {
          this.showValidationError(this.username, 'That username is already taken')
          this.username.isUnique = false
        } else {
          this.username.isUnique = true
        }
      }).catch(() => {
        console.log('Please, try again later')
      })
    }
  }

  hideValidationError(el) {
    el.nextElementSibling.classList.remove('liveValidateMessage--visible')
  }

  showValidationError(el, message) {
    el.nextElementSibling.innerHTML = message
    el.nextElementSibling.classList.add('liveValidateMessage--visible')
    el.errors = true
  }

  insertValidationElements() {
    this.allFields.forEach(function(el) {
      el.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>')
    })
  }
}