import {EmitMiddleware, OnMiddleware} from "../context/SocketContext";
import {decryptAES, encryptAES} from "../utils/encryption";

interface EncryptionPluginOptions {
    secretKey: string;
    encryptEvents?: string[];
    decryptEvents?: string[];
}

export const encryptionPlugin = ({
                                     secretKey,
                                     encryptEvents = [],
                                     decryptEvents = [],
                                 }: EncryptionPluginOptions) => {
    const emitMiddleware: EmitMiddleware = (event, data, next) => {
        if (encryptEvents.includes(event)) {
            try {
                const plaintext = JSON.stringify(data);
                const encrypted = encryptAES(plaintext, secretKey);
                next(event, encrypted);
            } catch (err) {
                console.error("Encryption error:", err);
                next(event, data);
            }
        } else {
            next(event, data);
        }
    };

    const onMiddleware: OnMiddleware = (event, data, next) => {
        if (decryptEvents.includes(event)) {
            try {
                const decryptedStr = decryptAES(data, secretKey);
                const decryptedData = JSON.parse(decryptedStr);
                next(decryptedData);
            } catch (err) {
                console.error("Decryption error:", err);
                next(data);
            }
        } else {
            next(data);
        }
    };

    return {emitMiddleware, onMiddleware};
};
