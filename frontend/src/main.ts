import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';

import { primeTheme } from './styles/prime-theme';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import './fullcalendar-core.css';
import './fullcalendar-daygrid.css';
import './fullcalendar-timegrid.css';
import './style.css';
import App from './App.vue';

import router from './router';

const pinia = createPinia();
const app = createApp(App);

app.use(PrimeVue, {
  ripple: true,
  theme: primeTheme,
});
app.use(ToastService);
app.use(pinia);
app.use(router);
app.mount('#app');
