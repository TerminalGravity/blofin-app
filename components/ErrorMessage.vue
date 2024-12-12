<template>
  <div v-if="message" class="error-message" :class="{ dismissible }">
    <div class="error-content">
      <i class="error-icon">⚠️</i>
      <span class="error-text">{{ message }}</span>
    </div>
    <button v-if="dismissible" class="dismiss-button" @click="$emit('dismiss')">
      ✕
    </button>
  </div>
</template>

<script>
export default {
  name: 'ErrorMessage',
  props: {
    message: {
      type: String,
      required: true,
    },
    dismissible: {
      type: Boolean,
      default: false,
    },
  },
}
</script>

<style scoped>
.error-message {
  background-color: #fff3f3;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #d32f2f;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-icon {
  font-style: normal;
}

.error-text {
  font-size: 0.9rem;
}

.dismiss-button {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1rem;
  line-height: 1;
}

.dismiss-button:hover {
  color: #d32f2f;
}

.error-message.dismissible {
  padding-right: 0.5rem;
}
</style>
