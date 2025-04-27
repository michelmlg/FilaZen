<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white border border-light">
    <div class="container-fluid">
      <img src="/public/assets/FILAZEN-LOGO.svg" alt="Filazen Logo" class="d-inline-block align-middle ms-4 mt-2 mb-2" style="height: 40px; width: auto;">
      <button class="navbar-toggler" type="button" @click="toggleMenu">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" :class="{ 'show': isMenuOpen }" id="navbarNav">
        <div class="ms-auto">
          <a href="#/login" class="btn btn-outline-primaryVue rounded-pill me-2">
            Login
          </a>
          <a href="#/register" class="btn btn-secondaryVue rounded">
            Register
          </a>
        </div>
      </div>
    </div>
  </nav>
    <div>
      <!-- Hero Section - Maior e mais chamativo -->
      <section class="hero">
        <div class="container text-center">
        <h1 class="display-2 fw-bold">Bem-vindo ao <span class="highlight">FilaZen</span>
          <img src="public/assets/favicon.png" alt="Filazen Logo" class="d-inline-block align-middle ms-2" style="height: 100px; width: auto; border-radius: 4px;">
        </h1>
        <p class="lead">A forma mais justa e eficiente de gerenciar filas de atendimento e aumentar as vendas.</p>
        <img src="public/assets/vector-graphics/setup_art.svg" alt="Fila Inteligente" class="itens-art mt-5 d-block mx-auto mb-4">
        <button class="btn btn-primary btn-lg mt-4 saiba-mais-btn">Saiba Mais</button>
        </div>
      </section>
  
      <!-- Sobre o sistema -->
      <section class="py-5 text-center">
      <div class="container">
        <h2 class="textVue mt-4">Como funciona?</h2>
        <p class="lead">Nosso sistema distribui os atendimentos de maneira justa, garantindo igualdade de oportunidades para todos.</p>
        <div class="row mt-5">
          <div class="col-md-4">
            <div class="card tilt-card" data-tilt>
              <img src="public/assets/vector-graphics/analysis_art.svg" alt="Fila Inteligente" class="itens-art">
              <h4 class="mt-3">Fila Inteligente</h4>
              <p>Atendimentos distribuídos de forma equilibrada entre os vendedores.</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card tilt-card" data-tilt>
              <img src="public/assets/vector-graphics/chart_art.svg" alt="Fila Inteligente" class="itens-art">
              <h4 class="mt-3">Histórico de Vendas</h4>
              <p>Acompanhe a performance da equipe com relatórios completos.</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card tilt-card" data-tilt>
              <img src="public/assets/vector-graphics/financial_art.svg" alt="Fila Inteligente" class="itens-art">
              <h4 class="mt-3">Bonificações</h4>
              <p>Incentivando um ambiente justo para bonificações da equipe.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  
      <!-- Benefícios -->
  <section class="benefits py-5">
    <div class="container text-center">
      <h2 class="textVue">Por que usar o FilaZen?</h2>
      <div class="row mt-5">
        <div class="col-md-4">
          <div class="card tilt-card">
            <img src="public/assets/vector-graphics/boxes_art.svg" alt="Fila Inteligente" class="itens-art">
            <h4 class="mt-3">Otimização de Tempo</h4>
            <p>Reduza o tempo de espera e aumente a produtividade.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card tilt-card">
            <img src="public/assets/vector-graphics/queue_art.svg" alt="Fila Inteligente" class="itens-art">
            <h4 class="mt-3">Justiça na Distribuição</h4>
            <p>Garante que todos os vendedores tenham oportunidades iguais.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card tilt-card">
            <img src="public/assets/vector-graphics/responsivity_art.svg" alt="Fila Inteligente" class="itens-art">
            <h4 class="mt-3">Acesso Online</h4>
            <p>Plataforma 100% web, acessível de qualquer lugar.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
  
      <!-- Call to Action -->
      <section class="cta">
        <div class="container text-center">
          <h2 class="text-white">Pronto para revolucionar sua gestão?</h2>
          <p class="lead text-white">Cadastre-se agora e experimente o <span class="fw-bold">FilaZen</span> gratuitamente.</p>
          <a href="#/register">
              <button class="btn btn-light btn-lg mt-3 comece-agora-btn">Comece Agora</button>
          </a>
        </div>
      </section>
  
      <!-- Rodapé -->
      <footer class="footer text-center py-3">
        <p>&copy; 2025 FilaZen. Todos os direitos reservados.</p>
      </footer>
    </div>
  </template>
  
  <script>
  export default {
    name: "FilaZenLanding",
    data(){
        return{
            isMenuOpen: false
        }
    },
    methods: {
      toggleMenu() {
            this.isMenuOpen = !this.isMenuOpen;
      }
    },
    mounted(){      
      $('.tilt-card').tilt({
      reverse: true,
      maxTilt: 12,
      speed: 200,
      glare: true,
      maxGlare: 0.5,
    })
  }
  }
  </script>
  
  <style scoped>
  /* Variáveis Globais */
  /* :root {
    --textVue: #08545e;
    --backgroundVue: #d3dede;
    --primaryVue: #37be81;
    --primaryVueD:#237550;
    --secondaryVue: #1bb2d0;
    --secondaryVueD: #107185;
    --accentVue: #7270db;
  } */
  
  /* Hero Section */
  .hero {
    background: linear-gradient(135deg, var(--bs-secondary), var(--bs-primary));
    color: white;
    padding: 10rem 0;
  }
  
  .highlight {
    color: var(--bs-success);
  }
  
  /* Seção Sobre */
  .textVue {
    color: var(--bs-body-color);
    font-weight: bolder;
    font-size: 40px;
  }
  
  .primaryVue {
    color: var(--bs-primary);
  }
  
  .secondaryVue {
    color: var(--bs-secondary);
  }
  
  .accentVue {
    color: var(--bs-success);
  }
  
  /* Benefícios */
  .benefits {
    background-color: var(--bs-body-bg);
  }
  
  /* Call to Action */
  .cta {
    background: var(--bs-primary);
    padding: 5rem 0;
  }
  
  /* Footer */
  .footer {
    background-color: var(--bs-body-color);
    color: white;
  }

  /* Navbar */
