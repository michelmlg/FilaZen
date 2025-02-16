<script>
export default {
    name: "Navbar",
  data() {
    return {
      isMenuOpen: false,
      links: [
        { text: "Fila", url: "/" },
        { text: "Pedidos", url: "#/orders" },
        { text: "Regras", url: "#/rules" },
      ]
    };
  },
  methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    }
  }
};
</script>

<template>
  <nav class="navbar navbar-expand-lg p-4 border border-light">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">FilaZen</a>
      <button 
        class="navbar-toggler" 
        type="button" 
        @click="toggleMenu"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      
      <div class="collapse navbar-collapse" :class="{ 'show': isMenuOpen }">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item" v-for="(link, index) in links" :key="index">
            <a class="nav-link" :href="link.url">{{ link.text }}</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.border-light{
  border-color: var(--textVue);
}
.navbar{
  background-color: var(--backgroundVue);
}
a{
  color: var(--textVue)
}

.navbar-toggler {
  border: none;
}
</style>
