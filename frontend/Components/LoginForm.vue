<template>
  <div class="d-flex flex-column justify-content-center align-items-center min-vh-100">
    <img src="/public/assets/FILAZEN-LOGO.svg" alt="Filazen Logo" style="height: 80px; width: auto; margin-bottom: 4rem;">
    <div class="card shadow-lg" style="max-width: 400px; width: 100%;">
      <div class="card-header text-center" style="background-color: var(--textVue); color: var(--secondaryVue)">
        <h3>Login</h3>
      </div>
      <div class="card-body">
        <form @submit.prevent="loginUser">
          <div class="mb-3">
              <label class="form-label">Selecione a forma de login:</label>
              <select class="form-select" v-model="tipoLogin">
              <option value="username">Usuário</option>
              <option value="email">Email</option>
              </select>
          </div>

          <div v-if="tipoLogin === 'username'" class="mb-3">
              <label class="form-label">Usuário</label>
              <input type="text" v-model="loginData.username" class="form-control" required />
          </div>

          <div v-else class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" v-model="loginData.email" class="form-control" required />
          </div>

          <div class="mb-3 position-relative">
              <label class="form-label">Senha</label>
              <div class="input-group">
                  <input :type="showPassword ? 'text' : 'password'" v-model="loginData.password" class="form-control" required />
                  <button type="button" class="btn-eye" @click="togglePasswordVisibility">
                      <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
              </div>
          </div>

          <button type="submit" class="btn btn-primary w-100">
            <i class="fas fa-sign-in-alt"></i> Entrar
          </button>
        </form>
      </div>
      <div class="card-footer text-center">
        <p class="mb-0">Não tem uma conta? <a href="#/register" class="text-primary">Cadastre-se</a></p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LoginForm",
  data() {
    return {
      loginData: {
        username: "",
        email: "",
        password: "",
      },
      tipoLogin: "username",
      showPassword: false,
    };
  },
  methods: {
      async loginUser() {
          try {
              const method = this.tipoLogin === "email" ? "email" : "username";
              const loginPayload = {
              ...this.loginData,
              method: method,
              };

              const response = await fetch("/backend/controllers/authController.php", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify(loginPayload),
              });

              const result = await response.json();

                  if (result.status === "success") {
                  Swal.fire({
                      title: "Bem-vindo!",
                      text: "Você foi autenticado com sucesso",
                      icon: "success",
                      timer: 1000,
                      timerProgressBar: true,
                      showConfirmButton: false,
                  });
                  window.location.replace("#/dashboard/queue");
                  } else {
                  Swal.fire({
                      title: "Erro",
                      text: "Credenciais inválidas, tente novamente",
                      icon: "error",
                  });
                  }
              } catch (e) {
                  console.error("Erro ao autenticar usuário:", e);
              }
          },
          togglePasswordVisibility() {
              this.showPassword = !this.showPassword;
          }
      }
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