.navbar-brand {
  font-size: 1.5rem;
}

.textVue {
  color: var(--bs-body-color);
}

/* Botões */
.btn-outline-primaryVue {
  color: var(--bs-primary);
  border: 2px solid var(--bs-primary);
  transition: all 0.3s ease;
}

.btn-outline-primaryVue:hover {
  background: var(--bs-primary);
  color: white;
}

.btn-secondaryVue {
  background: var(--bs-secondary);
  color: white;
  transition: all 0.3s ease;
}

.btn-secondaryVue:hover {
  background: darken(var(--bs-secondary), 10%);
}
.card {
  background-color: var(--bs-info) !important;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  text-align: center;
  transition: transform 0.3s ease;
}
.card img {
  max-width: 100%;
  height: auto;
  margin-bottom: 15px;
}
.card img.itens-art {
  max-width: 100%;
  height: auto;
  margin: 0 auto 15px;
  display: block;
}

.card h4 {
  margin-top: 15px;
  font-size: 1.25rem;
}

.card p {
  font-size: 1rem;
  color: #666;
}

.itens-art {
  width: 240px;
}
.saiba-mais-btn {
  background-color: var(--bs-primary);
  border: 2px solid var(--bs-primary);
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  transition: background-color 0.3s ease, color 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.saiba-mais-btn:hover {
  background-color: white;
  color: var(--bs-primary);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

.comece-agora-btn {
  background-color: var(--bs-secondary);
  border: 2px solid var(--bs-secondary);
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  transition: background-color 0.3s ease, color 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.comece-agora-btn:hover {
  background-color: white;
  color: var(--bs-secondary);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

.tilt-card {
  background-color: var(--bs-tertiary-bg) !important;
}


  </style>
  
