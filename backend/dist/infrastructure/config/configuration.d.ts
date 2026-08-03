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
    supabase: {
        url: string;
        secretKey: string;
        storageBucket: string;
        signedUrlTtlSeconds: number;
        uploadMaxMb: number;
        apkUploadMaxMb: number;
    };
};
export default _default;
