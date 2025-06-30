// Hook for emitting events with optional encryption
import {useCallback} from "react";
import {useSocketContext} from "../context/SocketContext";

export const useEmit = () => {
    const {socket} = useSocketContext();

    const emit = useCallback(
        (event: string, payload: any, ackCallback?: (...args: any[]) => void) => {
            if (!socket || !socket.connected) return;
            socket.emit(event, payload, ackCallback);
        },
        [socket]
    );

    return emit;
};
