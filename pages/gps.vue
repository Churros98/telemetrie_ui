<script setup lang="ts">
import { ref } from 'vue'
import * as L from 'leaflet'

///////////////////////////////////////
// Gestion de la rotation des icones //
///////////////////////////////////////

// save these original methods before they are overwritten
const proto_initIcon = L.Marker.prototype._initIcon
const proto_setPos = L.Marker.prototype._setPos

const oldIE = (L.DomUtil.TRANSFORM === 'msTransform')

L.Marker.addInitHook(function (this: any) {
  const iconOptions = this.options.icon && this.options.icon.options
  let iconAnchor = iconOptions && this.options.icon.options.iconAnchor
  if (iconAnchor)
    iconAnchor = (`${iconAnchor[0]}px ${iconAnchor[1]}px`)

  this.options.rotationOrigin = this.options.rotationOrigin || iconAnchor || 'center bottom'
  this.options.rotationAngle = this.options.rotationAngle || 0

  // Ensure marker keeps rotated during dragging
  this.on('drag', (e) => { e.target._applyRotation() })
})

L.Marker.include({
  _initIcon() {
    proto_initIcon.call(this)
  },

  _setPos(pos: any) {
    proto_setPos.call(this, pos)
    this._applyRotation()
  },

  _applyRotation() {
    if (this.options.rotationAngle) {
      this._icon.style[`${L.DomUtil.TRANSFORM}Origin`] = this.options.rotationOrigin

      if (oldIE) {
        // for IE 9, use the 2D rotation
        this._icon.style[L.DomUtil.TRANSFORM] = `rotate(${this.options.rotationAngle}deg)`
      }
      else {
        // for modern browsers, prefer the 3D accelerated version
        this._icon.style[L.DomUtil.TRANSFORM] += ` rotateZ(${this.options.rotationAngle}deg)`
      }
    }
  },

  setRotationAngle(angle: any) {
    this.options.rotationAngle = angle
    this.update()
    return this
  },

  setRotationOrigin(origin: any) {
    this.options.rotationOrigin = origin
    this.update()
    return this
  },
})

//////////////////////////////
// Gestion des données GPS //
/////////////////////////////
const map = ref(null)

let map_ll: any = null
const positionGroup = L.layerGroup()
const positionIcon = L.icon({
  iconUrl: '/img/fleche.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, 0],
})
const positionMarker = L.marker([0.0, 0.0], { icon: positionIcon, rotationAngle: 0.0 })

// Prépare un channel pour le passage des données GPS
const gps_chan = new BroadcastChannel('gps_channel')

gps_chan.onmessage = function (message) {
  if (!map_ll)
    return

  updatePosition(message.data.lat, message.data.long, message.data.cap)
}

onMounted(() => {
  if (map.value == null) {
    console.log('Map non trouvé dans le DOM.')
    return
  }

  map_ll = L.map(map.value).setView([51.505, -0.09], 5)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map_ll)

  map_ll.addLayer(positionGroup)
  positionMarker.addTo(positionGroup)
})

// Permet la mise à jour de la position
function updatePosition(lat: number, long: number, cap: number) {
  const newLatLng = new L.LatLng(lat, long)
  positionMarker.setLatLng(newLatLng)
  positionMarker.setRotationAngle(cap)
  map_ll.setView([lat, long], 17)
}
</script>

<template>
  <div ref="map" style="height:100vh; width:100vw" />
</template>

<style>
    @import "~/node_modules/leaflet/dist/leaflet.css";
</style>

<style>
    body {
        margin: 0;
    }
</style>
