<template>
  <div class="d-flex flex-column justify-content-center align-items-center min-vh-100">
    <img src="/public/assets/FILAZEN-LOGO.svg" alt="Filazen Logo" style="height: 80px; width: auto; margin-bottom: 6rem;">
    <!-- Card de Registro -->
    <div class="card shadow-lg" style="max-width: 400px; width: 100%;">
      <div class="card-header text-center" style="background-color: var(--textVue); color: var(--secondaryVue)">
        <!-- Logo -->
        <img src="" alt="" class="mb-3" style="max-height: 80px;">
        <h3>Registro</h3>
      </div>
      <div class="card-body">
        <form @submit.prevent="registerUser">
          <div class="mb-3">
            <label class="form-label">Usuário</label>
            <input type="text" v-model="newUser.username" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" v-model="newUser.email" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Nome Completo</label>
            <input type="text" v-model="newUser.full_name" class="form-control" required />
          </div>
          <div class="mb-3 position-relative">
              <label class="form-label">Senha</label>
              <div class="input-group">
                  <input :type="showPassword ? 'text' : 'password'" v-model="newUser.password" class="form-control" required />
                  <button type="button form-control" class="btn-eye" @click="togglePasswordVisibility">
                      <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
              </div>
          </div>
          <button type="submit" class="btn btn-primary w-100">
            <i class="fas fa-user-plus"></i> Registrar
          </button>
        </form>
      </div>
      <div class="card-footer text-center">
        <p class="mb-0">Já tem uma conta? <a href="#/login" class="text-primary">Faça login</a></p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "RegisterForm",
  data() {
    return {
      newUser: {
        username: "",
        email: "",
        full_name: "",
        password: "",
      },
      users: [],
      showPassword: false,
    };
  },
  methods: {
    async registerUser() {
      try {
        const response = await fetch("/backend/controllers/userController.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(this.newUser),
        });

        const result = await response.json();

        if (result.status === 'success') {
          Swal.fire({
            title: "Registrado!",
            text: "Você foi registrado com sucesso",
            icon: "success"
          });
          window.location.replace('#/login');
        } else {
          Swal.fire({
            title: "Erro",
            text: "Ocorreu um erro ao registrar",
            icon: "error"
          });
        }
      } catch (e) {
        console.error("Erro ao registrar usuário:", e);
      }

      // Limpa os campos após envio
      this.newUser.username = "";
      this.newUser.full_name = "";
      this.newUser.password = "";
    },
    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    },
  },
};
</script>

<style scoped>
.card {
  border-radius: 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
}

label {
  color: var(--textVue);
}

.card-header {
  padding: 2rem;
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  background-color: var(--background);
  border-top: 1px solid var(--accent);
  padding: 1rem;
}

form .form-control {
  border-radius: 10px !important;
}

.btn {
  font-size: 16px;
  font-weight: bold;
  padding: 0.75rem;
}

.btn-primary {
  color: var(--textVue);
  background-color: var(--primaryVue);
  border-color: var(--primaryVue);
}

.text-primary {
  color: var(--primaryVue) !important;
}

.text-primary:hover {
  color: var(--primaryVue) !important;
}

.btn-eye {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}
</style>
