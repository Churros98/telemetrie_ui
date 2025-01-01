<script setup lang="ts">
const props = defineProps<{
  uuid: string
}>()

const camera_url = `https://video.theorywrong.me/stream/${props.uuid}`
</script>

<template>
  <object id="camera" :data="camera_url" type="image/jpeg">
    <img src="/nostream.png">
  </object>
</template>

<style>
    #camera {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: black;
        object-fit: cover;
    }

    img {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
</style>
