<script>
import CreateClientForm from '../Components/clients/CreateClientForm.vue';
import UpdateClientForm from '../Components/clients/UpdateClientForm.vue';
import TableSkeleton from '../Components/skeleton/TableSkeleton.vue';
export default {
  name: "Clients",
  components: { CreateClientForm, UpdateClientForm, TableSkeleton },
  methods:{
    async fetchClients() {
      try {
        const response = await fetch(`${this.apiUrl}?limit=${this.table.limit}&page=${this.table.page}&search=${this.table.search}`);
        const result = await response.json();
        
        console.log(result);
        this.table.clients = result.clients;
        this.table.totalPages = result.totalPages;
      } catch (error) {
        console.error("Erro ao buscar os dados:", error);
      }
    },
    async changePage(page) {
      if (page < 1 || page > this.table.totalPages) {
        return;
      }
      this.table.page = page;
      await this.fetchClients(this.table.page);
    },
    openUpdateClient(client) {
      this.updateModal.client = client;
      this.$nextTick(() => { // Aguarda o Vue atualizar o DOM
        const modalElement = document.getElementById('updateClientModal');
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        } else {
          console.error("Modal não encontrado no DOM.");
        }
      });
    },
    async deleteClient(client) {
      const confirmation = await Swal.fire({
        title: `Deletar ${client.name}?`,
        text: "Essa ação não pode ser desfeita!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Deletar',
        cancelButtonText: 'Cancelar'
      });

      if (!confirmation.isConfirmed) return;

      try {
        const response = await fetch(`${this.apiUrl}`, {
          method: 'DELETE',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ client_id: client.id }),
        });

        if (!response.ok) {
          throw new Error(`Erro ao deletar: ${response.statusText}`);
        }

        const result = await response.json();

        Swal.fire({
          title: 'Sucesso!',
          text: result.message,
          icon: 'success',
          confirmButtonText: 'OK'
        });

      } catch (error) {
        Swal.fire({
          title: 'Erro!',
          text: error.message || 'Falha ao deletar o cliente.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    }



  },
  computed: {
    pageHasClients() {
      return Array.isArray(this.table.clients) && this.table.clients.length > 0;
    }
  },
  data() {
    return {
      apiUrl: "/backend/controllers/clientController.php",
      table:{
        page: 1,
        limit: 10,
        search: '',
        clients: [],
        perPageOptions: [10, 25, 50, 100, 200],
        totalPages: 0,
      },
      headers: [
        "Nome Completo",
        "CPF",
        "E-mail",
        "Telefones",
        "Histórico de Atendimento",
        "Ações",
      ],
      updateModal:{
        client: null,
      }
    };
  },
  async beforeMount(){
    await this.fetchClients();
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
          <UpdateClientForm :clientData="updateModal.client"></UpdateClientForm>
          <CreateClientForm></CreateClientForm>
        </div>
        <div class="d-flex justify-content-end align-items-center flex-nowrap">
          <select class="btn border rounded me-2" v-model="table.limit" @change="changePage(1)" style="border-color: var(--secondaryVue) !important; color: var(--secondaryVue) !important;">
            <option v-for="option in table.perPageOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
          <button class="btn btn-outline-secondary me-2" @click="changePage(table.page)"><i class="fa fa-rotate-right"></i></button>
          <div class="input-group me-2" style="max-width: 200px;">
            <input type="text" class="form-control" v-model="table.search" placeholder="Buscar...">
            <button class="btn btn-outline-secondary" type="button" id="button-addon2" @click="changePage(table.page)"><i class="fa fa-search"></i></button>
          </div>
          
          <div class="btn-group me-2" role="group" aria-label="First group">
            <button type="button" :disabled="table.page === 1" class="btn btn-outline-secondary"  @click="changePage(1)"><i class="fa-solid fa-angles-left"></i></button>
            <button type="button" :disabled="table.page === 1" class="btn btn-outline-secondary" @click="changePage(table.page - 1)"><i class="fa-solid fa-angle-left"></i></button>
            <div type="text" class="btn btn-outline-secondary">{{ table.page }}</div>
            <button type="button" :disabled="table.page >= table.totalPages" class="btn btn-outline-secondary" @click="changePage(table.page + 1)">
              <i class="fa-solid fa-angle-right"></i>
            </button>
          </div>

        </div>


        <div class="border rounded p-2 mt-2" style="border-color: var(--secondaryVue);">

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
              <tr v-if="!pageHasClients">
                <td colspan="7">
                  <div class="d-flex justify-content-center align-items-center">
                    <span>Nenhum cliente encontrado na página</span>
                  </div>
                </td>
              </tr>
              <tr v-else v-for="(client, index) in table.clients" :key="client.id">
                <td>
                  <span class="bg-secondary fw-bold rounded ps-2 pe-2 text-light">
                    #{{ client.id }}
                  </span>
                </td>
                <td>{{ client.name }}</td>
                <td>{{ client.cpf }}</td>
                <td>{{ client.email }}</td>
                <td>
                  <div v-if="!client.phones.length">
                    <span class="text-danger">Nenhum telefone cadastrado!</span>
                  </div>
                  <ul v-else class="list-group">
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
                  <button class="btn btn-secondary btn-sm rounded me-2" @click="openUpdateClient(client)"><i class="fa-solid fa-pen-to-square"></i></button>
                  <button class="btn btn-danger btn-sm rounded me-2" @click="deleteClient(client)"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="table-footer">
            <small>
              Página {{ table.page }} de {{ table.totalPages }}
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div>
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
