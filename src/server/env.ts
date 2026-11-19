import "server-only";

/**
 * Centralised, validated access to server environment variables.
 *
 * Nothing here throws at import time: a missing credential must degrade the
 * application to demo mode, never crash the UI.
 */

function read(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export const env = {
  siteUrl: read("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000",
  isProduction: process.env.NODE_ENV === "production",

  db: {
    uri: read("MONGODB_URI"),
    database: read("MONGODB_DB_NAME") || "portfolio",
    driver: read("DB_DRIVER"),
    atlas: {
      apiKey: read("MONGODB_ATLAS_API_KEY"),
      orgId: read("MONGODB_ATLAS_ORG_ID"),
      projectId: read("MONGODB_ATLAS_PROJECT_ID"),
      clusterName: read("MONGODB_ATLAS_CLUSTER_NAME") || "portfolio-cluster",
    },
  },

  media: {
    driver: read("MEDIA_DRIVER"),
    cloudinary: {
      cloudName: read("CLOUDINARY_CLOUD_NAME"),
      apiKey: read("CLOUDINARY_API_KEY"),
      apiSecret: read("CLOUDINARY_API_SECRET"),
    },
  },

  session: {
    secret: read("SESSION_SECRET"),
  },

  admin: {
    email: read("ADMIN_EMAIL"),
    password: read("ADMIN_PASSWORD"),
  },

  mail: {
    resendApiKey: read("RESEND_API_KEY"),
    toEmail: read("CONTACT_TO_EMAIL"),
    fromEmail: read("CONTACT_FROM_EMAIL") || "Portfolio <onboarding@resend.dev>",
  },

  seedDummy: read("SEED_DUMMY").toLowerCase() === "true",
} as const;

export function hasMongoCredentials(): boolean {
  return Boolean(env.db.uri);
}

export function hasCloudinaryCredentials(): boolean {
  const { cloudName, apiKey, apiSecret } = env.media.cloudinary;
  return Boolean(cloudName && apiKey && apiSecret);
}
