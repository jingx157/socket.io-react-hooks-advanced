import {useEffect, useRef} from "react";
import {useSocketContext} from "../context/SocketContext";

type Handler = (...args: any[]) => void;

export const useEvent = (
    event: string,
    handler: Handler,
    deps: any[] = []
) => {
    const {socket} = useSocketContext();
    const savedHandler = useRef<Handler>();

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!socket) return;

        const listener: Handler = (...args) => {
            savedHandler.current?.(...args);
        };

        socket.on(event, listener);

        return () => {
            socket.off(event, listener);
        };
    }, [socket, event, ...deps]);
};
