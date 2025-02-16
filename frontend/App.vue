<script>
import Navbar from './Components/Navbar.vue';
export default {
  name: "App",
  components: { Navbar }
};
</script>

<template>
  <main class="main">
    <Navbar></Navbar>
      <router-view></router-view>
  </main>
</template>

<style>
</style>
