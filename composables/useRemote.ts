
class Remote {
    socket: WebSocket | null = null;

    constructor(onmessage: any) {
        console.log("Connexion au serveur proxy ...")
        this.socket = new WebSocket("ws://localhost:8000/ws");
        this.socket.onmessage = onmessage;
    }

    // Permet de vérifier que la connexion au proxy est toujours établi
    isConnectedRemote () {
        if (this.socket == null)
            return false;

        if (this.socket.readyState == 1)
            return true;

        return false;
    }

    // Permet de déverrouiller les commandes
    unlockRemoteControl(key: string) {
        this.socket?.send(key);
    }
}

export const useRemote = () => {
    return { Remote }
}