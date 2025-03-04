<script>
export default {
  name: "Navbar",
  data() {
    return {
      isAuthenticated: false,
      userData: null,
      isMenuOpen: false,
      statusOptions: [],
      userStatus: null,
      links: [
        { text: "Minha Fila", url: "#/dashboard/queue" },
        { text: "Pedidos", url: "#/dashboard/orders" },
        { text: "Clientes", url: "#/dashboard/clients" },
        { text: "Regras", url: "#/dashboard/rules" },
      ],
    };
  },
  methods: {
    async checkAuth() {
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
        console.log(data);
        if (data.user_session) {
          this.isAuthenticated = true;
          this.userData = data.user_session;
        }
      } catch (error) {
        console.error("Erro na verificação de autenticação:", error);
      }
    },
    async getUserStatus() {

      try {
        const response = await fetch('/backend/controllers/statusController.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: "include",
          body: JSON.stringify({ id: this.userData.id })
        });

        const data = await response.json();

        if (data.status === 'success') {
          this.userStatus = data.id_status;
          console.log("User status: " + this.userStatus);
        } else {
          console.log(data.status);
        }
      } catch (error) {
        console.error('Erro na requisição:', error);
      }
    },
    async getAllStatus(){
      try {
        const response = await fetch('/backend/controllers/statusController.php', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.status === 'success') {
          this.statusOptions = data.status_list;
          console.log("Status Options: " + data);
        }
      } catch (error) {
        console.error('Erro na requisição:', error);
      }
    },
    async updateUserStatus() {
      if (!this.userData) return;

      try {
        const response = await fetch('/backend/controllers/statusController.php', {
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' },
          credentials: "include",
          body: JSON.stringify({
            id: this.userData.id,
            new_status: this.userStatus
          })
        });

        const data = await response.json();

        console.log("updateUserStatus: " + data);

        if (data.status === 'success') {
          console.log("Status atualizado com sucesso!");
        } else {
          console.error("Erro ao atualizar status:", data.message);
        }
      } catch (error) {
        console.error("Erro na requisição update:", error);
      }
    },
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
    async logout() {
      this.isAuthenticated = false;
      this.userData = null;

      try {
        const response = await fetch("/backend/controllers/authController.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" }
        });

        const data = await response.json();

        if (data.status == 'success') {
          Swal.fire({
            title: "Deslogado",
            text: "Deslogado com sucesso!",
            icon: "success",
          });
          this.$router.push('/');
        } else {
          Swal.fire({
            title: "Ocorreu um erro",
            text: "Não foi possível deslogar!",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("Erro ao deslogar:", error);
      }
    }
  },
  watch: {
    userStatus(newStatus, oldStatus) {
      if (newStatus !== oldStatus) {
        this.updateUserStatus();
      }
    }
  },
  async mounted() {
    await this.checkAuth();
    await this.getUserStatus();
    await this.getAllStatus();
    console.log(this.userData);
  }
};
</script>


<template>
  <nav class="navbar navbar-expand-lg p-2 border border-light">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">
        <img src="/public/assets/FILAZEN-LOGO.svg" alt="Filazen Logo" class="d-inline-block align-middle ms-4 mt-2 mb-2" style="height: 30px; width: auto;">
      </a>
      <button class="navbar-toggler" type="button" @click="toggleMenu">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div v-if="isAuthenticated" class="collapse navbar-collapse " :class="{ 'show': isMenuOpen }">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item" v-for="(link, index) in links" :key="index">
            <a class="nav-link" :href="link.url">{{ link.text }}</a>
          </li>
        </ul>

        <!-- Se autenticado, exibe status e dropdown -->
        <div class="d-flex align-items-center">
          <select v-model="userStatus" class="form-select me-3">
            <option v-for="status in statusOptions" :key="status" :value="status.id">
              {{ status.name }}
            </option>
          </select>

          <div class="dropdown">
            <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
              <img class="rounded-circle me-2" :src="userData?.img_path" alt="Avatar" style="height: 40px; width: 40px;">
              <span class="username">{{ userData?.username }}</span>
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
.username {
  color: var(--textVue);
  font-weight: bold;
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
