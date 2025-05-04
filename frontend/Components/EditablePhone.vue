<template>
    <span v-if="!isEditing" @dblclick="enableEdit" style="cursor: pointer;">
      {{ maskedNumber }}
    </span>
  
    <input
      v-else
      type="text"
      v-model="editableNumber"
      @blur="cancel"
      @keyup.enter="updatePhone"
      class="form-control d-inline-block"
      style="width: auto;"
      :class="{ 'is-valid': success, 'is-invalid': error }"
    />
  </template>
  
  <script>
  export default {
    props: {
      phoneId: {
        type: Number,
        required: true
      },
      phoneNumber: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        editableNumber: this.phoneNumber,
        isEditing: false,
        success: false,
        error: false
      };
    },
    emits: ['updated'],
    computed: {
      // Aplicando a máscara quando estiver mostrando o número
      maskedNumber() {
        return this.$root.aplicarMascaraTelefone(this.phoneNumber);
      }
    },
    methods: {
      enableEdit() {
        this.isEditing = true;
        this.$nextTick(() => {
          // focus automático
          const input = this.$el.querySelector("input");
          if (input) input.focus();
        });
      },
      async updatePhone() {
        this.isEditing = false;
  
        // Remove a máscara antes de enviar
        const numeroSemMascara = this.editableNumber.replace(/\D/g, "");
  
        // Se o número foi alterado, envia a atualização
        if (numeroSemMascara === this.phoneNumber.replace(/\D/g, "")) return;
  
        try {
          const response = await fetch("/backend/controllers/clientController.php", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              action: "updateCellphoneNumber",
              phone_id: this.phoneId,
              phone_number: numeroSemMascara
            })
          });
  
          const data = await response.json();
  
          if (data.status === "success") {
            this.success = true;
            this.error = false;
            this.$emit("updated", {
              id: this.phoneId,
              newNumber: this.editableNumber
            });
            setTimeout(() => (this.success = false), 1500);
          } else {
            throw new Error(data.message);
          }
        } catch (err) {
          console.error("Erro ao atualizar número:", err);
          this.error = true;
          this.success = false;
          setTimeout(() => (this.error = false), 2000);
        }
      }
    }
  };
  </script>
  