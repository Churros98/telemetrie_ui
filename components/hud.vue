<template>
    <!-- Header -->
    <div id="hud-header">
        <div id="left-menu">
            <div @click="unlock_command" class="status-icon"><Icon name="mdi:car-key" :color="indicateur_pilote" /></div>
            <div class="status-icon"><Icon name="mdi:gamepad" :color="[gamepadAvailable ? 'green' : 'red']" /></div>
        </div>

        <div id="right-menu">
            <div @click="external_gps" class="status-icon"><Icon name="mdi:gps-not-fixed" :color="indicateur_gps" /></div>
            <div class="status-icon"><Icon name="mdi:compass" :color="indicateur_boussole" /></div>
            <div class="status-icon"><Icon name="mdi:gyro" :color="indicateur_gyro" /></div>
            <div class="status-icon"><Icon name="mdi:analog" :color="indicateur_analogique" /></div>
            <div class="status-icon"><Icon name="mdi:antenna" :color="indicateur_antenne" />{{ reception_antenne }} dBm</div>
        </div>
    </div>

    <!-- Indicateurs de vitesse et de batterie -->
    <div v-show="!indicateur_proxy" class="indicateur" id="speed">
        <div class="title-indicator">
            <p>Vitesse (Km/h)</p>
        </div>

        <div class="value-indicator">
            <p>{{ indicateur_vitesse }}</p>
        </div>
    </div>

    <div v-show="!indicateur_proxy" class="indicateur" id="battery">
        <div class="title-indicator">
            <p>Batterie (V)</p>
        </div>

        <div class="value-indicator">
            <p>{{ indicateur_batterie }}</p>
        </div>
    </div>

    <!-- Erreur de proxy -->
    <h1 v-show="indicateur_proxy" id="erreur-proxy">Proxy déconnecté.</h1>

    <!-- Indicateur d'angles -->
    <object v-show="!indicateur_proxy" id="angles" ref="angles" data="/hud.svg" type="image/svg+xml"></object>

    <!-- GPS & Boussole -->
    <iframe v-show="!indicateur_proxy" id="gps" ref="gps" src="/gps" frameborder="0"></iframe>
    <object id="boussole" ref="boussole" data="/boussole.svg" type="image/svg+xml"></object>
</template>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap');

    #speed {
        top: 47%;
        left: 20%;
    }

    #battery {
        top: 47%;
        left: 70%;
    }

    .indicateur {
        display: block;
        position: absolute;
        width: 10%;
        height: 10%;
        z-index: 300;
        background-color: rgba(0, 0, 0, 0.4);
        color: white;
        font-family: "Roboto", sans-serif;
        font-style: normal;
    }

    .title-indicator {
        display: flex;
        background-color: rgba(0, 0, 0, 0.7);
        width: 100%;
        height: 30%;
        font-size: 1em;
        margin: auto;
        align-items:center;
    }

    .title-indicator p {
        display: block;
        margin: auto;
        text-align:center;
    }

    .value-indicator {
        display: flex;
        width: 100%;
        height: 70%;
        font-size: 3em;
        font-weight: bold;
        margin: auto;
        align-items:center;
    }

    .value-indicator p {
        display: block;
        margin: auto;
        text-align:center;
    }

    #erreur-proxy {
        display: block;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        color: red;
        font-family: "Roboto", sans-serif;
        font-style: normal;
        z-index: 500;
    }

    #angles {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 80%;
        height: 60%;
        transform: translate(-50%, -50%);
        z-index: 100;
    }

    #gps {
        position: absolute;
        z-index: 200;
        bottom: 1%;
        left: 1%;
        width: 20%;
        height: 20%;
        border-radius: 2%;
    }

    #hud-header {
        display: block;
        width: 100%;
        height: 5%;
        position: absolute;
        top: 0%;
        background: rgba(0, 0, 0, 0.4);
        z-index: 200;
    }

    #right-menu {
        margin-right: auto;
        display: flex;
        align-items: stretch;
        float: right;
        height: 100%;
    }

    #left-menu {
        margin-right: auto;
        display: flex;
        align-items: stretch;
        float: left;
        height: 100%;
    }

    .status-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: "Roboto", sans-serif;
        font-weight: 400;
        font-style: normal;
        margin-left: 0.5em;
        margin-right: 0.5em;
    }

    #boussole {
        position: absolute;
        bottom: 50px;
        left: 50%;
        width: 20%;
        height: 20%;
        transform: translate(-50%, 0%);
        z-index: 500;
    }

    /* #boussole #layer2 {
        transform-origin: 50% 50%;
        transform: rotate(90deg);
    } */
