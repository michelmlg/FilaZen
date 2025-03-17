<template>
    <div class="container-fluid">
      <div class="d-flex justify-content-center align-items-center" style="height: 100vh; gap: 2rem;">
        
        <!-- Metade direita com a arte SVG -->
        <div class="art-container" style="flex: 1; display: flex; justify-content: center; align-items: center;">
          <img src="/public/assets/vector-graphics/setup_art.svg" alt="Arte de Configuração" class="img-fluid art-svg" />
        </div>
  
        <!-- Metade esquerda com a mensagem -->
        <div class="d-flex flex-column justify-content-center align-items-center" style="flex: 1;">
          <!-- Logo centralizada -->
          <img class="align-self-center" src="/public/assets/FILAZEN-LOGO.svg" alt="Filazen Logo" style="height: 80px; width: auto; margin-bottom: 2rem;"/>
  
          <!-- Card com mensagem -->
          <div class="message-container" style="background-color: #ffffff; border-radius: 20px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); padding: 2rem; width: 100%; max-width: 500px;">
            <h3 class="mb-3 text-center">Confirmação de E-mail</h3>
            <p class="text-center mb-4" style="font-size: 1.1rem; color: #555;">Parabéns! Seu e-mail foi validado com sucesso!</p>
            <p class="text-center mb-4" style="font-size: 1rem; color: #777;">Agora você pode fazer login e acessar sua conta de forma segura.</p>
            <a href="#/login" class="btn btn-primary btn-lg w-100">Voltar para o Login</a>
          </div>
        </div>
  
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "ConfirmationPage",
  };
  </script>
  
  <style scoped>
  .container-fluid {
    background-color: #f3f6f9;
    height: 100vh;
  }
  
  .art-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 800px;
    flex: 1;
  }
  
  .art-svg {
    width: 100%;
    max-width: 800px;
    animation: fadeIn 1s ease-out;
  }
  
  .message-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #ffffff;
    border-radius: 20px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    padding: 2rem;
  }
  
  h3 {
    font-size: 2rem;
    font-weight: bold;
    color: #08545e;
  }
  
  p {
    font-size: 1.1rem;
    color: #555;
  }
  
  .btn-primary {
    color: #fff;
    background-color: #37be81;
    border-color: #37be81;
    font-weight: bold;
    padding: 1rem;
    border-radius: 25px;
    transition: background-color 0.3s;
  }
  
  .btn-primary:hover {
    background-color: #2c9c66;
    border-color: #2c9c66;
  }
  
  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  
  </style>
  