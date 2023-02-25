import { parseStringPromise } from 'xml2js';

export default async function getActivation(id: string) {
  const url = `https://emergency.copernicus.eu/mapping/list-of-components/${id}/aemfeed`;
  const xml = await fetch(url);
  const xmlString = await xml.text();
  const json = await parseStringPromise(xmlString);

  const items = json.rss.channel[0].item as Root;

  return items
    .map((item) => {
      const coords = item['georss:polygon'][0].split(' ');
      const pairs = [];

      for (let i = 0; i < coords.length; i += 2) {
        pairs.push([Number(coords[i + 1]), Number(coords[i])]);
      }

      return {
        title: item.title[0],
        link: item.link[0],
        description: item.description[0],
        category: item.category[0],
        guid: item.guid[0]._,
        source: item.source[0]._,
        internal_id: item['gdacs:cemsaoi'][0],
        polygon: item['georss:polygon'][0],
        geojson: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [pairs],
          },
        },
        pubDate: item.pubDate ? item.pubDate[0] : undefined,
        'gdacs:thumbnail': item['gdacs:thumbnail']
          ? item['gdacs:thumbnail'][0]
          : undefined,
        'gdacs:cemsptype': item['gdacs:cemsptype']
          ? item['gdacs:cemsptype'][0]
          : undefined,
        'gdacs:cemsctype': item['gdacs:cemsctype']
          ? item['gdacs:cemsctype'][0]
          : undefined,
        'gdacs:cemsmonit': item['gdacs:cemsmonit']
          ? item['gdacs:cemsmonit'][0]
          : undefined,
      };
    })
    .sort((a, b) => {
      if (a.pubDate && b.pubDate) {
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      }

      return 0;
    });
}

export type Root = Root2[];

export interface Root2 {
  title: string[];
  link: string[];
  description: string[];
  category: string[];
  guid: Guid[];
  source: Source[];
  'gdacs:cemsaoi': string[];
  'georss:polygon': string[];
  pubDate?: string[];
  'gdacs:thumbnail'?: string[];
  'gdacs:cemsptype'?: string[];
  'gdacs:cemsctype'?: string[];
  'gdacs:cemsmonit'?: string[];
}

export interface Guid {
  _: string;
  $: GeneratedType;
}

export interface GeneratedType {
  isPermaLink: string;
}

export interface Source {
  _: string;
  $: GeneratedType2;
}

export interface GeneratedType2 {
  url: string;
}
