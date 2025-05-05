<template>
    <div class="card shadow-sm mb-4 rounded">
      <div class="card-header bg-primary">
        <h5 class="mb-0">Adicionar Interação</h5>
      </div>
      <div class="card-body rounded-bottom">
        <!-- Tabs for Message or Notes -->
        <ul class="nav nav-tabs" id="interactionTabs" role="tablist">
          <li class="nav-item" role="presentation">
            <a class="nav-link active" id="message-tab" data-bs-toggle="tab" href="#message" role="tab"
              aria-controls="message" aria-selected="true">Mensagem</a>
          </li>
          <li class="nav-item" role="presentation">
            <a class="nav-link" id="notes-tab" data-bs-toggle="tab" href="#notes" role="tab" aria-controls="notes"
              aria-selected="false">Notas</a>
          </li>
        </ul>
  
        <div class="tab-content mt-3" id="interactionTabsContent">
          <!-- Message Form -->
          <div class="tab-pane fade show active" id="message" role="tabpanel" aria-labelledby="message-tab">
            <div class="form-group">
              <form @submit.prevent="sendMessage">
                <label for="messageInput" class="form-label">Mensagem</label>
                <textarea id="messageInput" v-model="message" class="form-control" rows="4"
                  placeholder="Digite sua mensagem..."></textarea>
                <button class="btn btn-sm btn-primary mt-2 mb-4">
                  <i class="fa-solid fa-paper-plane"></i> Adicionar Mensagem
                </button>
              </form>
            </div>
          </div>
  
          <!-- Notes Form -->
          <div class="tab-pane fade" id="notes" role="tabpanel" aria-labelledby="notes-tab">
            <div class="form-group">
              <form @submit.prevent="addNote">
                <label for="notesInput" class="form-label">Notas</label>
                <textarea id="notesInput" v-model="note" class="form-control" rows="4"
                  placeholder="Digite suas notas..."></textarea>
                <button class="btn btn-sm btn-primary mt-2 mb-4">
                  <i class="fa-solid fa-pen"></i> Adicionar Nota
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props:{
        id: String,
    },
    data() {
      return {
        message: "",
        note: "",
      };
    },
    methods: {
      sendMessage() {
        if (this.message.trim() === "") return;
        this.$emit("add-interaction", {
          action: "setInteraction",
          type: "customer_message",
          body: this.message,
          order_id: this.id,
        });
        this.message = "";
      },
      addNote() {
        if (this.note.trim() === "") return;
        this.$emit("add-interaction", {
          action: "setInteraction",
          type: "seller_note",
          body: this.note,
          order_id: this.id,
        });
        this.note = "";
      },
    },
  };
  </script>
  