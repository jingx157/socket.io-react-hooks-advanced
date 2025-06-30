import type {ReactNode} from "react";
import React from "react";
import {SocketProvider as BaseProvider} from "./SocketProvider";
import {createSocketContext} from "./createSocketContext";

interface NamespacedSocketProviderProps {
    url: string;
    namespace?: string;
    children: ReactNode;
    getToken?: () => string | Promise<string>;
    onUnauthorized?: () => Promise<string> | string;
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffFactor?: number;
    onRetry?: (attempt: number) => void;
    onGiveUp?: () => void;
    maxQueueSize?: number;
    onQueueOverflow?: (event: any) => void;
    persistQueue?: boolean;
    queueKey?: string;
    queueTTL?: number;
}

export const createNamespacedSocket = () => {
    const {Context, useCtx} = createSocketContext();

    const Provider: React.FC<NamespacedSocketProviderProps> = (props) => (
        <BaseProvider {...props} contextOverride={Context}>
            {props.children}
        </BaseProvider>
    );

    return {
        Provider,
        useSocket: useCtx,
    };
};
