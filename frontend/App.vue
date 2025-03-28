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
