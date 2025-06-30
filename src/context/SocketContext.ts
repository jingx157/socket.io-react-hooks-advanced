import {createContext, useContext} from "react";
import {Socket} from "socket.io-client";

export interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
    setAuthToken?: (token: string) => void;
    addEmitMiddleware?: (middleware: EmitMiddleware) => string;
    addOnMiddleware?: (middleware: OnMiddleware) => string;
    removeMiddleware?: (id: string) => void;
    emitWithQueue?: (
        event: string,
        data: any,
        ack?: (...args: any[]) => void
    ) => void;
    queueLength?: number;
    flushCount?: number;
    latency?: number;
    latencyHistory?: number[];
    onLatencyUpdate?: (callback: (latency: number) => void) => void;

}

export type EmitMiddleware = (
    event: string,
    data: any,
    next: (event: string, data: any) => void
) => void;

export type OnMiddleware = (
    event: string,
    data: any,
    next: (data: any) => void
) => void;

export const SocketContext = createContext<SocketContextType>({
    socket: null,
    connected: false,
});
export const useSocketContext = () => useContext(SocketContext);