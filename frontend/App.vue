<script>
export default {
  name: "App",
  data(){
    return{
      session: null
    }
  },
  methods:{
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
        if (data.authenticated != false) {
          this.session = data.user_session;
        }else{
          this.session = data.authenticated;
        }
      } catch (error) {
        console.error("Erro na verificação de autenticação:", error);
      }
    },
  },
  async mounted(){
    await this.checkAuth();

    setInterval( async () => {
      await this.checkAuth();
    }, 60000);
  }
};
</script>

<template>
    <main>
      <router-view></router-view>
    </main>
</template>

<style>
:root,
[data-bs-theme=light] {
  /* Cores principais */
  --bs-primary: #37be81 !important;
  --bs-secondary: #1bb2d0 !important;
  --bs-success: #7270db !important;
  --bs-info: #107185 !important;
  --bs-danger: #dc3545 !important;
  --bs-warning: #ffc107 !important;
  --bs-light: #f8f9fa !important;
  --bs-dark: #08545e !important;

  /* RGBs */
  --bs-primary-rgb: 55, 190, 129 !important;
  --bs-secondary-rgb: 27, 178, 208 !important;
  --bs-success-rgb: 114, 112, 219 !important;
  --bs-info-rgb: 27, 178, 208 !important;
  --bs-danger-rgb: 220, 53, 69 !important;
  --bs-warning-rgb: 255, 193, 7 !important;
  --bs-dark-rgb: 8, 84, 94 !important;

  /* Textos */
  --bs-body-color: #08545e !important;
  --bs-link-color: #37be81 !important;
  --bs-link-hover-color: #2e9c69 !important;
  --bs-heading-color: #08545e !important;

  /* Fundos */
  --bs-body-bg: #d3dede !important;
  --bs-secondary-bg: #edf5f7 !important;
  --bs-tertiary-bg: #f0f5f5 !important;

  /* Emphasis */
  --bs-primary-text-emphasis: #1f6f4c !important;
  --bs-secondary-text-emphasis: #0e788c !important;
  --bs-success-text-emphasis: #3936a1 !important;

  /* BG subtle */
  --bs-primary-bg-subtle: #c8eddc !important;
  --bs-secondary-bg-subtle: #c3f0f9 !important;
  --bs-success-bg-subtle: #dbdaff !important;
  --bs-bg-subtle: #ececeb !important;

  /* Border subtle */
  --bs-primary-border-subtle: #88d8b6 !important;
  --bs-secondary-border-subtle: #8bdcec !important;
  --bs-success-border-subtle: #a7a6f5 !important;
  --bs-border-subtle: #d6f7e9 !important;

  /* Outline */
  --bs-focus-ring-color: rgba(55, 190, 129, 0.4) !important;
  --bs-border-color: #b6dce4 !important;
  --bs-border-radius: 0.5rem !important;

  /* Shadows e rings */
  --bs-box-shadow: 0 0.5rem 1rem rgba(55, 190, 129, 0.15) !important;
  --bs-box-shadow-sm: 0 0.125rem 0.25rem rgba(55, 190, 129, 0.1) !important;
  --bs-box-shadow-lg: 0 1rem 3rem rgba(55, 190, 129, 0.2) !important;

  /* Botões */
  --bs-btn-focus-shadow-rgb: 55, 190, 129 !important;
  --bs-btn-border-color: #37be81 !important;

  /* Color Hovers */
  --bs-primary-hover: #2e9c69;
  --bs-secondary-hover: #1598b3;
  --bs-success-hover: #5c5adb;
  --bs-info-hover: #0a5d6c;
  --bs-danger-hover: #b02a37;
  --bs-warning-hover: #e0a800;
  --bs-dark-hover: #063f48;

  /* Forms */
  --bs-form-valid-color: #37be81 !important;
  --bs-form-valid-border-color: #37be81 !important;
  --bs-form-invalid-color: #dc3545 !important;
  --bs-form-invalid-border-color: #dc3545 !important;
}


  /* :root{
    --textVue: #08545e;
    --backgroundVue: #d3dede;
    --primaryVue: #37be81;
    --secondaryVue: #1bb2d0;
    --accentVue: #7270db;
  }
*/
  body{
    font-family: "Nunito", serif;
    /* background-color: var(--backgroundVue);
    color: var(--textVue); */
  } 

  .form-select{
    background-color: var(--bs-tertiary-bg);
  }
  .form-control{
    background-color: var(--bs-tertiary-bg);
  }

  .table {
    background-color: var(--bs-body-bg) !important;
  }

  .table thead th {
    background-color: var(--bs-light) !important;
  }

  .table-striped tbody tr:nth-of-type(odd) td {
    background-color: var(--bs-secondary-bg) !important;
  }

  .table-striped tbody tr:nth-of-type(even) td {
    background-color: var(--bs-tertiary-bg) !important;
  }

  .table-striped tbody tr:hover td {
    background-color: var(--bs-bg-subtle) !important;
    transition: background-color 0.3s ease;
  }

  .btn-primary {
    background-color: var(--bs-primary) !important;
    border-color: var(--bs-primary) !important;
  }
  .btn-primary:hover {
    background-color: var(--bs-primary-hover) !important;
    border-color: var(--bs-primary-hover) !important;
  }
  .btn-secondary {
    background-color: var(--bs-secondary) !important;
    border-color: var(--bs-secondary) !important;
  }
  .btn-secondary:hover {
    background-color: var(--bs-secondary-hover) !important;
    border-color: var(--bs-secondary-hover) !important;
  }
  .btn-success {
    background-color: var(--bs-success) !important;
    border-color: var(--bs-success) !important;
  }
  .btn-success:hover {
    background-color: var(--bs-success-hover) !important;
    border-color: var(--bs-success-hover) !important;
  }
  .btn-danger {
    background-color: var(--bs-danger) !important;
    border-color: var(--bs-danger) !important;
  }
  .btn-danger:hover {
    background-color: var(--bs-danger-hover) !important;
    border-color: var(--bs-danger-hover) !important;
  }
  .btn-warning {
    background-color: var(--bs-warning) !important;
    border-color: var(--bs-warning) !important;
  }
  .btn-warning:hover {
    background-color: var(--bs-warning-hover) !important;
    border-color: var(--bs-warning-hover) !important;
  }
  .btn-info {
    background-color: var(--bs-info) !important;
    border-color: var(--bs-info) !important;
  }
  .btn-info:hover {
    background-color: var(--bs-info-hover) !important;
    border-color: var(--bs-info-hover) !important;
  }
  .btn-light {
    background-color: var(--bs-light) !important;
    border-color: var(--bs-light) !important;
  }
  .btn-light:hover {
    background-color: var(--bs-light-hover) !important;
    border-color: var(--bs-light-hover) !important;
  }
  .btn-dark {
    background-color: var(--bs-dark) !important;
    border-color: var(--bs-dark) !important;
  }
  .btn-dark:hover {
    background-color: var(--bs-dark-hover) !important;
    border-color: var(--bs-dark-hover) !important;
  }
  .btn-link {
    color: var(--bs-link-color) !important;
  }
  .btn-link:hover {
    color: var(--bs-link-hover-color) !important;
  }
  .btn-outline-primary {
    color: var(--bs-primary) !important;
    border-color: var(--bs-primary) !important;
  }
  .btn-outline-primary:hover {
    background-color: var(--bs-primary) !important;
    color: var(--bs-body-bg) !important;
  }
  .btn-outline-secondary {
    color: var(--bs-secondary) !important;
    border-color: var(--bs-secondary) !important;
  }
  .btn-outline-secondary:hover {
    background-color: var(--bs-secondary) !important;
    color: var(--bs-body-bg) !important;
  }
  .btn-outline-success {
    color: var(--bs-success) !important;
    border-color: var(--bs-success) !important;
  }
  .btn-outline-success:hover {
    background-color: var(--bs-success) !important;
    color: var(--bs-body-bg) !important;
  }
  .btn-outline-danger {
    color: var(--bs-danger) !important;
    border-color: var(--bs-danger) !important;
  }
  .btn-outline-danger:hover {
    background-color: var(--bs-danger) !important;
    color: var(--bs-body-bg) !important;
  }
  .btn-outline-warning {
    color: var(--bs-warning) !important;
    border-color: var(--bs-warning) !important;
  }
  .btn-outline-warning:hover {
    background-color: var(--bs-warning) !important;
    color: var(--bs-body-bg) !important;
  }
  .btn-outline-info {
    color: var(--bs-info) !important;
    border-color: var(--bs-info) !important;
  }
  .btn-outline-info:hover {
    background-color: var(--bs-info) !important;
    color: var(--bs-body-bg) !important;
  }


</style>
