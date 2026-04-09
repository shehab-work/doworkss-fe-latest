<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error.statusCode ?? 500)

const title = computed(() => {
  switch (statusCode.value) {
    case 404: return 'Page Not Found'
    case 403: return 'Access Denied'
    case 500: return 'Server Error'
    default: return 'Something Went Wrong'
  }
})

const message = computed(() => {
  switch (statusCode.value) {
    case 404: return 'The page you are looking for does not exist.'
    case 403: return 'You do not have permission to access this page.'
    case 500: return 'An internal server error occurred. Please try again later.'
    default: return props.error.message || 'An unexpected error occurred.'
  }
})

function handleGoHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">{{ statusCode }}</h1>
      <h2 class="error-title">{{ title }}</h2>
      <p class="error-message">{{ message }}</p>
      <button class="error-button" @click="handleGoHome">
        Go Home
      </button>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-family: sans-serif;
  text-align: center;
}

.error-content {
  max-width: 480px;
  padding: 2rem;
}

.error-code {
  font-size: 5rem;
  font-weight: 700;
  color: #407830;
  margin: 0;
}

.error-title {
  font-size: 1.5rem;
  margin: 0.5rem 0;
}

.error-message {
  color: #666;
  margin: 1rem 0 2rem;
}

.error-button {
  background: #407830;
  color: #fff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.error-button:hover {
  background: #356828;
}
</style>
