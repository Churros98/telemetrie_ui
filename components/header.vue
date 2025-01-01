<script setup lang="ts">
import { disconnect as disconnectSurreal, isConnected } from '~/composables/useRemoteRC'

const props = defineProps<{
  specialButton?: {
    icon: string
    action: () => void
  }[]
}>()

function disconnect() {
  disconnectSurreal()
  window.location.reload()
}
</script>

<template>
  <!-- Header -->
  <div class="flex justify-between items-center p-4 bg-gray-200">
    <div>
      <h1 class="text-2xl font-bold">
        VoitureRC
      </h1>
    </div>
    <div class="flex gap-2">
      <button v-for="button in props.specialButton" :key="button.icon" @click="button.action">
        <Icon :name="button.icon" size="24" />
      </button>

      <button v-if="isConnected()" @click="disconnect()">
        <Icon name="mdi:logout" size="24" />
      </button>
    </div>
  </div>
</template>
