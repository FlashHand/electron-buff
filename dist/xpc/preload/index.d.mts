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

export { type XpcPayload, type XpcRendererApi, xpcHandlers, xpcRenderer };
