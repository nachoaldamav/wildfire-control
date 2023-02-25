import { connect } from '@planetscale/database';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  host: process.env.PLANETSCALE_HOST,
  username: process.env.PLANETSCALE_USER,
  password: process.env.PLANETSCALE_PASSWORD,
};

console.log('Connecting to Planetscale with the following credentials:');
console.log({
  host: process.env.PLANETSCALE_HOST,
  username: process.env.PLANETSCALE_USER,
  password: process.env.PLANETSCALE_PASSWORD,
});

export const db = connect(config);
