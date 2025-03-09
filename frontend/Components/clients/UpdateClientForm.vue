<template>
    <div v-if="clientData" class="modal fade" id="updateClientModal"  tabindex="-1" aria-labelledby="clientModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="clientModalLabel">{{ clientData.id ? 'Editar Cliente' : 'Adicionar Cliente' }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="submitForm">
                        <div class="mb-3">
                            <label for="clientName" class="form-label">Nome Completo</label>
                            <input type="text" class="form-control" id="clientName" v-model="clientData.name" required>
                        </div>
                        <div class="mb-3">
                            <label for="clientEmail" class="form-label">Email</label>
                            <input type="email" class="form-control" id="clientEmail" v-model="clientData.email" required>
                        </div>
                        <div class="mb-3">
                            <label for="clientCpf" class="form-label">CPF</label>
                            <input type="text" class="form-control cpf-mask" id="clientCpf" v-model="clientData.cpf" required>
                        </div>
                        <div class="mb-3">
                            <label for="clientPhones" class="form-label">Telefones</label>
                            <div class="d-flex gap-2">
                                <input type="text" class="form-control phone-mask" v-model="modal.phoneText">
                                <button type="button" class="btn btn-outline-success" @click="addPhone"><i class="fa fa-plus"></i></button>
                            </div>
                            <div v-if="clientData.phones.length != 0" class="input-group mb-2 mt-2">
                                <p class="m-0">Phones List:</p>
                                <ul class="list-group w-100 rounded">
                                    <li v-for="(phone, index) in clientData.phones" :key="index" class="list-group-item">
                                        <div class="d-flex justify-content-between">
                                            <span>Phone: {{ index + 1 }}: {{ phone }}</span>
                                            <button type="button" class="btn btn-sm btn-danger" @click="removePhone(index)"><i class="fa fa-trash"></i></button>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary" @click="submitForm">Salvar</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "CreateClientForm",
    props: {
        clientData: {
            type: Object,
            default: () => ({
                id: null,
                name: '',
                cpf: '',
                email: '',
                phones: [],
            }),
        },
    },
    data() {
        return {
            modal: {
                phoneText: null,
            },
        };
    },
    methods: {
        addPhone() {
            if (this.modal.phoneText == null || this.modal.phoneText == '') {
                return;
            }
            this.clientData.phones.push(this.modal.phoneText);
            this.modal.phoneText = ''; // Clear the input
        },
        removePhone(index) {
            this.clientData.phones.splice(index, 1);
        },
        submitForm() {
            if (this.clientData.id) {
                this.updateClient(this.clientData);
            } else {
                this.addClient(this.clientData);
            }
        },
        async addClient(clientData) {
            const data = await fetch("/backend/controllers/ClientController.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(clientData),
            });

            const response = await data.json();
            console.log(response);
        },
        async updateClient(clientData) {
            const data = await fetch(`/backend/controllers/ClientController.php?id=${clientData.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    client_id: clientData.id,
                    name: clientData.name,
                    cpf: clientData.cpf,
                    email: clientData.email,
                    phones: clientData.phones,
                }),
            });

            const response = await data.json();
            console.log(response);
        }
    },
    mounted() {

        console.log("UpdateClientForm:" + this.clientData);
        // Definindo máscaras
        this.$nextTick(() => {
            const cpfInput = document.querySelectorAll('.cpf-mask');
            cpfInput.forEach(input => {
                IMask(input, { mask: '000.000.000-00' });
            });

            const phoneInputs = document.querySelectorAll('.phone-mask');
            phoneInputs.forEach(input => {
                IMask(input, {
                    mask: [
                        { mask: '(00) 0000-0000' },
                        { mask: '(00) 00000-0000' }
                    ]
                });
            });
        });
    }
};
</script>

