<script>
import ClientForm from '../Components/clients/ClientForm.vue';
import TableSkeleton from '../Components/skeleton/TableSkeleton.vue';
export default {
  name: "Clients",
  components: { ClientForm, TableSkeleton },
  methods:{
    async fetchClients() {
      try {
        const response = await fetch("/backend/controllers/clientController.php");
        const data = await response.json();
        this.clients = data.clients;
        console.log(data);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      }
    },
  },
  data() {
    return {
      datatable: null,
      clients: [],
      headers: [
        "Nome Completo",
        "CPF",
        "E-mail",
        "Telefones",
        "Histórico de Atendimento",
        "Ações",
      ],
    };
  },
  async mounted(){
    await this.fetchClients();
    // var tabela = document.getElementById("clients-table");

    // if (tabela) {
    //     this.datatable = new DataTable(tabela, {
    //         language: {
    //             url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json"
    //         },
    //         responsive: true,  // Responsividade
    //         paging: true,      // Paginação ativada
    //         searching: true,   // Campo de busca ativado
    //         ordering: true     // Ordenação das colunas ativada
    //     });
    // }
  },
  beforeUnmount(){
    // if (this.datatable) {
    //   this.datatable.destroy();
    //   this.datatable = null;
    // }
  }
};
</script>

<template>
  <div class="d-flex justify-content-center align-items-center mt-4">
    <div class="card shadow-lg" style="width: 100%; margin-right: 4rem; margin-left: 4rem;">
      <div class="card-header text-center" style="background-color: var(--textVue); color: var(--secondaryVue)">
        <h3>Clientes</h3>
      </div>
      
      <div class="card-body">
        
        <div class="mb-4">
          <ClientForm></ClientForm>
        </div>

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
            <tr v-for="(client, index) in clients" :key="client.id">
              <td>
                <span class="bg-secondary fw-bold rounded ps-2 pe-2 text-light">
                  #{{ index + 1 }}
                </span>
              </td>
              <td>{{ client.name }}</td>
              <td>{{ client.cpf }}</td>
              <td>{{ client.email }}</td>
              <td>
                <ul class="list-group">
                  <li v-for="(phone, index) in client.phones" :key="index" class="list-group-item">
                    {{ phone }}
                  </li>
                </ul>
              </td>
              <td>
                <div>
                  <button class="btn btn-sm btn-outline-secondary rounded mb-2">Ver</button>
                  <div>
                    <span>Cliente Desde: </span>{{ client.created_at }}
                  </div>
                </div>
              </td>
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
  <div>
    <TableSkeleton apiUrl="/backend/controllers/clientController.php" :headers="headers"></TableSkeleton>
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
