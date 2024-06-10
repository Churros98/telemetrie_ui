<script setup lang="ts">
import '~/assets/style/hud.css'

import { mapGamepadToXbox360Controller, useGamepad } from '@vueuse/core'
import { type Prettify, Surreal } from 'surrealdb.js'
import { extend } from 'leaflet'

// Prépare le contrôleur
const { gamepads } = useGamepad()
const gamepad = computed(() => gamepads.value.find(g => g.id.includes('STANDARD')))
const controller = mapGamepadToXbox360Controller(gamepad)
const gamepadOnline = computed(() => gamepad.value !== undefined)

//////
// UI
//////

// Référence
const hud = ref<HTMLCanvasElement>()
const context = ref<CanvasRenderingContext2D>()
const gps = ref<HTMLIFrameElement>()
const boussole = ref<HTMLObjectElement>()
const angles = ref<HTMLObjectElement>()

// Indicateur modifiable
const indicateur_gps = ref('white')
const indicateur_boussole = ref('white')
const indicateur_gyro = ref('white')
const indicateur_analogique = ref('white')
const indicateur_antenne = ref('white')
const gamepadAvailable = ref(gamepadOnline)
const reception_antenne = ref(-999)
const indicateur_batterie = ref('---')
const indicateur_vitesse = ref('---')
const indicateur_db = ref(false)

onMounted(() => {
  context.value = hud.value?.getContext('2d') || undefined
})

// Permet de mettre à jour la boussole
function updateBoussole(cap: number) {
  if (boussole.value != null) {
    const boussoleLayer2 = boussole.value.contentDocument?.getElementById('layer2')
    if (boussoleLayer2) {
      boussoleLayer2.style.transformOrigin = '50% 50%'
      boussoleLayer2.style.transform = `rotate(-${cap}deg)`
    }
  }
}

// Permet de mettre à  jour l'indicateur de batterie
function updateBatterie(perc: number) {
  indicateur_batterie.value = perc.toFixed(2)
}

// Permet de mettre à  jour l'indicateur de vitesse
function updateVitesse(speed: number) {
  indicateur_vitesse.value = speed.toFixed(2)
}

// Permet de mettre à jour l'indicateur d'angles
function updateAngles(roll: number, pitch: number) {
  pitch = pitch % 360
  roll = roll % 360

  if (angles.value != null) {
    const anglesLayer1 = angles.value.contentDocument?.getElementById('layer1')
    if (anglesLayer1) {
      anglesLayer1.style.transformOrigin = '50% 50%'
      anglesLayer1.style.transform = `rotate(${roll}deg) translate(0px, ${pitch}%)`
    }
  }
}

//////
// GPS
/// ///
const gps_chan = new BroadcastChannel('gps_channel')

// Permet l'ouverture du GPS dans une fenêtre externe
function external_gps() {
  if (gps.value)
    gps.value.remove()

  window.open('/gps')
}

// // Mets à jour le GPS
function updateGPS(lat: number, long: number, cap: number) {
  gps_chan.postMessage({ lat, long, cap })
}

//////
// SurrealDB
//////

interface IMU extends Record<string, unknown> {
  angles: [number, number, number]
  temp: number
}

interface Analog extends Record<string, unknown> {
  battery: number
}

interface MAG extends Record<string, unknown> {
  raw: [number, number, number]
  heading: number
}

interface GGA extends Record<string, unknown> {
  longitude: number
  latitude: number
  satellite_count: number
  fix: boolean
}

interface VTG extends Record<string, unknown> {
  speed: number
}

function imuMessage(action: string, result: IMU) {
  if (action !== 'UPDATE')
    return 0

  updateAngles(-result.angles[1], -result.angles[0])
}

function analogMessage(action: string, result: Analog) {
  if (action !== 'UPDATE')
    return 0

  updateBatterie(result.battery)
}

function magMessage(action: string, result: MAG) {
  if (action !== 'UPDATE')
    return 0

  updateBoussole(result.heading)
}

