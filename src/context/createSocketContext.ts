import {createContext, useContext} from "react";
import {SocketContextType} from "./SocketContext";

export const createSocketContext = () => {
    const Context = createContext<SocketContextType>({
        socket: null,
        connected: false,
    });

    const useCtx = () => useContext(Context);

    return {Context, useCtx};
};
