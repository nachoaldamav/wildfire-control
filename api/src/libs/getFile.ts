import { load } from 'cheerio';
import AdmZip from 'adm-zip';

export async function getFile(url: string) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = load(html);

  // Get the files from the page with the ID ".view-content > .views-row"
  const items = $('.view-content > .views-row')
    .map((i, el) => {
      const link = $(el).find(
        '.views-field-field-component-file-vectors > div > a'
      );
      const title = $(el).find('.views-field-title > span').text();

      return {
        title: title,
        link: link.attr('href')
          ? 'https://emergency.copernicus.eu/' + link.attr('href')
          : undefined,
      };
    })
    .get();

  const zipUrl = items.find((item) => item.link)?.link;

  if (!zipUrl) {
    return;
  }

  const form = new FormData();
  form.append('confirmation', '1');
  form.append('op', 'Download file');
  form.append('form_id', 'emsmapping_disclaimer_download_form');

  const options = {
    method: 'POST',
    headers: {
      'content-type':
        'multipart/form-data; boundary=---011000010111000001101001',
    },
    body: form,
  };

  const zipRes = await fetch(zipUrl, options);
  const zipBuffer = await zipRes.arrayBuffer();

  // Return the file as a buffer
  return zipBuffer;
}
