<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white border border-light">
    <div class="container-fluid">
      <a class="navbar-brand fw-bold textVue" href="#">FilaZen</a>
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
        <h1 class="display-2 fw-bold">Bem-vindo ao <span class="highlight">FilaZen</span></h1>
        <p class="lead">A forma mais justa e eficiente de gerenciar filas de atendimento e aumentar as vendas.</p>
        <button class="btn btn-primary btn-lg mt-4">Saiba Mais</button>
      </div>
    </section>

    <!-- Sobre o sistema -->
    <section class="py-5 text-center">
      <div class="container">
        <h2 class="textVue">Como funciona?</h2>
        <p class="lead">Nosso sistema distribui os atendimentos de maneira justa, garantindo igualdade de oportunidades para todos.</p>
        <div class="row mt-5 d-flex justify-content-center">
          <div class="col-md-4 d-flex">
            <div class="card flex-fill tilt-card">
              <div class="card-body">
                <i class="fas fa-users fa-3x secondaryVue"></i>
                <h4 class="mt-3">Fila Inteligente</h4>
                <p>Atendimentos distribuídos de forma equilibrada entre os vendedores.</p>
              </div>
            </div>
          </div>
          <div class="col-md-4 d-flex">
            <div class="card flex-fill tilt-card">
              <div class="card-body">
                <i class="fas fa-chart-line fa-3x primaryVue"></i>
                <h4 class="mt-3">Histórico de Vendas</h4>
                <p>Acompanhe a performance da equipe com relatórios completos.</p>
              </div>
            </div>
          </div>
          <div class="col-md-4 d-flex">
            <div class="card flex-fill tilt-card">
              <div class="card-body">
                <i class="fas fa-award fa-3x accentVue"></i>
                <h4 class="mt-3">Bonificações</h4>
                <p>Incentivando um ambiente justo para bonificações da equipe.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefícios -->
    <section class="benefits py-5">
      <div class="container text-center">
        <h2 class="textVue">Por que usar o FilaZen?</h2>
        <div class="row mt-5 d-flex justify-content-center">
          <div class="col-md-4 d-flex">
            <div class="card flex-fill tilt-card">
              <div class="card-body">
                <i class="fas fa-clock fa-3x primaryVue"></i>
                <h4 class="mt-3">Otimização de Tempo</h4>
                <p>Reduza o tempo de espera e aumente a produtividade.</p>
              </div>
            </div>
          </div>
          <div class="col-md-4 d-flex">
            <div class="card flex-fill tilt-card">
              <div class="card-body">
                <i class="fas fa-balance-scale fa-3x secondaryVue"></i>
                <h4 class="mt-3">Justiça na Distribuição</h4>
                <p>Garante que todos os vendedores tenham oportunidades iguais.</p>
              </div>
            </div>
          </div>
          <div class="col-md-4 d-flex">
            <div class="card flex-fill tilt-card">
              <div class="card-body">
                <i class="fas fa-laptop fa-3x accentVue"></i>
                <h4 class="mt-3">Acesso Online</h4>
                <p>Plataforma 100% web, acessível de qualquer lugar.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Call to Action -->
    <section class="cta position-relative py-7">
      <div id="particles-js"></div>
      <div class="container text-center position-relative">
        <h2 class="text-white">Pronto para revolucionar sua gestão?</h2>
        <p class="lead text-white">Cadastre-se agora e experimente o <span class="fw-bold">FilaZen</span> gratuitamente.</p>
        <a href="#/register">
          <button class="btn btn-light btn-lg mt-3">Comece Agora</button>
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
  data() {
    return {
      isMenuOpen: false
    };
  },
  methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    }
  },
  mounted() {
    $('.tilt-card').tilt({
      maxTilt: 25,
      speed: 400,
      glare: true,
      maxGlare: 0.5
    });

    particlesJS('particles-js', {
      particles: {
        number: { value: 120, density: { enable: true, value_area: 1000 } },
        color: { value: '#ffffff' },
        shape: { type: 'circle' },
        opacity: { value: 0.5 },
        size: { value: 3, random: true },
        line_linked: {
          enable: true,
          distance: 150,
          color: '#ffffff',
          opacity: 0.4,
          width: 1,
        },
        move: { enable: true, speed: 2 },
      },
      interactivity: {
        events: {
          onhover: { enable: true, mode: 'grab' },
          onclick: { enable: true, mode: 'push' },
        },
      },
      retina_detect: true,
    });
  }
};
</script>

<style scoped>
/* Variáveis Globais */
:root {
  --textVue: #08545e;
  --backgroundVue: #d3dede;
  --primaryVue: #37be81;
  --primaryL: #4bffae;
  --secondaryVue: #1bb2d0;
  --secondaryL: #4ff1ff;
  --secondaryD: #126a7c;
  --accentVue: #7270db;
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, var(--secondaryVue), var(--primaryVue));
  color: white;
  padding: 10rem 0;
}

.highlight {
  background: linear-gradient(135deg, var(--accentVue), var(--secondaryVue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Seção Sobre */
.textVue {
  color: var(--textVue);
}

.primaryVue {
  color: var(--primaryVue);
}

.secondaryVue {
  color: var(--secondaryVue);
}

.accentVue {
  color: var(--accentVue);
}

/* Benefícios */
.benefits {
  background-color: var(--backgroundVue);
}

/* Call to Action */
.cta {
  background: var(--primaryVue);
  padding: 5rem 0;
  position: relative;
  overflow: hidden;
}

#particles-js {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 0;
}

.cta .container {
  position: relative;
  z-index: 1;
}

/* Footer */
.footer {
  background-color: var(--textVue);
  color: white;
}

/* Navbar */
.navbar {
  background-color: var(--primaryL);
}

.navbar-brand {
  font-size: 1.5rem;
}

.textVue {
  color: var(--textVue);
}

/* Botões */
.btn-outline-primaryVue {
  color: var(--primaryVue);
  border: 2px solid var(--primaryVue);
  transition: all 0.3s ease;
}

.btn-outline-primaryVue:hover {
  background: var(--primaryVue);
  color: white;
}

.btn-secondaryVue {
  background: var(--secondaryVue);
  color: white;
  transition: all 0.3s ease;
}

.btn-secondaryVue:hover {
  background: darken(var(--secondaryVue), 10%);
}

.card-body {
  background: linear-gradient(135deg, #0ca577, #086986);
  color: white;
}

/* Tilt Card */
.tilt-card {
  transition: transform 0.2s ease-in-out;
}

/* Increase padding for CTA section */
.py-7 {
  padding-top: 9rem !important;
  padding-bottom: 9rem !important;
}
</style>