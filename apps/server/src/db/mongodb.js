import { MongoClient } from "mongodb";
import { MONGODB_URI, NODE_ENV } from "@/lib/env";

/**
 * Ensure a MongoDB connection string is configured at startup.
 * The server fails fast if this is missing to avoid undefined runtime behavior.
 */
if (!MONGODB_URI) {
  throw new Error("Please add your MONGODB_URI to .env.local");
}

/**
 * Cached MongoClient instance.
 * Used to avoid creating multiple clients within the same runtime.
 *
 * @type {MongoClient | null}
 */
let client = null;

/**
 * Shared MongoClient connection promise.
 * In development, this is cached globally to survive HMR reloads.
 *
 * @type {Promise<MongoClient> | null}
 */
let clientPromise = null;

if (NODE_ENV === "development") {
  /**
   * Development mode:
   * Reuse a single MongoDB connection across hot reloads by storing
   * the connection promise on the global object.
   */
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  /**
   * Production mode:
   * Create one MongoDB client per runtime instance and reuse its connection pool
   * across requests handled by that instance.
   */
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

/**
 * Export the shared MongoClient connection promise.
 *
 * This can be awaited directly by callers that need access to the raw client.
 *
 * @type {Promise<MongoClient>}
 */
export default clientPromise;

/**
 * Retrieve a MongoDB database handle.
 *
 * This helper ensures all callers share the same underlying MongoClient
 * while allowing the database name to be overridden if needed.
 *
 * @param {string} [dbName="argon"] Name of the MongoDB database.
 * @returns {Promise<import("mongodb").Db>} Connected MongoDB database instance.
 */
export async function getDb(dbName = "argon") {
  const c = await clientPromise;
  return c.db(dbName);
}