</style>

<script setup lang="ts">
    import { ref, computed } from 'vue';
    import { useGamepad, mapGamepadToXbox360Controller } from '@vueuse/core'

    const { Remote } = useRemote();
    const { gamepads } = useGamepad();

    const gamepad = computed(() => gamepads.value.find(g => g.id.includes("STANDARD")));
    const gamepadOnline = computed(() => gamepad.value != undefined ? true : false);
    
    onMounted(() => {
        context.value = hud.value?.getContext("2d") || undefined;
    });

    //////
    // UI
    //////
    
    // Référence
    const hud: Ref<HTMLCanvasElement | undefined> = ref();
    const context: Ref<CanvasRenderingContext2D | undefined> = ref();
    const gps: Ref<HTMLIFrameElement | undefined> = ref();
    const boussole: Ref<HTMLObjectElement | undefined> = ref();
    const angles: Ref<HTMLObjectElement | undefined> = ref();

    // Indicateur modifiable
    const indicateur_pilote = ref("white");
    const indicateur_gps = ref("white");
    const indicateur_boussole = ref("white");
    const indicateur_gyro = ref("white");
    const indicateur_analogique = ref("white");
    const indicateur_antenne = ref("white");
    const gamepadAvailable = ref(gamepadOnline);
    const reception_antenne = ref(-999);
    const indicateur_batterie = ref("---");
    const indicateur_vitesse = ref("---");
    const indicateur_proxy = ref(false);

    // Permet de mettre à jour la boussole
    function updateBoussole(cap: number) {
        if (boussole.value != null) {
            let boussoleLayer2 = boussole.value.contentDocument?.getElementById("layer2");
            if (boussoleLayer2) {
                boussoleLayer2.style.transformOrigin = "50% 50%";
                boussoleLayer2.style.transform = "rotate(-"+cap+"deg)";
            }
        }
    }

    // Permet de mettre à  jour l'indicateur de batterie
    function updateBatterie(perc: number) {
        indicateur_batterie.value = perc.toFixed(2);
    }

    // Permet de mettre à  jour l'indicateur de vitesse
    function updateVitesse(speed: number) {
        indicateur_vitesse.value = speed.toFixed(2);
    }

    // Permet de mettre à jour l'indicateur d'angles
    function updateAngles(roll: number, pitch: number) {
        pitch = pitch % 360
        roll = roll % 360

        if (angles.value != null) {
            let anglesLayer1 = angles.value.contentDocument?.getElementById("layer1");
            if (anglesLayer1) {
                anglesLayer1.style.transformOrigin = "50% 50%";
                anglesLayer1.style.transform = "rotate("+roll+"deg) translate(0px, " + pitch + "%)";
            }
        }
    }

    //////
    // GPS
    ////// 
    const gps_chan = new BroadcastChannel('gps_channel');

    // Permet l'ouverture du GPS dans une fenêtre externe
    function external_gps() {
        if (gps.value) {
            gps.value.remove();
        }

        window.open("/gps");
    }

    // Mets à jour le GPS
    function updateGPS(lat_deg: number, lat_min: number, lat_dir: number, long_deg: number, long_min: number, long_dir: number, cap: number) {
        // Gestion de la direction
        let lat_dir_value = lat_dir == 78 ? 1 : -1;
        let long_dir_value = long_dir == 69 ? 1 : -1;

        // Conversion Degrée Minute en Degrée décimal
        let lat = (lat_deg + (lat_min / 60)) * lat_dir_value;
        let long = (long_deg + (long_min / 60)) * long_dir_value;

        gps_chan.postMessage({lat: lat, long: long, cap: cap});
    }

    //////
    // Proxy
    //////

    const remote = new Remote("ws://localhost:8000/ws", updateHUD, updateProxyState);

    // Permet de mettre à jour le HUD via un message de la voiture (Indicateur)
    function updateHUDIndicator(message: any) {
        // Vérifie si je suis l'utilisateur actif
        if (remote.controlAvailable()) {
            indicateur_pilote.value = "green";
        } else {
            indicateur_pilote.value = "red";
        }

        // Vérifie le status de chaque capteurs
        // IMU
        if (message.sensors.imu.status == 255) {
            indicateur_gyro.value = "red";
        } else if (message.sensors.imu.status & 0x1) {
            indicateur_gyro.value = "green";
        } else {
            indicateur_gyro.value = "blue";
        }

        // GPS
        if (message.sensors.gps.status == 255) {
            indicateur_gps.value = "red";
        } else if (message.sensors.gps.status & 0x1) {
            indicateur_gps.value = "green";
        } else {
            indicateur_gps.value = "blue";
        }

        // Boussole
        if (message.sensors.mag.status == 255) {
            indicateur_boussole.value = "red";
        } else if (message.sensors.mag.status & 0x1) {
            indicateur_boussole.value = "green";
        } else {
            indicateur_boussole.value = "blue";
        }

        // Capteur Analogique
        if (message.sensors.analog.status == 255) {
            indicateur_analogique.value = "red";
        } else if (message.sensors.analog.status & 0x1) {
            indicateur_analogique.value = "green";
        } else {
            indicateur_analogique.value = "blue";
        }
    }

    // Permet de mettre à jour le HUD via un message de la voiture
    function updateHUD(message: any) {
        let heading = message.sensors.mag.heading;

        updateHUDIndicator(message);
        updateBatterie(message.sensors.analog.battery);
        updateVitesse(message.sensors.gps.vitesse_sol);
        updateGPS(message.sensors.gps.lat_deg, message.sensors.gps.lat_min, message.sensors.gps.dir_lat, message.sensors.gps.long_deg, message.sensors.gps.long_min, message.sensors.gps.dir_long, heading);
        updateBoussole(heading);
        updateAngles(-message.sensors.imu.ay, -message.sensors.imu.ax);
    }

    // Permet de récupérer un changement sur la connexion au proxy
    function updateProxyState(status: boolean) {
        indicateur_proxy.value = !status;
    }

    // Formate le message afin d'obtenir les valeur (RAW) du magnétomètre pour une calibration
    function magnetic_calibration(message: any) {
        let mag_raw_x = message.sensors.mag.raw_x;
        let mag_raw_y = message.sensors.mag.raw_y;
        let mag_raw_z = message.sensors.mag.raw_z;

        console.log(mag_raw_x + "," + mag_raw_y + "," + mag_raw_z);
    }

    // Fonction de déverrouillage des contrôles
    function unlock_command() {
        if (remote.isConnectedRemote()) {
            let key = prompt("Clé de sécurité.") as string;
            console.log("Déverrouillage via la clé: " + key)
            remote.unlockRemoteControl(key);
        }
    }

    //////
    // Contrôle
    //////

    // Envoi les commandes aux proxy
    setInterval(() => {
        if (!gamepadOnline.value || !remote.controlAvailable()) {
            return;
        }

        let ar = gamepad.value?.buttons[6].value;
        let av = gamepad.value?.buttons[7].value;

        let speed = 0.0;
        if (ar != undefined && av != undefined) {
            speed = -ar + av;
        }

        let steer = gamepad.value?.axes[0];
        if (steer == undefined) {
            steer = 0.0;
        }

        remote.sendControl(speed, steer);
    }, 1000/30) // 30fps
</script>