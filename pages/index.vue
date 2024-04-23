<script setup>
const { data } = await useAsyncData(() => new Date().toLocaleString())
</script>

<template>
  <Hud></Hud>
  <Camera></Camera>
</template>

