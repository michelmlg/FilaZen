<template>
    <button
      :type="type"
      :class="['btn', variantClass, { disabled: isLoading }]"
      @click="handleClick"
      :disabled="isLoading || disabled"
    >
      <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      <div class="text-wrapper" v-else>
        <i v-if="icon" :class="icon"></i>
        <span v-if="text">{{ text }}</span>
      </div>
    </button>
  </template>
  
  <script>
  export default {
    name: 'AsyncButton',
    props: {
      text: {
        type: String,
      },
      variant: {
        type: String,
        default: 'primary'
      },
      type: {
        type: String,
        default: 'button'
      },
      disabled: {
        type: Boolean,
        default: false
      },
      onClick: {
        type: Function,
        required: true
      },
      icon: {
        type: String,
        default: null
      },
    },
    data() {
      return {
        isLoading: false
      }
    },
    computed: {
      variantClass() {
        return `btn-${this.variant}`
      }
    },
    methods: {
      async handleClick() {
        if (this.isLoading) return
        this.isLoading = true
        try {
          await this.onClick()
        } catch (err) {
          console.error('AsyncButton error:', err)
        } finally {
          this.isLoading = false
        }
      }
    }
  }
  </script>