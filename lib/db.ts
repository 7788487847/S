// 数据库连接单例：发布环境连接平台托管 Postgres，开发沙箱使用 PGlite。
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { PGlite } from "@electric-sql/pglite";
import { mkdir, rename } from "node:fs/promises";
import * as schema from "@/db/schema";

type Db = ReturnType<typeof drizzleNodePg<typeof schema>>;
let dbPromise: Promise<Db> | undefined;

async function openLocalDatabase(dir: string): Promise<Db> {
  await mkdir(dir, { recursive: true });
  const client = new PGlite(dir);
  const db = drizzlePglite({ client, schema });
  await migratePglite(db, { migrationsFolder: "./drizzle" });
  return db as unknown as Db;
}

async function init(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith("postgres")) {
    return drizzleNodePg(url, { schema });
  }

  // Vercel 没有持久化磁盘，正式环境必须连接托管 PostgreSQL。
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL_NOT_CONFIGURED");
  }

  const dir = "./data/pg";
  try {
    return await openLocalDatabase(dir);
  } catch (error) {
    // 此分支只会在开发环境进入；隔离损坏的本地数据库后重新执行版本化迁移。
    const backup = `./data/pg-corrupt-${Date.now()}`;
    console.warn(`开发数据库无法打开，已隔离到 ${backup} 并重建。`, error);
    await rename(dir, backup).catch(() => undefined);
    return openLocalDatabase(dir);
  }
}

export function getDb(): Promise<Db> {
  dbPromise ??= init().catch((error) => {
    dbPromise = undefined;
    throw error;
  });
  return dbPromise;
}
