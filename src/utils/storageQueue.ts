export interface QueuedEmit {
    event: string;
    data: any;
    timestamp: number;
    ack?: (...args: any[]) => void;
}

const DEFAULT_KEY = "socketio.queue";
const DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

export const saveQueue = (
    queue: QueuedEmit[],
    key: string = DEFAULT_KEY
): void => {
    try {
        const json = JSON.stringify(queue.map(({ack, ...rest}) => rest));
        localStorage.setItem(key || DEFAULT_KEY, json);  // <-- fallback here
    } catch (err) {
        console.error("Failed to persist emit queue:", err);
    }
};

export const loadQueue = (
    key: string = DEFAULT_KEY,
    ttl: number = DEFAULT_TTL
): QueuedEmit[] => {
    try {
        const json = localStorage.getItem(key);
        if (!json) return [];

        const now = Date.now();
        const parsed: QueuedEmit[] = JSON.parse(json);

        return parsed.filter((item) => now - item.timestamp < ttl);
    } catch (err) {
        console.warn("Failed to load queued emits:", err);
        return [];
    }
};

export const clearQueue = (key: string = DEFAULT_KEY): void => {
    localStorage.removeItem(key);
};
