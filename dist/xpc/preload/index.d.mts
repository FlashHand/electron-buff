type XpcPayload = {
    /** Unique task ID, guaranteed unique within process lifetime */
    id: string;
    /** Event handle name */
    handleName: string;
    /** Parameters, nullable */
    params?: any;
    /** Return data from target process, nullable, defaults to null */
    ret?: any;
};
type XpcRendererApi = {
    handle: (handleName: string, handler: (payload: XpcPayload) => Promise<any>) => void;
    removeHandle: (handleName: string) => void;
    send: (handleName: string, params?: any) => Promise<any>;
};

type XpcHandler = (payload: XpcPayload) => Promise<any>;
/** Global handlers map, extracted from XpcRenderer class */
declare const xpcHandlers: Map<string, XpcHandler>;

/** The xpcRenderer API instance */
declare const xpcRenderer: XpcRendererApi;

/**
 * Base class for preload-process xpc handlers.
 * Subclass this and define async methods — they will be auto-registered
 * as xpc handlers with channel `xpc:ClassName/methodName`.
 *
 * Example:
 * ```ts
 * class UserTable extends XpcPreloadHandler {
 *   async getUserList(params?: any): Promise<any> { ... }
 * }
 * const userTable = new UserTable();
 * // auto-registers handler for 'xpc:UserTable/getUserList'
 * ```
 */
declare class XpcPreloadHandler {
    constructor();
}

/**
 * Helper: checks if a function type has at most 1 parameter.
 * Returns the function type itself if valid, `never` otherwise.
 */
type AssertSingleParam<F> = F extends () => any ? F : F extends (p: any) => any ? F extends (p: any, q: any, ...rest: any[]) => any ? never : F : never;
/**
 * Utility type: extracts the method signatures from a handler class,
 * turning each method into an emitter-compatible signature.
 * Methods with 2+ parameters are mapped to `never`, causing a compile error on use.
 */
type XpcEmitterOf<T> = {
    [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: AssertSingleParam<T[K]> extends never ? never : T[K] extends (params: infer P) => any ? (params: P) => Promise<any> : () => Promise<any>;
};

/**
 * Create a type-safe emitter proxy for a preload-process xpc handler.
 * The emitter mirrors the handler's method signatures, but each call
 * sends a message via xpcRenderer.send() to `xpc:ClassName/methodName`.
 *
 * Example:
 * ```ts
 * class UserTable extends XpcPreloadHandler {
 *   async getUserList(params?: any): Promise<any> { ... }
 * }
 * const userTableEmitter = createXpcPreloadEmitter<UserTable>('UserTable');
 * const list = await userTableEmitter.getUserList({ page: 1 });
 * // sends to 'xpc:UserTable/getUserList'
 * ```
 */
declare const createXpcPreloadEmitter: <T>(className: string) => XpcEmitterOf<T>;

export { type XpcEmitterOf, type XpcPayload, XpcPreloadHandler, type XpcRendererApi, createXpcPreloadEmitter, xpcHandlers, xpcRenderer };
