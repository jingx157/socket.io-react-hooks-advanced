// Hook for initializing and managing the socket client
import {useSocketContext} from "../context/SocketContext";

export const useSocketClient = () => {
    const {socket, connected, setAuthToken} = useSocketContext();

    const emitEvent = (event: string, data: any, callback?: (...args: any[]) => void) => {
        if (socket?.connected) {
            socket.emit(event, data, callback);
        }
    };

    const reconnect = () => {
        socket?.disconnect();
        socket?.connect();
    };

    return {
        socket,
        connected,
        emitEvent,
        reconnect,
        setAuthToken,
    };
};
