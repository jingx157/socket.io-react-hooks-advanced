# socket.io-react-hooks-advanced

A modular and extensible React + Socket.IO hook library designed for real-world applications. Supports namespaced
sockets, reconnection strategies, offline queues, latency monitoring, middleware, encryption, and more.

---

## ✨ Features

- ✅ **Auto-Reconnect** with exponential backoff, customizable retry strategy
- ✅ **Token Injection** with support for refresh on unauthorized (401 responses)
- ✅ **Latency Monitoring**: track round-trip latency in real time (ping-pong events)
- ✅ **Offline Background Queue**: queue `emit` calls while offline, flush after reconnect
- ✅ **LocalStorage Queue Persistence**: retain queue across page reloads, with TTL expiration
- ✅ **Middleware** for intercepting and transforming outgoing/incoming socket events
- ✅ **AES Encryption** of payloads (optional, using `crypto-js`)
- ✅ **Namespaced Socket Providers** with `createNamespacedSocket()` for modular isolation
- ✅ **Fully Typed Hooks**: `useSocketContext`, `useSocketEvent`, `useLatency`, etc.
- ✅ **Timeout-based ack() emits**: emit events with callback, with timeout fallback behavior
- ✅ **Event Subscription Helpers**: auto cleanup with `useSocketEvent()` hook
- ✅ **Queue Overflow Handling**: detect and manage maximum queue size violations
- ✅ **Scoped Event Middleware**: different middlewares per namespace
- ✅ **Integrated Debug Logging**: toggle log output for development

---

## 📦 Installation

```bash
npm install socket.io-react-hooks-advanced
```

Also install peer dependencies:

```bash
npm install react socket.io-client crypto-js
```

---

## 🧠 Basic Usage

```tsx
import {SocketProvider, useSocketContext} from "socket.io-react-hooks-advanced";

function App() {
    return (
        <SocketProvider url="http://localhost:3000" getToken={() => localStorage.getItem("token")}>
            <Main/>
        </SocketProvider>
    );
}

function Main() {
    const {socket, emit, connected} = useSocketContext();

    return (
        <div>
            <p>Connected: {connected ? "Yes" : "No"}</p>
            <button onClick={() => emit("message", {text: "Hi"})}>Send</button>
        </div>
    );
}
```

---

## 🧪 Namespaced Sockets

```tsx
// chatSocket.ts
import {createNamespacedSocket} from "socket.io-react-hooks-advanced";

export const chatSocket = createNamespacedSocket();

// App.tsx
<chatSocket.Provider url="http://localhost:3000" namespace="/chat">
    <Chat/>
</chatSocket.Provider>

// Chat.tsx
const {socket, emit} = chatSocket.useSocket();
```

You can create and use multiple isolated namespaces simultaneously.

---

## 📊 Latency Monitoring

```tsx
import {useLatency} from "socket.io-react-hooks-advanced";

const PingIndicator = () => {
    const latency = useLatency();
    return <div>Ping: {latency ?? "..."} ms</div>;
};
```

Latency is measured using `ping`/`pong` roundtrip at regular intervals.

---

## 🔐 Encrypted Emit

```tsx
emit("secure-data", {value: "secret"}, {encrypt: true});
```

Enable encryption in provider:

```tsx
<SocketProvider
    url="http://localhost:3000"
    encryptionKey="my-secret-key"
    useEncryption={true}
>
    <App/>
</SocketProvider>
```

> Server must also decrypt the payload using the same AES key.

---

## ⚙️ Provider Options

