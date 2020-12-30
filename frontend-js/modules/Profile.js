import axios from 'axios'

export default class Profile {

  constructor() {
    this.profileNav = document.querySelector('.profile-nav')
    this.profileContent = document.getElementById('profileContent')
    this.username = document.getElementById('username').textContent
    this.events()
    document.querySelector('.profile-nav-link.active').click()
  }

  events() {
    this.profileNav.addEventListener('click', e => {
      if (e.target.tagName !== 'A') return
      e.preventDefault()
      this.switchTab(e.target)
      const resource = e.target.getAttribute('data-resource')
      const options = {
        url: e.target.getAttribute('data-url'),
        callback: resource === 'posts' ? 'renderPosts' : 'renderFollowers',
        message: `No ${resource} yet`,
        resource,
      }
      this.fetchData(options)
    })
  }

  fetchData(options) {
    axios
      .get(options.url)
      .then(({ data }) => {
        if (data.length) {
          this[options.callback](data)
          this.updateCount(options.resource, data.length)
        } else {
          this.renderMessage(options.message)
        }
      })
      .catch(err => alert(err.message))
  }

  renderMessage(msg) {
    const html = `<em>${msg}</em>`

    this.updateProfileContent(html)
  }

  updateCount(resource, count) {
    console.log(document.getElementById(`${resource}Count`).textContent)
    document.getElementById(`${resource}Count`).textContent = count
  }

  updateProfileContent(html) {
    this.profileContent.innerHTML = html
  }

  switchTab(target) {
    const children = [].slice.call(target.parentNode.children)
    children.find(el => el.classList.contains('active')).classList.remove('active')
    target.classList.add('active')
  }

  renderPosts(data) {
    const html =
      `<div class="list-group">
        ${data.map(post => {
          const date = new Date(post.created_at)
          return `
          <a href="/posts/${post._id}" class="list-group-item list-group-item-action">
            <img class="avatar-tiny" src="https://gravatar.com/avatar/${post.author.avatar}">
            <strong>${post.title}</strong> on ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}
          </a>`
        }).join('')}
      </div>`

    this.updateProfileContent(html)
  }

  renderFollowers(data) {
    const html =
      `<div class="list-group">
        ${data.map(user =>`
          <a href="/users/${user.username}" class="list-group-item list-group-item-action">
            <img class="avatar-tiny" src="https://gravatar.com/avatar/${user.avatar}">
            <strong>${user.username}</strong>
          </a>`
      ).join('')}
      </div>`

    this.updateProfileContent(html)
  }
}