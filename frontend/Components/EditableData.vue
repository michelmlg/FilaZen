<template>
  <div>
    <!-- Exibe a data formatada ou campo de edição -->
    <span v-if="!isEditing" @dblclick="startEditing">
      {{ formatDisplayDate(modelValue) }}
    </span>

    <input
      v-if="isEditing"
      type="date"
      v-model="tempValue"
      @blur="saveField"
      class="form-control"
    />
  </div>
</template>
<script>
export default {
  name: 'EditableData',
  props: {
    modelValue: {
      type: String,
      required: true
    },
    field: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      isEditing: false,
      tempValue: ''
    };
  },
  methods: {
    startEditing() {
      this.isEditing = true;

      // Extrai a parte "YYYY-MM-DD" diretamente
      if (this.modelValue && this.modelValue.includes(' ')) {
        this.tempValue = this.modelValue.split(' ')[0];
      } else if (this.modelValue && this.modelValue.includes('T')) {
        this.tempValue = this.modelValue.split('T')[0];
      } else {
        this.tempValue = this.modelValue;
      }
    },
    formatDisplayDate(dateStr) {
      if (!dateStr) return 'Sem data';

      const datePart = dateStr.split(' ')[0]; // '2025-02-27'
      const [year, month, day] = datePart.split('-');

      if (!year || !month || !day) return 'Data inválida';

      return `${day}/${month}/${year}`;
    },
    saveField() {
      this.isEditing = false;
      this.$emit(`save_${this.field}`, this.tempValue);
    },
    cancel() {
      this.isEditing = false;
    }
  }
};
</script>
