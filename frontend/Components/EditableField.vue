<template>
    <span v-if="!isEditing" @dblclick="startEditing">
      {{ modelValue || 'N/A' }}
    </span>
    <input
      v-else
      v-model="tempValue"
      @blur="cancel"
      @keyup.enter="save"
      class="form-control"
      :placeholder="placeholder"
      ref="inputRef"
    />
  </template>
  
  <script>
  export default {
    name: 'EditableField',
    props: {
      modelValue: {
        type: String,
        default: ''
      },
      placeholder: {
        type: String,
        default: ''
      },
      field: {
      type: String,
      required: true
    }
    },
    data() {
      return {
        isEditing: false,
        tempValue: this.modelValue
      }
    },
    watch: {
      modelValue(newVal) {
        if (!this.isEditing) {
          this.tempValue = newVal
        }
      }
    },
    methods: {
      startEditing() {
        this.tempValue = this.modelValue
        this.isEditing = true
        this.$nextTick(() => {
          this.$refs.inputRef.focus()
        })
      },
      save() {
        this.$emit(`save_${this.field}`, this.tempValue);
        console.log(`Emit Event: save_${this.field}`, this.tempValue)
        this.isEditing = false
      },
      cancel() {
        this.isEditing = false
      }
    }
  }
  </script>
  
  <style scoped>
  span {
    cursor: pointer;
  }
  </style>
  