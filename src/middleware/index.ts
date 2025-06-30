import {EmitMiddleware, OnMiddleware} from "../context/SocketContext";

type MiddlewareEntry = {
    id: string;
    emit?: EmitMiddleware;
    on?: OnMiddleware;
};

export class MiddlewareManager {
    private middlewares: MiddlewareEntry[] = [];

    addMiddleware(entry: MiddlewareEntry): string {
        this.middlewares.push(entry);
        return entry.id;
    }

    removeMiddleware(id: string) {
        this.middlewares = this.middlewares.filter((m) => m.id !== id);
    }

    runEmit(event: string, data: any, finalEmit: (e: string, d: any) => void) {
        let index = -1;
        const middlewares = this.middlewares.filter((m) => m.emit !== undefined);

        const next = (ev: string, dt: any) => {
            index++;
            if (index < middlewares.length) {
                middlewares[index].emit!(ev, dt, next);
            } else {
                finalEmit(ev, dt);
            }
        };
        next(event, data);
    }

    runOn(event: string, data: any, finalHandler: (d: any) => void) {
        let index = -1;
        const middlewares = this.middlewares.filter((m) => m.on !== undefined);

        const next = (dt: any) => {
            index++;
            if (index < middlewares.length) {
                middlewares[index].on!(event, dt, next);
            } else {
                finalHandler(dt);
            }
        };
        next(data);
    }
}
