import {useContext, useEffect, useState} from "react";
import {SocketContext} from "../context/SocketContext";

export type ConnectionStatus =
    | "connecting"
    | "connected"
    | "disconnected"
    | "reconnecting"
    | "unauthorized"
    | "failed";

export function useConnectionStatus(): ConnectionStatus {
    const {socket} = useContext(SocketContext);
    const [status, setStatus] = useState<ConnectionStatus>("connecting");

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => setStatus("connected");
        const handleDisconnect = () => setStatus("disconnected");
        const handleReconnect = () => setStatus("reconnecting");
        const handleConnectError = (err: any) => {
            if (err?.message === "unauthorized") {
                setStatus("unauthorized");
            } else {
                setStatus("failed");
            }
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("reconnect_attempt", handleReconnect);
        socket.on("connect_error", handleConnectError);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("reconnect_attempt", handleReconnect);
            socket.off("connect_error", handleConnectError);
        };
    }, [socket]);

    return status;
}
