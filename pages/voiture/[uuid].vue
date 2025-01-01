<script setup lang="ts">
import { useRouter } from 'vue-router'
import { isConnected } from '../../composables/useRemoteRC'

const uuid = useRoute().params.uuid as string
const router = useRouter()

if (!isConnected())
  router.push('/')
</script>

<template>
  <div>
    <Camera :uuid="uuid" />
    <Hud :uuid="uuid" />
  </div>
</template>
