import { load } from 'cheerio';
import { writeFileSync } from 'fs';

const url = 'https://emergency.copernicus.eu/mapping/list-of-activations-rapid';

export async function getActivations() {
  const html = await fetch(url);

  const $ = load(await html.text());

  // Get the table inside "view-content" div
  const table = $('.view-content table');

  // Get the rows of the table
  const rows = table.find('tr');

  const activations: Activation[] = [];

  // Iterate over the rows
  rows.each((i, row) => {
    // Get the columns of the row
    const columns = $(row).find('td');
    // The first column is the activation information, it shows a red square if the activation is currently active
    const activationInfo = columns.eq(0).find('div');
    // If is active, the column has the following style "background-color:#75b127"
    const isActive =
      activationInfo.attr('style') === 'background-color:#75b127';
    // The second column is the activation code, remove the empty spaces
    const activationCode = columns.eq(1).text().trim();
    // The third column is the activation name
    const activationName = columns.eq(2).text().trim();
    // The fourth column is the activation date
    const activationDate = columns.eq(3).text().trim();
    // The fifth column is the activation Type
    const activationType = columns.eq(4).text().trim();
    // The sixth column is the activation Country
    const activationCountry = columns.eq(5).text().trim();
    // The seventh column has some links, the first link is the RSS feed, is the one we are interested in
    const rssLink =
      (columns.eq(6).find('a').eq(0).attr('href') as string) || '';

    activations.push({
      isActive,
      activationCode,
      activationName,
      activationDate,
      activationType,
      activationCountry,
      rssLink: `https://emergency.copernicus.eu/mapping/${rssLink}`,
    });
  });

  // We only want the "Wildfire" activations
  return activations.filter((a) => a.activationType.includes('Wildfire'));
}

type Activation = {
  isActive: boolean;
  activationCode: string;
  activationName: string;
  activationDate: string;
  activationType: string;
  activationCountry: string;
  rssLink: string;
};
