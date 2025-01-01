import type { UUID } from 'surrealdb.js'
import { Surreal } from 'surrealdb.js'
import type { Control, Modem, Sensors, Switch } from '../src/remote'

export const db = reactive(new Surreal())

interface Auth {
  username: string
  password: string
}

export async function connect(auth: Auth) {
  try {
    await db.connect('wss://db.theorywrong.me/rpc', {
      namespace: 'voiturerc',
      database: 'voiturerc',
      auth: { username: auth.username, password: auth.password },
    })
  }
  catch (e) {
    console.error(`Erreur de connexion à la base de données: ${e}`)
    return false
  }

  return true
}

export function isConnected() {
  return db.status === 'connected'
}

export function disconnect() {
  db.close()
}

let liveQuery: UUID[] = []
export async function useRemoteRC(uuid: string) {
  const sensors = ref<Sensors>()
  const modem = ref<Modem>()
  const switchs = ref<Switch>()
  const control = ref<Control>()

  uuid = uuid.replace(/-/g, '')

  // Mets à jour les commandes automatiquement
  watchEffect(async () => {
    if (!control.value)
      return

    await db.query(`UPDATE control:${uuid} SET steer = $steer, speed = $speed, time = time::millis();`, { steer: control.value?.steer, speed: control.value?.speed })
  })

  // Mets à jour l'état des switchs automatiquement
  watchEffect(async () => {
    if (!switchs.value)
      return

    await db.query(`UPDATE switch:${uuid} SET esc = $esc;`, { esc: switchs.value?.esc })
  })

  // Supprime les lives lors de la démontage du composant
  onUnmounted(async () => {
    await db.kill(liveQuery)
  })

  // Live update des données lors du montage du composant
  onMounted(async () => {
    // Récupére les switchs (1er démarrage)
    const current_switchs = await db.query<Switch[]>(`SELECT * FROM switch:${uuid};`)
    if (current_switchs.length > 0)
      switchs.value = current_switchs[0]

    // Prépare le live update des données
    liveQuery = await Promise.all([
      db.live<Sensors>(`nav`, (_, result) => {
        sensors.value = result
      }),
      db.live<Modem>(`modem`, (_, result) => {
        modem.value = result
      }),
      db.live<Switch>(`switch`, (_, result) => {
        switchs.value = result
      }),
    ])
  })

  return { sensors, modem, switchs, control }
}
