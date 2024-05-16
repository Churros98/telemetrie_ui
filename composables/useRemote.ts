// Classe qui permet la gestion d'une voiture
class Remote {
    server: string | null = null;
    socket: WebSocket | null = null;
    connection_check: any;
    controle_disponible: boolean;
    message_cb: any;
    est_connecte: boolean;

    constructor(server: string, onmessage: any, onconnectchange: any = undefined) {
        this.controle_disponible = false;
        this.est_connecte = false;

        this.message_cb = onmessage;

        console.log("Connexion au serveur proxy ...")
        this.server = server;
        this.socket = new WebSocket(server);
        this.socket.onmessage = (message: any) => { this.message(JSON.parse(message.data)) };

        this.connection_check = setInterval(() => {
            let connected = false;
            if (this.socket != null && this.socket.readyState == 1) {
                connected = true;
            }

            if (onconnectchange != undefined) {
                onconnectchange(connected);
            }

            this.est_connecte = connected;
        }, 1000);
    }

    // Gestion des messages reçu par le WebSocket
    message(data: any) {
        this.controle_disponible = (data.client_id == data.pilot_id);
        this.message_cb(data);
    }

    // Permet de vérifier que la connexion au proxy est toujours établi
    isConnectedRemote () {
        return this.est_connecte
    }

    // Permet de vérifier si les commandes sont disponible
    controlAvailable() {
        return this.controle_disponible;
    }

    // Permet de déverrouiller les commandes
    unlockRemoteControl(key: string) {
        this.socket?.send(key);
    }

    // Permet d'envoyé les contrôle
    sendControl(speed: number, steer: number) {
        if (!this.isConnectedRemote()) {
            return;
        }

        let control_data = {"motor": {"speed": speed}, "steering": {"steer": steer}};
        this.socket?.send(JSON.stringify(control_data));
    }
}

export const useRemote = () => {
    return { Remote }
}