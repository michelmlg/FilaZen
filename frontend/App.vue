<script>
import Navbar from './Components/Navbar.vue';
export default {
  name: "App",
  components: { Navbar }
};
</script>

<template>
    <Navbar></Navbar>
    <div class="container mt-4">
      <router-view></router-view>
    </div>
</template>

<style>

</style>
