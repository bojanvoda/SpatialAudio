<template>
  <div id="app">
      <!--<router-link to="/">Scene</router-link>
      <router-link to="/img01">PhotoGallery</router-link>
      <router-link to="/img02">PhotoGallery</router-link>
      <router-link to="/img03">PhotoGallery</router-link>
      <router-link to="/img04">PhotoGallery</router-link>
      <router-link to="/img05">PhotoGallery</router-link> -->
    <router-view/>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
