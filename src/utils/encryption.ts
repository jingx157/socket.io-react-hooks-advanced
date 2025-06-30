import CryptoJS from "crypto-js";

export const encryptAES = (plaintext: string, secretKey: string): string => {
    return CryptoJS.AES.encrypt(plaintext, secretKey).toString();
};

export const decryptAES = (ciphertext: string, secretKey: string): string => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};