function ggaMessage(action: string, result: GGA) {
  if (action !== 'UPDATE')
    return 0

  updateGPS(result.latitude, result.longitude, 0.0)
}

function vtgMessage(action: string, result: VTG) {
  if (action !== 'UPDATE')
    return 0

  updateVitesse(result.speed)
}

// Prépare SurrealDB
const db = new Surreal()

interface Control extends Prettify<Record<string, unknown>> {
  steer: number
  speed: number
}

function startControl() {
  // Envoi les commandes aux proxy
  watchThrottled([
    () => controller.value?.triggers.left.value,
    () => controller.value?.triggers.right.value,
    () => Number.parseFloat(controller.value?.stick.left.horizontal?.toFixed(1) ?? '0.0'),
  ], async ([ar, av, steer]) => {
    let speed = 0.0
    if (ar !== undefined && av !== undefined)
      speed = -ar + av

    if (steer === undefined)
      steer = 0.0

    const result = await db.update<Control>('control:realtime', {
      steer,
      speed,
    })

    console.log(result)
  }, {
    throttle: 1000 / 30,
  })
}

try {
  // Connexion à la base de donnée
  await db.connect('wss://db.theorywrong.me/rpc', {
    namespace: 'voiturerc',
    database: 'voiturerc',
    auth: {
      username: 'master',
      password: 'rootkit',
    },
  })

  console.log(`Status: ${db.status}`)

  try {
    await db.live<IMU>('imu', imuMessage)
    await db.live<Analog>('analog', analogMessage)
    await db.live<MAG>('mag', magMessage)
    await db.live<GGA>('gga', ggaMessage)
    await db.live<VTG>('vtg', vtgMessage)
    startControl()
  }
  catch (e) {
    console.error('Erreur lors de la création du live.', e)
  }
}
catch (e) {
  console.error('Erreur de base de donnée.', e)
  indicateur_db.value = true
}
</script>

<template>
  <!-- Header -->
  <div id="hud-header">
    <div id="left-menu">
      <div class="status-icon">
        <Icon name="mdi:gamepad" :color="[gamepadAvailable ? 'green' : 'red']" />
      </div>
    </div>

    <div id="right-menu">
      <div class="status-icon" @click="external_gps">
        <Icon name="mdi:gps-not-fixed" :color="indicateur_gps" />
      </div>
      <div class="status-icon">
        <Icon name="mdi:compass" :color="indicateur_boussole" />
      </div>
      <div class="status-icon">
        <Icon name="mdi:gyro" :color="indicateur_gyro" />
      </div>
      <div class="status-icon">
        <Icon name="mdi:analog" :color="indicateur_analogique" />
      </div>
      <div class="status-icon">
        <Icon name="mdi:antenna" :color="indicateur_antenne" />{{ reception_antenne }} dBm
      </div>
    </div>
  </div>

  <!-- Indicateurs de vitesse et de batterie -->
  <div v-show="!indicateur_db" id="speed" class="indicateur">
    <div class="title-indicator">
      <p>Vitesse (Km/h)</p>
    </div>

    <div class="value-indicator">
      <p>{{ indicateur_vitesse }}</p>
    </div>
  </div>

  <div v-show="!indicateur_db" id="battery" class="indicateur">
    <div class="title-indicator">
      <p>Batterie (V)</p>
    </div>

    <div class="value-indicator">
      <p>{{ indicateur_batterie }}</p>
    </div>
  </div>

  <!-- Erreur de proxy -->
  <h1 v-show="indicateur_db" id="erreur-db">
    Impossible de joindre la base de donnée.
  </h1>

  <!-- Indicateur d'angles -->
  <object v-show="!indicateur_db" id="angles" ref="angles" data="/hud.svg" type="image/svg+xml" />

  <!-- GPS & Boussole -->
  <iframe v-show="!indicateur_db" id="gps" ref="gps" src="/gps" frameborder="0" />
  <object id="boussole" ref="boussole" data="/boussole.svg" type="image/svg+xml" />
</template>
