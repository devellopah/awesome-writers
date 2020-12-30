import Search from './modules/Search'
import Profile from './modules/Profile'
import Chat from './modules/Chat'
import RegistrationForm from './modules/RegistrationForm'


if (document.querySelector('#registration-form')) {
  new RegistrationForm()
}

if (document.querySelector('.header-search-icon')) {
  new Search()
}

if (document.querySelector('.profile-nav')) {
  new Profile()
}

if (document.querySelector('#chat-wrapper')) {
  new Chat()
}