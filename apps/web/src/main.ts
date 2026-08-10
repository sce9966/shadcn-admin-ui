import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useTheme } from './composables/useTheme'
import { useAuthStore } from './stores/auth'
import './styles/globals.css'

const { syncTheme } = useTheme()
syncTheme()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const auth = useAuthStore(pinia)
void auth.bootstrap().finally(() => {
  app.mount('#app')
})
