<script>
import Navbar from '../Components/Navbar.vue';
export default {
  name: "SystemLayout",
  components: { Navbar },
  methods: {
    
  }
};
</script>

<template>
    <Navbar></Navbar>
    <div>
      <router-view></router-view>
    </div>
</template>
