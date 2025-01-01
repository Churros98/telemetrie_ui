<script setup lang="ts">
import { useRouter } from 'vue-router'
import { db, isConnected } from '../composables/useRemoteRC'

const router = useRouter()

if (!isConnected())
  router.push('/')

let voitures: { uuid: string }[] = []

async function refreshList() {
  voitures = []
  const query = await db.query<{ id: string }[][]>('SELECT VALUE id FROM nav')

  for (const item of query) {
    for (const item2 of item)
      voitures.push({ uuid: item2.id })
  }
}

await refreshList()

const specialButton = [
  {
    icon: 'mdi:refresh',
    action: async () => {
      await refreshList()
    },
  },
]
</script>

<template>
  <div>
    <Header :special-button="specialButton" />

    <!-- Liste des voitures enregistrées -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 content-stretch justify-items-center">
      <div v-for="voiture in voitures" :key="voiture.uuid" class="container p-8 hover:bg-gray-100 hover:cursor-pointer" @click="router.push(`/voiture/${voiture.uuid}`)">
        <div class="bg-blue-500">
          <img id="camera" :src="`https://video.theorywrong.me/sshot/${voiture.uuid}`" type="image/jpeg" class="fit object-fit">
        </div>

        <h2 class="text-2xl text-center font-bold mb-4 container p-4">
          {{ voiture.uuid }}
        </h2>
      </div>
    </div>
  </div>
</template>
