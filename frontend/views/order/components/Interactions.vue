<template>
    <div class="card shadow-sm mb-4">
        <div class="card-header bg-light">
            <h5 class="mb-0">Interações do pedido</h5>
        </div>
        <div class="card-body bg-secondary rounded-bottom overflow-auto" style="min-height: 60vh; max-height: 80vh;">
            <div v-for="interaction in interactions" :key="interaction.created_at" class="d-flex flex-column mb-3 align-items-end" :class="{
                'align-items-end': interaction.type === 'seller_note'
            }">
                <span class="text-white mb-1 text-start">
                    <i :class="interaction.type === 'customer_message' ? 'fa-solid fa-paper-plane' : 'fa-solid fa-pen'"></i>
                    {{ formatDateTime(interaction.created_at) }}
                </span>
                <div :class="interaction.type === 'customer_message' ? 'alert alert-secondary w-75' : 'alert alert-success w-75'">
                    <span class="fw-bold fs-6">Criado por:</span> {{ getUserName(interaction.created_by) }} <br>
                    <span v-html="interaction.body.replace(/\n/g, '<br>')"></span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        interactions: Array, // Recebe as interações como um array
        users: Array // Lista de usuários para mapear nomes
    },
    methods: {
        formatDateTime(datetime) {
            const date = new Date(datetime);
            return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        },
        getUserName(userId) {
            const user = this.users.find(u => u.id === userId);
            return user ? user.full_name : 'Desconhecido';
        }
    }
}
</script>
