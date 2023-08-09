import Vue from 'vue'
import App from './App.vue'
import router from './router'
//import BootstrapVue from "bootstrap-vue";
//import "bootstrap/dist/css/bootstrap.css";
//import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.config.productionTip = false
// eslint-disable-next-line no-use-before-define
//Vue.use(BootstrapVue)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
