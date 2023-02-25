import { connect } from '@planetscale/database';
import { config } from 'dotenv';

config();

export const db = connect({
  host: process.env.PLANETSCALE_HOST as string,
  username: process.env.PLANETSCALE_USER as string,
  password: process.env.PLANETSCALE_PASSWORD as string,
});
