import "server-only";

import mongoose from "mongoose";

import { env } from "@/server/env";

let connection: Promise<typeof mongoose> | null = null;

/**
 * Lazily opens (and memoises) the MongoDB connection.
 *
 * `bufferCommands: false` makes queries fail fast instead of hanging when
 * the cluster is unreachable — the registry relies on that to fall back to
 * the local driver without blocking a request.
 */
export async function connectMongo(uri: string): Promise<typeof mongoose> {
  if (!connection) {
    connection = mongoose
      .connect(uri, {
        dbName: env.db.database,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10_000,
        maxPoolSize: 10,
        bufferCommands: false,
      })
      .then((m) => m)
      .catch((error: unknown) => {
        connection = null;
        throw error;
      });
  }
  return connection;
}

export async function disconnectMongo(): Promise<void> {
  if (!connection) return;
  await connection.then((m) => m.disconnect()).catch(() => undefined);
  connection = null;
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
