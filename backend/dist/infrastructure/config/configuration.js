"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT ?? '3000', 10),
    cors: {
        origins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:3000')
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean),
    },
    database: {
        url: process.env.DATABASE_URL,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    },
    supabase: {
        url: process.env.SUPABASE_URL ?? '',
        secretKey: process.env.SUPABASE_SECRET_KEY ?? '',
        storageBucket: process.env.SUPABASE_STORAGE_BUCKET ??
            (process.env.NODE_ENV === 'production' ? 'PROD' : 'LOCAL'),
        signedUrlTtlSeconds: parseInt(process.env.SUPABASE_SIGNED_URL_TTL_SECONDS ?? '3600', 10),
        uploadMaxMb: parseInt(process.env.SUPABASE_UPLOAD_MAX_MB ?? '10', 10),
        apkUploadMaxMb: parseInt(process.env.SUPABASE_APK_UPLOAD_MAX_MB ?? '200', 10),
    },
});
//# sourceMappingURL=configuration.js.map