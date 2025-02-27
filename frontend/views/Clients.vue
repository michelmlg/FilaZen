<script>
import Navbar from '../Components/Navbar.vue';
export default {
  name: "Clients",
  components: { Navbar },
  data() {
    return {
      datatable: null
    };
  },
  mounted(){
    var tabela = document.getElementById("clients-table");

    if (tabela) {
        this.datatable = new DataTable(tabela, {
            language: {
                url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json"
            },
            responsive: true,  // Responsividade
            paging: true,      // Paginação ativada
            searching: true,   // Campo de busca ativado
            ordering: true     // Ordenação das colunas ativada
        });
    }
  },
  beforeUnmount(){
    if (this.datatable) {
      this.datatable.destroy();
      this.datatable = null;
    }
  }
};
</script>

<template>
  <Navbar></Navbar>

  <div class="d-flex justify-content-center align-items-center mt-4">
    <div class="card shadow-lg" style="width: 100%; margin-right: 4rem; margin-left: 4rem;">
      <div class="card-header text-center" style="background-color: var(--textVue); color: var(--secondaryVue)">
        <h3>Clientes</h3>
      </div>

      <div class="card-body">
        <table id="clients-table" class="table table-striped table-hover">
          <thead>
            <tr>
              <th>#</th>
              <th>Nome Completo</th>
              <th>CPF</th>
              <th>E-mail</th>
              <th>Telefones</th>
              <th>Histórico de Atendimento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span class="bg-secondary fw-bold rounded ps-2 pe-2 text-light">
                    #1
                </span>
              </td>
              <td>Maria Oliveira</td>
              <td>123.456.789-00</td>
              <td>maria@email.com</td>
              <td>(11) 98765-4321</td>
              <td><button class="btn btn-sm btn-outline-secondary rounded">Ver</button></td>
              <td>
                <button class="btn btn-secondary btn-sm rounded me-2"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn btn-danger btn-sm rounded me-2"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>
            <tr>
              <td>
                <span class="bg-secondary fw-bold rounded ps-2 pe-2 text-light">
                    #2
                </span>
              </td>
              <td>Maria Oliveira</td>
              <td>123.456.789-00</td>
              <td>maria@email.com</td>
              <td>(11) 98765-4321</td>
              <td><button class="btn btn-sm btn-outline-secondary rounded">Ver</button></td>
              <td>
                <button class="btn btn-secondary btn-sm rounded me-2"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn btn-danger btn-sm rounded me-2"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
}
.bg-secondary{
    background-color: var(--secondaryVue) !important;
}
.btn-outline-secondary{
    color: var(--secondaryVue) !important;
    border-color: var(--secondaryVue) !important;
    
}
.btn-outline-secondary:hover{
    background-color: var(--secondaryVue) !important;
    color: var(--backgroundVue) !important;
    border-color: var(--secondaryVue) !important;
    
}

.card-header {
  padding: 1.5rem;
}

.card-body {
  padding: 1.5rem;
}

.table th {
  text-align: center;
}

.table td {
  text-align: center;
  vertical-align: middle;
}

.btn-outline-primary {
  border-radius: 10px;
  font-weight: bold;
}
</style>
