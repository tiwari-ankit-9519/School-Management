import "dotenv/config";
import { Pool } from "pg";

console.log(process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

pool
  .connect()
  .then((c) => {
    console.log("DB OK");
    c.release();
    process.exit(0);
  })
  .catch((e) => {
    console.error("DB FAILED:", e.message);
    process.exit(1);
  });
