import {EmitMiddleware, OnMiddleware} from "../context/SocketContext";

export const loggingEmitMiddleware: EmitMiddleware = (event, data, next) => {
    console.log("[Emit]", event, data);
    next(event, data);
};

export const loggingOnMiddleware: OnMiddleware = (event, data, next) => {
    console.log("[On]", event, data);
    next(data);
};
