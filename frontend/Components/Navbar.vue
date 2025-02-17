<script>
import { onMounted, ref } from "vue";

export default {
  name: "Navbar",
  data() {
    return {
      isMenuOpen: false,
      links: [
        { text: "Minha Fila", url: "/" },
        { text: "Pedidos", url: "#/orders" },
        { text: "Regras", url: "#/rules" },
      ]
    };
  },
  setup() {
    const isAuthenticated = ref(false);
    const userData = ref(null);
    const userStatus = ref("Disponível");
    const isMenuOpen = ref(false);

    const statusOptions = ["Disponível", "Ausente", "Férias", "Ocupado", "Outros"];

    async function checkAuthStatus() {
      try {
        const response = await fetch("/backend/controllers/authController.php", {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include"
        });

        if (!response.ok) throw new Error("Erro ao verificar autenticação");

        const data = await response.json();
        if (data.user) {
          isAuthenticated.value = true;
          userData.value = data.user;
        }
      } catch (error) {
        console.error("Erro na verificação de autenticação:", error);
      }
    }

    function toggleMenu() {
      isMenuOpen.value = !isMenuOpen.value;
    }

    async function logout() {
      isAuthenticated.value = false;
      userData.value = null;

      const response = await fetch("/backend/controllers/authController.php", {
      method: "DELETE",
      headers: {
          "Content-Type": "application/json",
      }
      });

      const data = await response.json(); 

      if(data.status == 'success'){
        console.log(response.status);
        Swal.fire({
            title: "Deslogado",
            text: "Deslogado com sucesso!",
            icon: "success",
        });
      }else{
        Swal.fire({
            title: "Ocorreu um erro",
            text: "Não foi possível deslogar!",
            icon: "error",
        });
      }
    }

    onMounted(() => {
      checkAuthStatus();
    });

    return {
      isAuthenticated,
      userData,
      userStatus,
      isMenuOpen,
      statusOptions,
      toggleMenu,
      logout
    };
  }
};
</script>

<template>
  <nav class="navbar navbar-expand-lg p-4 border border-light">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">FilaZen</a>
      <button class="navbar-toggler" type="button" @click="toggleMenu">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div v-if="isAuthenticated" class="collapse navbar-collapse" :class="{ 'show': isMenuOpen }">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item" v-for="(link, index) in links" :key="index">
            <a class="nav-link" :href="link.url">{{ link.text }}</a>
          </li>
        </ul>

        <!-- Se autenticado, exibe status e dropdown -->
        <div class="d-flex align-items-center">
          <select v-model="userStatus" class="form-select me-3">
            <option v-for="status in statusOptions" :key="status" :value="status">
              {{ status }}
            </option>
          </select>

          <div class="dropdown">
            <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
              <img class="rounded-circle" src="">
              {{ userData?.username }}
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="#/profile">Perfil</a></li>
              <li><a class="dropdown-item" href="#/settings">Configurações</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="#" @click="logout">Sair</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.border-light {
  border-color: var(--textVue);
}
.navbar {
  background-color: var(--backgroundVue);
}
a {
  color: var(--textVue);
}
.navbar-toggler {
  border: none;
}

/* Ajustes para dropdown e select */
.form-select {
  width: auto;
  min-width: 150px;
}
.dropdown-toggle {
  background: none;
  border: none;
}
</style>
