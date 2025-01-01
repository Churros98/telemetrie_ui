<script setup lang="ts">
import { useRouter } from 'vue-router'
import { connect as connectSurreal, isConnected } from '../composables/useRemoteRC'

const router = useRouter()
const username = ref('')
const password = ref('')

if (isConnected())
  router.push('/voitures')

const invalid = ref(false)

async function connect() {
  const connected = await connectSurreal({ username: username.value, password: password.value })
  if (connected)
    router.push('/voitures')

  else
    invalid.value = true
}
</script>

<template>
  <div class="h-screen overflow-hidden">
    <Header />

    <!-- Login -->
    <div class="flex justify-center items-center h-screen">
      <div class="bg-white p-8 rounded-lg shadow-md">
        <h2 class="text-2xl font-bold mb-4">
          Connexion à la base de données
        </h2>
        <form @submit.prevent="connect">
          <p v-if="invalid" class="text-red-500">
            Nom d'utilisateur ou mot de passe incorrect
          </p>

          <input v-model="username" :class="invalid ? 'caret-red-500' : ''" type="text" placeholder="Nom d'utilisateur" class="w-full p-2 mb-4 border border-gray-300 rounded-md">
          <input v-model="password" :class="invalid ? 'caret-red-500' : ''" type="password" placeholder="Mot de passe" class="w-full p-2 mb-4 border border-gray-300 rounded-md">
          <button class="w-full bg-blue-500 text-white p-2 rounded-md">
            Connexion
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
