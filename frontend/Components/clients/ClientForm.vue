<template>
    <div>
        <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#clientModal" aria-label="Abrir Modal de Cliente">
            <i class="fa fa-plus"></i>
        </button>
    </div>

    <div class="modal fade" id="clientModal" tabindex="-1" aria-labelledby="clientModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="clientModalLabel">Adicionar Cliente</h5>
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
                            <input type="text" class="form-control" id="clientCpf" v-model="clientData.cpf" required>
                        </div>
                        <div class="mb-3">
                            <label for="clientPhones" class="form-label">Telefones</label>
                            <div class="d-flex gap-2">
                                <input type="text" class="form-control" v-model="modal.phoneText">
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
export default{
    name: "ClientForm",
    data(){
        return{
            modal:{
                phoneText: null,
            },
            clientData:{
                name: '',
                email: '',
                phones: [],
                cpf: '',	
            }
        }
    },
    methods:{
        addPhone(){
            if(this.modal.phoneText == null || this.modal.phoneText == ''){
                return;
            }
            this.clientData.phones.push(this.modal.phoneText);
            this.newPhone = '';
        },
        removePhone(index){
            this.clientData.phones.splice(index, 1);
        },
        submitForm(){
            console.log("Requisição enviada: " + this.clientData);
            
            this.addClient(this.clientData);
        },
        async addClient(clientData){
            const data = await fetch("/backend/controllers/ClientController.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(clientData),
            });

            const response = await data.json();

            console.log(response);
        }

    }


}


</script>