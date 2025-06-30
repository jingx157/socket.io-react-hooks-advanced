import React, {useCallback, useEffect, useMemo, useRef, useState,} from "react";
import {io, Socket} from "socket.io-client";
import {EmitMiddleware, OnMiddleware, SocketContext, SocketContextType} from "./SocketContext";
import {MiddlewareManager} from "../middleware";
import {clearQueue, loadQueue, QueuedEmit, saveQueue} from "../utils/storageQueue";


interface Props {
    url: string;
    getToken?: () => string | Promise<string>;
    onUnauthorized?: () => Promise<string> | string;
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffFactor?: number;
    onRetry?: (attempt: number) => void;
    onGiveUp?: () => void;
    maxQueueSize?: number;
    onQueueOverflow?: (dropped: QueuedEmit) => void;
    children: React.ReactNode;
    persistQueue?: boolean;
    queueKey?: string;
    queueTTL?: number;
    namespace?: string;
    contextOverride?: React.Context<SocketContextType>;


}

export const SocketProvider: React.FC<Props> = ({
                                                    url,
                                                    getToken,
                                                    onUnauthorized,
                                                    maxRetries = 5,
                                                    initialDelayMs = 1000,
                                                    maxDelayMs = 30000,
                                                    backoffFactor = 2,
                                                    onRetry,
                                                    onGiveUp,
                                                    maxQueueSize = 100,
                                                    onQueueOverflow,
                                                    children,
                                                    persistQueue,
                                                    queueKey,
                                                    queueTTL
                                                }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [authToken, setAuthToken] = useState<string | undefined>();

    const [latency, setLatency] = useState<number | undefined>();
    const latencyRef = useRef<number[]>([]);
    const latencyCallbacks = useRef<((ms: number) => void)[]>([]);
    const pingInterval = useRef<NodeJS.Timeout | null>(null);


    const retryCountRef = useRef(0);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const manualDisconnectRef = useRef(false);

    const queueRef = useRef<QueuedEmit[]>([]);
    const flushCountRef = useRef(0);

    const middlewareManager = useRef(new MiddlewareManager());

    const fetchToken = useCallback(async () => {
        if (!getToken) return;
        const token = await getToken();
        setAuthToken(token);
    }, [getToken]);

    useEffect(() => {
        fetchToken();
    }, [fetchToken]);

    useEffect(
        () => () => {
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        },
        []
    );

    useEffect(() => {
        if (!authToken) return;

        manualDisconnectRef.current = false;
        const socketInstance = io(url, {
            auth: {token: authToken},
            transports: ["websocket", "polling"],
            autoConnect: false,
        });

        setSocket(socketInstance);

        // Override emit/on with middleware and offline queue support

        const rawEmit = socketInstance.emit.bind(socketInstance);

        socketInstance.emit = (event: string, data: any, ...args: any[]) => {
            const ack = typeof args[0] === "function" ? args[0] : undefined;
            middlewareManager.current.runEmit(event, data, (ev, dt) => {
                if (socketInstance.connected) {
                    rawEmit(ev, dt, ack);
                } else {
                    if (queueRef.current.length >= maxQueueSize) {
                        const dropped = queueRef.current.shift();
                        onQueueOverflow?.(dropped!);
                    }
                    queueRef.current.push({event: ev, data: dt, ack, timestamp: Date.now()});
                }
            });
            return socketInstance;
        };

        const rawOn = socketInstance.on.bind(socketInstance);
        socketInstance.on = (event: string, handler: (data: any) => void) => {
            const wrappedHandler = (data: any) => {
                middlewareManager.current.runOn(event, data, handler);
            };
            return rawOn(event, wrappedHandler);
        };

        const connectWithRetry = () => {
            if (manualDisconnectRef.current) return;
            socketInstance.connect();
        };

        socketInstance.on("connect", () => {
            setConnected(true);
            retryCountRef.current = 0;

            pingInterval.current = setInterval(() => {
                const start = Date.now();
                socketInstance.emit("ping-latency", () => {
                    const ms = Date.now() - start;
                    setLatency(ms);
                    latencyRef.current.push(ms);
                    latencyCallbacks.current.forEach(cb => cb(ms));
                });
            }, 5000); // every 5 sec


            // Flush offline queue
            while (queueRef.current.length > 0) {
                const {event, data, ack} = queueRef.current.shift()!;
                socketInstance.emit(event, data, ack);
            }
            flushCountRef.current++;
            clearQueue(queueKey); // clear persisted queue after flush
        });

        socketInstance.on("disconnect", (reason) => {
            setConnected(false);

            if (manualDisconnectRef.current) return;

            if (retryCountRef.current >= maxRetries) {
                onGiveUp?.();
                return;
            }

            const delay = Math.min(
                initialDelayMs * Math.pow(backoffFactor, retryCountRef.current),
                maxDelayMs
            );

            onRetry?.(retryCountRef.current + 1);

            retryTimeoutRef.current = setTimeout(() => {
                retryCountRef.current++;
                socketInstance.connect();
            }, delay);
        });

        socketInstance.on("unauthorized", async () => {
            if (!onUnauthorized) {
                socketInstance.disconnect();
                return;
            }
            try {
                const newToken = await onUnauthorized();
                setAuthToken(newToken);
            } catch (err) {
                socketInstance.disconnect();
            }
        });

        if (persistQueue) {
            const restored = loadQueue(queueKey, queueTTL);
            queueRef.current.push(...restored);
        }

        connectWithRetry();

        return () => {
            manualDisconnectRef.current = true;
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            if (pingInterval.current) clearInterval(pingInterval.current);
            socketInstance.disconnect();
        };
    }, [
        url,
        authToken,
        maxRetries,
        initialDelayMs,
        maxDelayMs,
        backoffFactor,
        onRetry,
        onGiveUp,
        onUnauthorized,
        maxQueueSize,
        onQueueOverflow,
    ]);

    const addEmitMiddleware = useCallback(
        (middleware: EmitMiddleware) => {
            const id = crypto.randomUUID();
            middlewareManager.current.addMiddleware({id, emit: middleware});
            return id;
        },
        []
    );

    const addOnMiddleware = useCallback(
        (middleware: OnMiddleware) => {
            const id = crypto.randomUUID();
            middlewareManager.current.addMiddleware({id, on: middleware});
            return id;
        },
        []
    );

    const removeMiddleware = useCallback((id: string) => {
        middlewareManager.current.removeMiddleware(id);
    }, []);

    const emitWithQueue = useCallback(
        (event: string, data: any, ack?: (...args: any[]) => void) => {
            if (socket?.connected) {
                socket.emit(event, data, ack);
            } else {
                if (queueRef.current.length >= maxQueueSize) {
                    const dropped = queueRef.current.shift();
                    onQueueOverflow?.(dropped!);
                }
                const queued = {event, data, ack, timestamp: Date.now()};
                queueRef.current.push(queued);
                if (persistQueue) saveQueue(queueRef.current, queueKey);

            }
        },
        [socket, maxQueueSize, onQueueOverflow]
    );

    const onLatencyUpdate = (cb: (latency: number) => void) => {
        latencyCallbacks.current.push(cb);
    };


    const value = useMemo(
        () => ({
            socket,
            connected,
            setAuthToken,
            addEmitMiddleware,
            addOnMiddleware,
            removeMiddleware,
            emitWithQueue,
            queueLength: queueRef.current.length,
            flushCount: flushCountRef.current,
            latency,
            latencyHistory: latencyRef.current,
            onLatencyUpdate,
        }),
        [
            socket,
            connected,
            setAuthToken,
            addEmitMiddleware,
            addOnMiddleware,
            removeMiddleware,
            emitWithQueue,
        ]
    );

    return (
        <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
    );
};
