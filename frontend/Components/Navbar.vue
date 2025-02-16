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
  <nav class="navbar navbar-expand-lg navbar-light">
    <div class="container-fluid m-2">
      <a class="navbar-brand" href="#"><img src="/public/assets/images/logo-filazen-text.png"></img></a>
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
.navbar-toggler {
  border: none;
}
.navbar {
  background: linear-gradient(135deg, var(--primaryL), var(--secondaryL));
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center; /* Centraliza todo o conteúdo da navbar */
}

.container-fluid {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.navbar-brand img {
  max-width: 6rem;
  height: auto;
}

@media (max-width: 768px) {
  .navbar-brand img {
    max-width: 120px; /* Reduz a logo em telas menores */
  }
}

.navbar ul {
  list-style: none;
  display: flex;
  flex-grow: 1;
}

.navbar ul li {
  display: inline;
}

.navbar ul li a {
  text-decoration: none;
  color: #08545e;
  transition: color 0.3s;
}

.navbar ul li a:hover,
.navbar ul li a.active {
  color: #7270db;
  border-bottom: 2px solid #1bb2d0;
  padding-bottom: 5px;
}

</style>