| Prop              | Type                              | Description                        |
|-------------------|-----------------------------------|------------------------------------|
| `url`             | `string`                          | Required socket server URL         |
| `namespace`       | `string?`                         | Socket.IO namespace                |
| `getToken`        | `() => string \| Promise<string>` | JWT token retriever                |
| `onUnauthorized`  | `() => string \| Promise<string>` | Token refresh when unauthorized    |
| `maxRetries`      | `number`                          | Max reconnection attempts          |
| `initialDelayMs`  | `number`                          | Backoff initial delay              |
| `backoffFactor`   | `number`                          | Backoff multiplier                 |
| `persistQueue`    | `boolean`                         | Save queue in `localStorage`       |
| `queueKey`        | `string`                          | Storage key name                   |
| `queueTTL`        | `number`                          | Expiry in ms for stored queue      |
| `maxQueueSize`    | `number`                          | Maximum offline queue size         |
| `onQueueOverflow` | `(event) => void`                 | Called when queue exceeds max size |
| `useEncryption`   | `boolean`                         | Enable payload encryption          |
| `encryptionKey`   | `string`                          | AES key for encryption             |
| `debug`           | `boolean`                         | Log connection/retry/status info   |

---

## 🧰 Hooks API

### `useSocketContext()`

Returns:

- `socket`: active socket instance
- `connected`: current connection status
- `emit(event, data, options)`: emit with ack/encryption
- `queue`: access queued events
- `latency`: current latency in ms

### `useSocketEvent(event, handler)`

Subscribes to a specific event and removes it automatically on unmount.

### `useLatency()`

Returns current `ping`/`pong` latency (updated every 5s).

### `useConnectionStatus()`

Returns the current socket lifecycle status, one of:

- `"connecting"`
- `"connected"`
- `"reconnecting"`
- `"disconnected"`
- `"unauthorized"`
- `"failed"`

Example usage:

```tsx
import {useConnectionStatus} from "socket.io-react-hooks-advanced";

function StatusTag() {
    const status = useConnectionStatus();
    return <p>Status: <strong>{status}</strong></p>;
}
```

---

## 🧱 Example: Multi-Namespace Setup

```tsx
const notifSocket = createNamespacedSocket();
const gameSocket = createNamespacedSocket();

<notifSocket.Provider url="..." namespace="/notif">
    <gameSocket.Provider url="..." namespace="/game">
        <App/>
    </gameSocket.Provider>
</notifSocket.Provider>
```

Each namespaced socket provider is fully isolated.

---

## 📦 Offline Queue Handling

- Emit calls made when disconnected are pushed to a queue
- On reconnect, queued emits are flushed to server
- Optionally persisted in `localStorage` with TTL
- Overflow handler called if queue exceeds `maxQueueSize`

Queue is type-safe and timestamped for tracing/debugging.

---

## 🧩 Middleware Support

Register middleware to intercept emit or received events:

```ts
registerMiddleware({
    onOutgoing: (event, data) => encrypt(data),
    onIncoming: (event, data) => decrypt(data),
});
```

Scoped middleware can also be registered per namespace.

---

## 🔐 AES Encryption

AES-256 encryption is implemented using `crypto-js`. Encryption must be enabled with a shared key:

```tsx
<SocketProvider
    url="..."
    encryptionKey="shared-secret-key"
    useEncryption={true}
>
    <App/>
</SocketProvider>
```

### How it works:

- `emit(..., { encrypt: true })` wraps payload
- Middleware encrypts using AES
- Server must decrypt with same key (Node.js: `crypto`)

---

## 🌐 TypeScript Support

All types are exposed and extensible:

- `SocketContextType`
- `QueuedEmit`
- `SocketProviderProps`
- `NamespacedSocket`
- `SocketEmitOptions`

Works out of the box with strict TypeScript settings.

---

## 🧪 Example: Emit with ACK and Timeout

```tsx
emit("joinRoom", {roomId: 123}, {
    ack: (response) => console.log("joined", response),
    timeout: 3000,
});
```

---

## 📜 License

MIT © [Jingx](https://github.com/jingx157/socket.io-react-hooks-advanced)

---

Feel free to contribute, submit issues, or request enhancements!

> Built with ❤️ for scalable, socket-driven apps.
