<template>
  <div class="ms-4 me-4 mt-4">
    <div v-if="client">
      <!-- Header com Avatar -->
      <div class="d-flex align-items-center mb-4 p-3 bg-primary text-white rounded shadow">
        <i class="fas fa-user-circle fa-3x me-3"></i>
        <div>
          <h4 class="mb-0">{{ client.name }}</h4>
          <small>Cliente desde {{ formatDate(client.created_at) }}</small>
        </div>
      </div>

      <div class="row">
        <div class="col-md-3">
          <section class="border-end p-2 pe-4 h-100">
            <h5 class="text-secondary border-bottom mb-2"><i class="fa-solid fa-list me-2"></i>Dados do Cliente</h5>
            
            <div class="card p-2">
              <h5 class="card-title text-primary">
                <i class="fa-solid fa-id-card me-2"></i>
                Informações Pessoais
              </h5>
              <div class="card-body p-2">
                <div class="mb-3 d-flex flex-column">
                  <label><strong>Nome</strong></label>
                  <EditableField
                    v-model="client.name"
                    field="name"
                    @save_name="updateField('name', $event)"
                  />
                </div>
                <div class="mb-3 d-flex flex-column">
                  <label><strong>CPF</strong></label>
                  <EditableField
                    v-model="client.cpf"
                    field="cpf"
                    @save_cpf="updateField('cpf', $event)"
                  />
                </div>
              </div>
            </div>
            <div class="card p-2 mt-3">
              <h5 class="card-title text-primary"><i class="fa-solid fa-envelope me-2"></i>Contato</h5>
              <div class="card-body p-2">
                <div class="mb-3 d-flex flex-column">
                  <label><strong>Email:</strong></label>
                  <EditableField
                    v-model="client.email"
                    field="email"
                    @save_email="updateField('email', $event)"
                  />
                </div>
                <div class="mb-3">
                  <label><strong><i class="fa-solid fa-phone me-2"></i>Telefones</strong></label>
                  <ul class="list-group list-group-flush">
                    <li
                      class="list-group-item p-0"
                      v-for="(cellphone, index) in client.cellphone_numbers"
                      :key="index"
                    >
                      <EditablePhone
                        :phoneId="cellphone.id"
                        :phoneNumber="cellphone.number"
                        @updated="onPhoneUpdated"
                      />
                    </li>
                  </ul>
                </div>
              </div>
              
            </div>

            <div class="card p-2 mt-3">
              <h5 class="card-title text-primary"><i class="fa-solid fa-note-sticky me-2"></i>Observações</h5>
              <div class="card-body p-2">
                <textarea
                  class="form-control"
                  rows="4"
                  v-model="client.observations"
                  @change="updateField('observations', client.observations)"
                ></textarea>
                <div class="d-flex justify-content-end mt-2">
                  <async-button
                    icon="fa-solid fa-floppy-disk"
                    :onClick="() => updateField('observations', client.observations)"
                    class="btn btn-primary"
                  />
                </div>
              </div>
            </div>


          </section>
          
          


        </div>
        <div class="col-md-9">
          <ul class="nav nav-tabs" id="clientTab" role="tablist">
            <li class="nav-item" role="presentation">
              <a class="nav-link active" id="orders-tab" data-bs-toggle="tab" href="#orders" role="tab" aria-controls="orders" aria-selected="true"><i class="fa-solid fa-clock-rotate-left me-2"></i>Histórico de Atendimento</a>
            </li>
            <!-- <li class="nav-item" role="presentation">
              <a class="nav-link" id="other-tab" data-bs-toggle="tab" href="#other" role="tab" aria-controls="orders" aria-selected="true">Teste</a>
            </li> -->
          </ul>

          <div class="tab-content pt-2" id="clientTabContent">
            <div class="tab-pane show active mx-2" id="orders" role="tabpanel" aria-labelledby="orders-tab">
      
              <div v-if="orders.length">
                <div class="table-responsive">
                  <table class="table table-hover table-bordered">
                    <thead class="table-light">
                      <tr>
                        <th>#</th>
                        <th><i class="fa-regular fa-calendar me-1"></i> Data</th>
                        <th>Descrição</th>
                        <th><i class="fa-solid fa-clipboard-check me-1"></i> Status</th>
                        <th>Origem</th>
                        <th><i class="fa-solid fa-user-tie me-1"></i> Vendedor</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(order, index) in orders"
                        :key="index"
                        @click="$router.push({ name: 'order', params: { id: order.id } })"
                        style="cursor: pointer;"
                      >
                        <td>
                          <span class="bg-secondary fw-bold rounded ps-2 pe-2 text-light">
                            #{{ order.id }}
                          </span>
                        </td>
                        <td>{{ order.created_at }}</td>
                        <td>{{ order.description || 'Sem descrição' }}</td>
                        <td>
                          <span v-if="order.status_id == 5">
                            <i class="fa-solid fa-circle-check me-1"></i>
                          </span>
                          {{ order.status }}
                        </td>
                        <td>{{ order.origin }}</td>
                        <td>{{ order.employee_name }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="text-muted m-4">Nenhum pedido encontrado.</div>
            </div>

            <!-- <div class="tab-content pt-2" id="clientTabContent">
              <div class="tab-pane mx-2" id="other" role="tabpanel" aria-labelledby="other-tab">
                <div>
               
                </div>
              </div>
            </div> -->
       
        </div>
        </div>
      </div>

    </div>
    <div v-else class="text-center mt-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-3">Carregando dados do cliente...</p>
    </div>
  </div>
</template>


<script>
import AsyncButton from '../../Components/AsyncButton.vue';
import EditableField from '../../Components/EditableField.vue';
import EditableData from '../../Components/EditableData.vue';
import EditablePhone from '../../Components/EditablePhone.vue';

export default {
  name: 'ClientProfile',
  components: {
    AsyncButton,
    EditableField,
    EditableData,
    EditablePhone
  },
  data() {
    return {
      client: null,
      orders: [],
      isEditingName: false,
      tempName: ''
    };
  },
  mounted() {
    const id = this.$route.params.id;
    this.loadClient(id);
  },
  methods: {
    async loadClient(id) {
      try {
        const response = await fetch(`backend/controllers/clientController.php?client-id=${id}&order-history=true`);
        if (!response.ok) throw new Error('Failed to load client data');

        const data = await response.json();
        if (data.status === 'success') {
          this.client = data.client;
          this.orders = data.orders;
        } else {
          this.client = null;
        }
      } catch (error) {
        console.error(error);
        this.client = null;
      }
    },
    startEditing(field) {
      this.isEditingName = true;
      this.tempName = this.client[field];
    },
    async updateField(field, value) {
      console.log(`Updating field ${field} with value ${value}`);
      const id = this.$route.params.id;
      const response = await fetch(`backend/controllers/clientController.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'updateField',
          client_id: id,
          field: field,
          value: value
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        this.client[field] = value;
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: `Campo ${field} atualizado com sucesso!`,
          toast: true,
          position: 'bottom-right',
          showConfirmButton: false,
          timer: 3000
        });
      } else {
        console.error('Failed to update field:', data.message);
      }
    },
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    onPhoneUpdated({ id, newNumber }) {
      const phone = this.client.cellphone_numbers.find(p => p.id === id);
      if (phone) phone.number = newNumber;

      Swal.fire({
          icon: 'success',
          title: 'Success',
          text: `Telefone atualizado com sucesso!`,
          toast: true,
          position: 'bottom-right',
          showConfirmButton: false,
          timer: 3000
        });
      console.log("Telefone atualizado localmente:", id, newNumber);
    }
  }
};
</script>

<style scoped>
/* Adicione estilo para inputs editáveis ou outras personalizações */
</style>
