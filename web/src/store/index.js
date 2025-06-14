import { createStore } from 'vuex'
import auth from './modules/auth'
import notifications from './modules/notifications'

const store = createStore({
  modules: {
    auth,
    notifications,
  },
})

export default store
