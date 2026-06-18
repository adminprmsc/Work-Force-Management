declare const _default: () => {
    port: number;
    cors: {
        origins: string[];
    };
    database: {
        url: string | undefined;
    };
    jwt: {
        secret: string | undefined;
        expiresIn: string;
    };
};
export default _default;
