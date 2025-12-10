import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';

import { primeTheme } from './styles/prime-theme';
import 'primeicons/primeicons.css';
import './fullcalendar-core.css';
import './fullcalendar-daygrid.css';
import './fullcalendar-timegrid.css';
import './styles/main.css';
import App from './App.vue';

import router from './router';

const pinia = createPinia();
const app = createApp(App);

app.use(PrimeVue, {
  ripple: true,
  theme: primeTheme,
});
app.use(ToastService);
app.directive('tooltip', Tooltip);
app.use(pinia);
app.use(router);
app.mount('#app');
