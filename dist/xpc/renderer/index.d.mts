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

/**
 * Direct reference to window.xpcRenderer exposed by the preload script.
 * Import this in renderer (browser) code to use xpcRenderer without manual window casting.
 */
declare const xpcRenderer: XpcRendererApi;

export { type XpcPayload, type XpcRendererApi, xpcRenderer };
