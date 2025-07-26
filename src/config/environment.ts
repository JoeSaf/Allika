interface EnvironmentConfig {
  apiUrl: string;
  environment: "development" | "production" | "test";
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  version: string;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  const environment = (import.meta.env.VITE_NODE_ENV || "development") as EnvironmentConfig["environment"];

  return {
    apiUrl: import.meta.env.VITE_API_URL || "http://localhost:5000",
    environment,
    isDevelopment: environment === "development",
    isProduction: environment === "production",
    isTest: environment === "test",
    version: import.meta.env.VITE_APP_VERSION || "1.0.0",
  };
};

export const env = getEnvironmentConfig();

export default env;
