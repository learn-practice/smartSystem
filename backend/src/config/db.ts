import { Pool } from 'pg';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

// Force Node.js DNS to prefer IPv4 to avoid ENETUNREACH on IPv6 in production
dns.setDefaultResultOrder('ipv4first');

const connectionString = (process.env.DATABASE_URL || '').replace(/[&?]family=\d/, '');

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected DB error', err);
});
