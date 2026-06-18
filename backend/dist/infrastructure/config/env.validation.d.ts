declare class EnvironmentVariables {
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
}
export declare function validate(config: Record<string, unknown>): EnvironmentVariables;
export {};
