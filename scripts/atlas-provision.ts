/**
 * Provisions the MongoDB Atlas project using the Atlas Admin API.
 *
 * It creates (or updates) the application database user, makes sure the IP
 * access list allows the deployment platform, and prints the SRV connection
 * string for `MONGODB_URI`.
 *
 * Usage:
 *   MONGODB_ATLAS_API_KEY="publicKey:privateKey" \
 *   MONGODB_ATLAS_ORG_ID=... \
 *   MONGODB_ATLAS_PROJECT_ID=... \
 *   npm run atlas:provision
 *
 * Note: the Atlas Data API (API-key based HTTP CRUD) was retired on
 * 30 September 2025 — this script talks to the *management* API, while the
 * application itself connects with the native driver over SRV.
 */

const API = "https://cloud.mongodb.com/api/atlas/v2";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

function authHeader(apiKey: string): string {
  const decoded = (() => {
    try {
      return Buffer.from(apiKey, "base64").toString("utf8");
    } catch {
      return apiKey;
    }
  })();

  const separator = decoded.includes(":") ? ":" : "-";
  const [publicKey, privateKey] = decoded.split(separator);
  if (!publicKey || !privateKey) {
    console.error(
      "MONGODB_ATLAS_API_KEY must be the public and private key pair joined by ':'.",
    );
    process.exit(1);
  }

  return `Basic ${Buffer.from(`${publicKey}:${privateKey}`).toString("base64")}`;
}

async function main() {
  const apiKey = required("MONGODB_ATLAS_API_KEY");
  const projectId = required("MONGODB_ATLAS_PROJECT_ID");
  const orgId = process.env.MONGODB_ATLAS_ORG_ID?.trim() ?? "";
  const username = process.env.MONGODB_DB_USER?.trim() || "portfolio-app";
  const password = process.env.MONGODB_DB_PASSWORD?.trim() || crypto.randomUUID();
  const database = process.env.MONGODB_DB_NAME?.trim() || "portfolio";
  const allowAnyIp = process.env.MONGODB_ALLOW_ANY_IP !== "false";

  const headers = {
    Authorization: authHeader(apiKey),
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const base = orgId ? `${API}/groups/${orgId}` : `${API}/groups/${projectId}`;

  // 1. Database user -------------------------------------------------------
  console.log(`→ ensuring database user “${username}”`);
  const userResponse = await fetch(`${base}/databaseUsers`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      username,
      password,
      roles: [{ roleName: "readWriteAnyDatabase", databaseName: "admin" }],
      awsIAMType: "NONE",
    }),
  });

  if (userResponse.status === 409) {
    console.log("· user already exists — updating the password");
    const update = await fetch(`${base}/databaseUsers/${username}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        password,
        roles: [{ roleName: "readWriteAnyDatabase", databaseName: "admin" }],
      }),
    });
    if (!update.ok) {
      console.error("Could not update the database user:", await update.text());
      process.exit(1);
    }
  } else if (!userResponse.ok) {
    console.error("Could not create the database user:", await userResponse.text());
    process.exit(1);
  }

  // 2. IP access list ------------------------------------------------------
  if (allowAnyIp) {
    console.log("→ ensuring the IP access list allows any IP (0.0.0.0/0)");
    const listResponse = await fetch(`${base}/accessList`, {
      method: "GET",
      headers,
    });

    const existing = listResponse.ok
      ? ((await listResponse.json()) as { results?: { ipAddress?: string }[] })
          .results ?? []
      : [];

    if (!existing.some((entry) => entry.ipAddress === "0.0.0.0/0")) {
      const patch = await fetch(`${base}/accessList`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          entries: [{ ipAddress: "0.0.0.0/0", accessType: "ALLOW" }],
        }),
      });
      if (!patch.ok) {
        console.error("Could not update the access list:", await patch.text());
      }
    } else {
      console.log("· access list already allows any IP");
    }
  }

  // 3. Connection string ---------------------------------------------------
  console.log("→ reading the cluster connection string");
  const clustersResponse = await fetch(`${base}/clusters`, { headers });
  let connectionString = "";

  if (clustersResponse.ok) {
    const clusters = (await clustersResponse.json()) as {
      results?: { name: string; connectionStrings?: { standard?: string } }[];
    };
    const cluster =
      clusters.results?.find((entry) =>
        entry.connectionStrings?.standard?.includes("mongodb+srv"),
      ) ?? clusters.results?.[0];
    connectionString = cluster?.connectionStrings?.standard ?? "";
  }

  console.log("\n──────────────────────────────────────────────");
  console.log("Add these to your .env.local:\n");
  console.log(`MONGODB_URI=${connectionString || "<copy the SRV string from Atlas>"}`);
  console.log(`MONGODB_DB_NAME=${database}`);
  console.log(`MONGODB_DB_USER=${username}`);
  console.log(`MONGODB_DB_PASSWORD=${password}`);
  console.log("──────────────────────────────────────────────\n");
  console.log(
    "If the SRV string is empty, open Atlas → Connect → Drivers and copy it manually.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
