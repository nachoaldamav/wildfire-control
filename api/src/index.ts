import { Hono } from 'hono';
import { connect } from '@planetscale/database';
import getActivation from './libs/getActivation';
import { getActivations } from './libs/scan-activations';

type GeoJSONRes = {
  files: string[];
  geojson: any;
};

type Bindings = {
  MY_BUCKET: R2Bucket;
  PLANETSCALE_HOST: string;
  PLANETSCALE_USER: string;
  PLANETSCALE_PASSWORD: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => c.json({ message: 'Hello, world!' }));

app.get('/activations', async (c) => {
  const activations = await getActivations();
  return c.json(activations);
});

app.get('/activations/:id', async (c) => {
  const id = c.req.param('id');
  const activations = await getActivation(id);
  return c.json(activations);
});

app.get('/activations/:id/geojson', async (c) => {
  const id = c.req.param('id');

  const response = await fetch(
    `https://geojson-api-production.up.railway.app/geojson/${id}`
  );
  const geojson = (await response.json()) as GeoJSONRes;

  return c.json(geojson);
});

export default app;
