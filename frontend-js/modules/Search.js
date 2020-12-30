import axios from 'axios'
import domPurify from 'dompurify'
export default class Search {
  constructor () {
    this._csrf = document.querySelector('[name="_csrf"]')
    this.injectHtml()
    this.overlay = document.querySelector('.search-overlay')
    this.closeIcon = document.querySelector('.close-live-search')
    this.headerSearchIcon = document.querySelector('.header-search-icon')
    this.inputField = document.getElementById('live-search-field')
    this.resultsArea = document.querySelector('.live-search-results')
    this.loaderIcon = document.querySelector('.circle-loader')
    this.typingWaitTimer = null
    this.previousValue = ''
    this.events()
  }

  events() {
    this.inputField.addEventListener('keyup', () => {
      this.keyPressHandler()
    })
    this.headerSearchIcon.addEventListener('click', (e) => {
      e.preventDefault()
      this.openOverlay()
    })
    this.closeIcon.addEventListener('click', () => {
      this.closeOverlay()
    })
  }

  openOverlay() {
    this.overlay.classList.add('search-overlay--visible')
    setTimeout(() => {
      this.inputField.focus()
    }, 500);
  }

  closeOverlay() {
    this.overlay.classList.remove('search-overlay--visible')
  }

  keyPressHandler() {
    const value = this.inputField.value.trim()
    if (value === '') {
      clearTimeout(this.typingWaitTimer)
      this.hideLoaderIcon()
      this.hideResultsArea()
    }
    else if (value !== this.previousValue) {
      clearTimeout(this.typingWaitTimer)
      this.showLoaderIcon()
      this.hideResultsArea()
      this.typingWaitTimer = setTimeout(() => {
        this.sendRequest()
      }, 750);
    }
    this.previousValue = value
  }

  renderResultsHtml(posts) {
    const postsCount = posts.length
    if (postsCount) {
      this.resultsArea.innerHTML = domPurify.sanitize(`<div class="list-group shadow-sm">
            <div class="list-group-item active"><strong>Search Results</strong>(${postsCount} item${postsCount > 1 ? 's' : ''} found)</div>
            ${posts.map(post => {
              const date = new Date(post.created_at)
              return `<a href="/posts/${post._id}" class="list-group-item list-group-item-action">
                <img class="avatar-tiny" src="${post.author.avatar}"> <strong>${post.title}</strong>
                <span class="text-muted small">by ${post.author.username} on ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}</span>
              </a>`
            }).join('')}
          </div>`)
    } else {
      this.resultsArea.innerHTML = `<p class="alert alert-danger text-center shadow-sm">No results found</p>`
    }
    this.hideLoaderIcon()
    this.showResultsArea()
  }

  sendRequest() {
    axios
      .post('/search', { _csrf: this._csrf.value, searchTerm: this.inputField.value.trim() })
      .then(response => {
        this.renderResultsHtml(response.data)
      })
      .catch(err => alert(err.message))
  }

  showLoaderIcon() {
    this.loaderIcon.classList.add('circle-loader--visible')
  }

  hideLoaderIcon() {
    this.loaderIcon.classList.remove('circle-loader--visible')
  }

  showResultsArea() {
    this.resultsArea.classList.add('live-search-results--visible')
  }

  hideResultsArea() {
    this.resultsArea.classList.remove('live-search-results--visible')
  }

  injectHtml() {
    document.body.insertAdjacentHTML('beforeend', `<div class="search-overlay">
    <div class="search-overlay-top shadow-sm">
      <div class="container container--narrow">
        <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
        <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
        <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
      </div>
    </div>

    <div class="search-overlay-bottom">
      <div class="container container--narrow py-3">
        <div class="circle-loader"></div>
        <div class="live-search-results">

        </div>
      </div>
    </div>
  </div>`)
  }
}