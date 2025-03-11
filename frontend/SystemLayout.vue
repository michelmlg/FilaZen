<script>
import Navbar from './Components/Navbar.vue';
export default {
  name: "SystemLayout",
  components: { Navbar }
};
</script>

<template>
    <Navbar></Navbar>
    <div>
      <router-view></router-view>
    </div>
</template>

<style>
  :root{
    --textVue: #08545e;
    --backgroundVue: #d3dede;
    --primaryVue: #37be81;
    --secondaryVue: #1bb2d0;
    --accentVue: #7270db;
  }

  body{
    font-family: "Nunito", serif;
    background-color: var(--backgroundVue);
    color: var(--textVue);
  }


</style>
