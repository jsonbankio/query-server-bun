import {Env} from "@xpresser/env";

let envDir = (import.meta as any).dir;

// If running in javascript mode, i.e running form dist, set envDir to parent.
if (envDir.endsWith("/dist")) {
    envDir = envDir.slice(0, envDir.length - 5);
    console.log("Env directory:", envDir);
}


// Validate Env
export const env = Env(envDir, {
    NODE_ENV: Env.is.enum(["development", "production"], "development"),
    APP_NAME: Env.is.string("Jsonbank Query Server"),
    JSB_QUERY_SERVER_PORT: Env.is.number(2224),
    // Max Content Size in megabytes
    JSB_QUERY_SERVER_MAX_CONTENT_SIZE: Env.is.number(2),
});
