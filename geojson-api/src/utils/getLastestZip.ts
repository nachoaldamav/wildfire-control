import { load } from 'cheerio';
import axios from 'axios';

export async function getLastestZip(url: string) {
  const response = await axios.get(url);
  const $ = load(response.data);
  const link = $('a[href*="zip"]').attr('href');

  return 'https://emergency.copernicus.eu/' + link;
}
