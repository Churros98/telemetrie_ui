<script setup lang="ts">
import '~/assets/style/hud.css'
import { useRouter } from 'vue-router'
import { mapGamepadToXbox360Controller, useGamepad } from '@vueuse/core'
import { useRemoteRC } from '~/composables/useRemoteRC'

const props = defineProps<{
  uuid: string
}>()
const router = useRouter()

// État du contrôleur
const { gamepads } = useGamepad()
const gamepad = computed(() => gamepads.value.find(g => g.id.includes('STANDARD')))
const controller = mapGamepadToXbox360Controller(gamepad as unknown as Ref<Gamepad | undefined>)
const gamepadAvailable = computed(() => gamepad.value !== undefined)

// Références DOM
const gps = ref<HTMLIFrameElement>()
const boussole = ref<HTMLObjectElement>()
const angles = ref<HTMLObjectElement>()

// État des indicateurs
const indicateurs = reactive({
  switchs: {
    esc: 'white',
  },
})

// Gestion du GPS
const gps_chan = new BroadcastChannel('gps_channel')
const gpsActions = {
  open: () => {
    gps.value?.remove()
    window.open('/gps')
  },

  update: (lat: number, long: number, cap: number) => {
    gps_chan.postMessage({ lat, long, cap })
  },
}

const { sensors, modem, control, switchs } = await useRemoteRC(props.uuid)

// Fonction de mise à jours des états des switchs
watchEffect(() => {
  if (!switchs.value)
    return

  indicateurs.switchs.esc = switchs.value.esc ? 'green' : 'red'
})

// Fonctions de mise à jour des indicateurs via les données des capteurs
watchEffect(() => {
  if (!sensors.value)
    return

  // Mise à jour de la boussole
  const layer = boussole.value?.contentDocument?.getElementById('layer2')
  if (layer) {
    layer.style.transformOrigin = '50% 50%'
    layer.style.transform = `rotate(-${sensors.value.mag.heading}deg)`
  }

  // Mise à jour des angles
  const angleLayer = angles.value?.contentDocument?.getElementById('layer1')
  if (angleLayer) {
    angleLayer.style.transformOrigin = '50% 50%'
    angleLayer.style.transform = `rotate(${sensors.value.imu.angles[1] % 360}deg) translate(0px, ${sensors.value.imu.angles[0] % 360}%)`
  }

  console.error(sensors.value)

  gpsActions.update(sensors.value.gps.latitude, sensors.value.gps.longitude, sensors.value.mag.heading)
})

// Actualisation périodique des commandes (15 FPS)
const { resume: controllerResume, pause: controllerPause, isActive: controllerIsActive } = useIntervalFn(async () => {
  const ar = controller.value?.triggers.left.value ?? 0
  const av = controller.value?.triggers.right.value ?? 0
  const steer = Number(controller.value?.stick.left.horizontal?.toFixed(1) ?? 0)
  const speed = -ar + av

  control.value = { steer, speed, time: Date.now() }
}, 1000 / 15, { immediate: false })

function returnToHome() {
  router.push('/voitures')
}
</script>

<template>
  <div id="hud">
    <!-- Header -->
    <div id="hud-header">
      <div id="left-menu">
        <div class="status-icon" @click="() => controllerIsActive ? controllerPause() : gamepadAvailable ? controllerResume() : null">
          <Icon name="mdi:gamepad" :color="[controllerIsActive ? 'green' : [gamepadAvailable ? 'blue' : 'red']]" />
        </div>

        <div class="status-icon">
          <Icon name="mdi:exit-to-app" @click="returnToHome()" />
        </div>
      </div>

      <div id="right-menu">
        <div class="status-icon">
          <Icon name="mdi:chip" :onclick="() => switchs && controllerIsActive ? switchs.esc = !switchs.esc : null" :color="indicateurs.switchs.esc" />
        </div>
        <div class="status-icon" @click="gpsActions.open">
          <Icon :name="sensors?.gps.fix ? 'mdi:gps-fixed' : 'mdi:gps-not-fixed'" />
        </div>
        <div class="status-icon">
          <Icon name="mdi:antenna" />{{ modem?.quality ?? '--- ' }} %
        </div>
      </div>
    </div>

    <!-- Indicateurs de vitesse et de batterie -->
    <div id="speed" class="indicateur">
      <div class="title-indicator">
        <p>Vitesse (Km/h)</p>
      </div>

      <div class="value-indicator">
        <p>{{ sensors ? sensors.gps.speed_kmh.toFixed(2) : '---' }}</p>
      </div>
    </div>

    <div id="battery" class="indicateur">
      <div class="title-indicator">
        <p>Batterie (V)</p>
      </div>

      <div class="value-indicator">
        <p>{{ sensors ? sensors.analog.battery.toFixed(2) : '---' }}</p>
      </div>
    </div>

    <!-- Indicateur d'angles -->
    <object id="angles" ref="angles" data="/hud.svg" type="image/svg+xml" />

    <!-- GPS & Boussole -->
    <iframe id="gps" ref="gps" src="/gps" frameborder="0" />
    <object id="boussole" ref="boussole" data="/boussole.svg" type="image/svg+xml" />
  </div>
</template>
