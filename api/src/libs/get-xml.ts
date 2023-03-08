import { parseStringPromise } from 'xml2js';

export async function getXml(url: string) {
  const xml = await fetch(url);
  const xmlString = await xml.text();
  const json = (await parseStringPromise(xmlString)) as FeedXML;

  return json.rss.channel[0].item
    .filter((item) => item.category.includes('Wildfire'))
    .map((item) => {
      // Convert arrays to strings
      const title = item.title[0];
      const link = item.link[0];
      const description = item.description[0];
      const category = item.category[0];
      const guid = item.guid[0]._ as string;
      const pubDate = item.pubDate[0];
      const source = item.source[0]._ as string;
      const thumbnail = item['gdacs:thumbnail'][0];
      const point = item['georss:point'][0];
      const actor = item['iwgsem:actor'][0];
      const activationGUID = item['iwgsem:activationGUID'][0];
      const activationName = item['iwgsem:activationName'][0];
      const activationEventType = item['iwgsem:activationEventType'][0];
      const activationPublished = item['iwgsem:activationPublished'][0];
      const activationLocation = item['iwgsem:activationLocation'][0];
      const activationAffectedCountries =
        item['iwgsem:activationAffectedCountries'][0];
      const activationDescription = item['iwgsem:activationDescription'][0];
      const activationLink = item['iwgsem:activationLink'][0];
      const activationStatus = item['iwgsem:activationStatus'][0];
      const activationPreview = item['iwgsem:activationPreview'][0];
      const activationRSS = item['iwgsem:activationRSS'][0];
      const eventType = item['gdacs:eventtype']?.[0];
      const eventId = item['gdacs:eventid']?.[0];
      const id = item['gdacs:id']?.[0];
      const gdacsLink = item['gdacs:link']?.[0];

      return {
        title,
        link,
        description,
        category,
        guid,
        pubDate,
        source,
        thumbnail,
        point,
        actor,
        activationGUID,
        activationName,
        activationEventType,
        activationPublished,
        activationLocation,
        activationAffectedCountries,
        activationDescription,
        activationLink,
        activationStatus,
        activationPreview,
        activationRSS,
        eventType,
        eventId,
        id,
        gdacsLink,
      };
    });
}

export interface FeedXML {
  rss: Rss;
}

export interface Rss {
  channel: Channel[];
}

export interface Channel {
  title: string;
  description: string;
  link: string[];
  language: string;
  category: string[];
  image: Image;
  copyright: string;
  managingEditor: string;
  webMaster: string;
  generator: string;
  docs: string;
  ttl: number;
  pubDate: string;
  lastBuildDate: string;
  item: Item[];
}

export interface Image {
  url: string;
  title: string;
  link: string;
  description: string;
}

export interface Item {
  title: string[];
  link: string[];
  description: string[];
  category: string[];
  guid: Guid[];
  pubDate: string[];
  source: Source[];
  'gdacs:thumbnail': string[];
  'georss:point': string[];
  'iwgsem:actor': string[];
  'iwgsem:activationGUID': string[];
  'iwgsem:activationName': string[];
  'iwgsem:activationEventType': string[];
  'iwgsem:activationPublished': string[];
  'iwgsem:activationLocation': string[];
  'iwgsem:activationAffectedCountries': string[];
  'iwgsem:activationDescription': string[];
  'iwgsem:activationLink': string[];
  'iwgsem:activationStatus': string[];
  'iwgsem:activationPreview': string[];
  'iwgsem:activationRSS': string[];
  'gdacs:eventtype'?: string[];
  'gdacs:eventid'?: string[];
  'gdacs:id'?: string[];
  'gdacs:link'?: string[];
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
