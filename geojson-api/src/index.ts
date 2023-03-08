import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import chalk from 'chalk';
import axios from 'axios';
import getActivation from './utils/getActivation';
import { getLastestZip } from './utils/getLastestZip';
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { dirname, join } from 'path';
import decompress from 'decompress';
import { db } from './utils/db';

const port = parseInt(process.env.PORT) || 3001;

const app = new Hono();

app.use(
  '/geojson/*',
  cors({
    origin: '*',
  })
);

app.get('/', (c) => c.text('Hello Hono!'));
app.get('/geojson/:id', async (c) => {
  const id = c.req.param('id');

  const res = await db.execute(`SELECT * FROM map WHERE copernico_id = ?`, [
    id,
  ]);

  let expired = false;

  if (res.rows.length > 0) {
    const { geojson, updated_at } = res.rows[0] as any;
    // Get current timestamp in SQL format
    const nowTimestamp = new Date().getTime();
    const updated_atTimestamp = new Date(updated_at).getTime();
    console.log(
      chalk.green(
        `Cache found for ${id} (updated ${new Date(
          updated_at
        ).getTime()}, ${nowTimestamp} ms)`
      )
    );
    const diff = Math.abs(nowTimestamp - updated_atTimestamp);
    const diffDays = Math.floor(diff / (1000 * 3600 * 24));

    if (diffDays < 1) {
      return c.json({
        geojson: JSON.parse(geojson),
      });
    } else {
      console.log(
        chalk.yellow(
          `Cache expired for ${id} (updated ${diffDays} days ago, ${diff} ms)`
        )
      );
      expired = true;
    }
  }

  const activations = await getActivation(id);
  const url = `https://emergency.copernicus.eu/mapping/list-of-components/${id}/ALL/${activations[0].internal_id}`;
  const latestZip = await getLastestZip(url);

  console.log(`Getting ${latestZip}...`);

  const file = join(process.cwd(), 'artifacts', `${id}.zip`);

  if (existsSync(join(process.cwd(), 'artifacts', id))) {
    const { files, content } = getFiles(file, id, c);
    return c.json({
      files,
      geojson: content,
    });
  }

  if (!existsSync(join(process.cwd(), 'artifacts', `${id}.zip`))) {
    const form = new FormData();
    form.append('confirmation', '1');
    form.append('op', 'Download file');
    form.append('form_id', 'emsmapping_disclaimer_download_form');
    form.append(
      'form_build_id',
      'form-QlGMuAgERKUeZ61gFXi_xCfKbcKvHWFZ_A5fjuQo8yY'
    );

    // Download file and show progress in console
    const response = await axios({
      method: 'post',
      url: latestZip,
      data: form,
      responseType: 'stream',
    });

    if (!existsSync(dirname(file))) {
      mkdirSync(dirname(file));
    }

    // Write file to disk
    response.data.pipe(createWriteStream(file));

    await new Promise((resolve) => {
      response.data.on('end', () => {
        resolve('done');
      });
    });

    console.log(`Downloaded ${file}`);
  }

  console.log(`Decompressing ${file}...`);

  await decompress(file, join(dirname(file), id));

  console.log(`Decompressed ${file}`);

  const { files, content } = getFiles(file, id, c);

  if (!expired) {
    await db.execute(
      `INSERT INTO map (copernico_id, geojson, updated_at) VALUES (?, ?, ?)`,
      [id, JSON.stringify(content), new Date().getTime()]
    );
  } else {
    db.execute(
      `UPDATE map SET geojson = ?, updated_at = ? WHERE copernico_id = ?`,
      [JSON.stringify(content), new Date().getTime(), id]
    );
  }

  return c.json({
    files,
    geojson: content,
  });
});

console.log(
  chalk.green(
    `Listening on port ${port} ${chalk.gray(`http://localhost:${port}`)}`
  )
);

serve({
  port,
  fetch: app.fetch.bind(app),
});

function getFiles(file: string, id: string, c) {
  const files = readdirSync(join(dirname(file), id))
    .map((file) => {
      return {
        name: file,
        path: join(dirname(file), id, file),
      };
    })
    .filter((file) => file.name.endsWith('.json'));

  let geojsonFile = files.find((file) => file.name.includes('observedEventA'));

  if (!geojsonFile) {
    geojsonFile = files.find((file) => file.name.includes('imageFootprintA'));
  }

  const content = JSON.parse(
    readFileSync(join(dirname(file), id, geojsonFile.name), 'utf8')
  );
  return { files, content };
}
