import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getXml } from './libs/get-xml';
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
  SERP_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

let cache = caches.default;

app.use('/*', cors({ origin: '*' }));

app.get('/', (c) => c.json({ message: 'Hello, world!' }));

app.get('/activations', async (c) => {
  const activations = await getActivations();
  return c.json(activations);
});

app.get('/activations-xml', async (c) => {
  const cached = await cache.match(c.req.url);

  if (cached) {
    const activations = await cached.json();
    return c.json(activations);
  }

  const activations = await getXml(
    'https://emergency.copernicus.eu/mapping/activations-rapid/feed'
  );

  await cache.put(
    c.req.url,
    new Response(JSON.stringify(activations), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'max-age=86400',
      },
    })
  );

  return c.json(activations);
});

app.get('/activations/:id', async (c) => {
  const id = c.req.param('id');

  const cached = await cache.match(c.req.url);

  if (cached) {
    const activations = await cached.json();
    return c.json(activations);
  }

  const activations = await getActivation(id);

  await cache.put(
    c.req.url,
    new Response(JSON.stringify(activations), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'max-age=86400',
      },
    })
  );

  return c.json(activations);
});

app.get('/activations/:id/geojson', async (c) => {
  const id = c.req.param('id');

  const cached = await cache.match(c.req.url);

  if (cached) {
    const activations = await cached.json();
    return c.json(activations);
  }

  const response = await fetch(
    `https://geojson-api-production.up.railway.app/geojson/${id}`
  );
  const geojson = (await response.json()) as GeoJSONRes;

  await cache.put(
    c.req.url,
    new Response(JSON.stringify(geojson), {
      // save for 1 day
      headers: {
        'content-type': 'application/json',
        'cache-control': 'max-age=86400',
      },
    })
  );

  return c.json(geojson);
});

app.get('/activations/:id/image', async (c) => {
  const id = c.req.param('id');
  const cached = await cache.match(c.req.url);

  if (cached) {
    const activations = await cached.json();
    return c.json(activations);
  }

  const activations = await getActivation(id);

  const response = await fetch(
    `https://serpapi.com/search.json?engine=google&q=${activations[0].source
      .slice(9)
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )}&google_domain=google.com&tbm=isch&ijn=0&gRecaptchaResponse=03AFY_a8VKt92use2OoswiRuqW-e2Uly-4S1HWyLdu-_VXsEHpytdmv4PUxJ_2qZlp1Kh0VODAY5h00A2anlioY7fpgIv4mPX5RH1MPpBxhlY7144W1gZVxlXAufuDkWJ3b5iLn8iB-A2QfqvZR9RKiZ6e7PK3gQrSluVOKO5HhmtGA2wshBKl10Q-_N744sSmgNZE9_zIoGP8J0E9SfhmUjPcyBeWEiWWA32FXWb7LKnfYeDRVbQav2psN1TRwqWS2hQn_NnUHTJFwSieJ3jZtvVDKFum_EWdOWQfGy3nz7mtC31Hd4ZBtqodbEAuyCDRnxW4MiaP_FSjJny0510-biIIoZUGergUzQEtHlT2kfp8nyXR823o4LYDvXULamxAESCJBSw4Sw5FyuLYISu6TWC92oCFB8gsz_fyivqIraENAypz96id_gELjM4EBzX3WJ99v1gkx2f_2DKyJHCAbg_-m5Rbwi1tw7IOaZ-Ii_3Ty2imYLvj5vpgxp2BECe39EVCW-3i6lTD&api_key=${
      c.env.SERP_API_KEY
    }`
  );
  const json = await response.json();

  await cache.put(
    c.req.url,
    new Response(JSON.stringify(json), {
      // save for 30 days
      headers: {
        'content-type': 'application/json',
        'cache-control': 'max-age=2592000',
      },
    })
  );

  const results = (json as any).images_results.sort((a: any, b: any) => {
    const sources = [
      'Bloomberg.com',
      'DW',
      'RTVE.es',
      'EFE',
      'AP',
      'AFP',
      'Reuters',
    ];
    const aIndex = sources.indexOf(a.source);
    const bIndex = sources.indexOf(b.source);

    if (aIndex === -1 && bIndex === -1) {
      return 0;
    }

    if (aIndex === -1) {
      return 1;
    }

    if (bIndex === -1) {
      return -1;
    }

    return aIndex - bIndex;
  });

  return c.json(results[0]);
});

export default app;
