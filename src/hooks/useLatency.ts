import {useEffect, useState} from "react";
import {useSocketContext} from "../context/SocketContext";

export const useLatency = () => {
    const {latency, onLatencyUpdate} = useSocketContext();
    const [latest, setLatest] = useState(latency);

    useEffect(() => {
        if (onLatencyUpdate) {
            onLatencyUpdate((ms) => {
                setLatest(ms);
            });
        }
    }, [onLatencyUpdate]);

    return latest;
};
