import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useTheme } from './composables/useTheme'
import './styles/globals.css'

const { syncTheme } = useTheme()
syncTheme()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')
