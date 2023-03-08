import type { Component } from 'solid-js';
import type { Feature, FeatureCollection } from 'geojson';
import { createSignal, createEffect } from 'solid-js';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/center';
import { default as bbox } from '@turf/bbox';
import { default as bboxPolygon } from '@turf/bbox-polygon';
import { default as area } from '@turf/area';
import { useSelectedWildfire } from '../context/selectedWildfire';
import { Wildfire } from './side-panel';

import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken =
  'pk.eyJ1IjoibmFjaG9hbGRhbWEiLCJhIjoiY2tpYncyM21uMGdvbTJ5azB1Y3hpbWd6cyJ9.Ud-MHZSsztzRigQQOprQsg';

const Map: Component = () => {
  const [selectedWildfire] = useSelectedWildfire();
  const [map, setMap] = createSignal<mapboxgl.Map | null>(null);
  const [lng, setLng] = createSignal(-74.5);
  const [lat, setLat] = createSignal(40);
  const [zoom, setZoom] = createSignal(9);

  // Wildfire info
  const [loadingBasicData, setLoadingBasicData] = createSignal(false);
  const [basicData, setBasicData] = createSignal<WildfireBasicData | null>(
    null
  );
  const [loadingHighResData, setLoadingHighResData] = createSignal(false);
  const [highResData, setHighResData] = createSignal<FeatureCollection | null>(
    null
  );
  const [wildfireImage, setWildfireImage] = createSignal<string | null>(null);

  const [downloading, setDownloading] = createSignal(false);

  createEffect(() => {
    if (!map()) {
      setMap(
        new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/nachoaldama/cle9urx8j001z01qsm0idyusr',
          center: [lng(), lat()],
          zoom: zoom(),
        })
      );
    }
  });

  createEffect(() => {
    if (map()) {
      map().on('move', () => {
        const coords = map().getCenter();
        const lng = parseFloat(coords.lng.toFixed(4));
        const lat = parseFloat(coords.lat.toFixed(4));
        const zoom = parseFloat(map().getZoom().toFixed(2));
        setLng(lng);
        setLat(lat);
        setZoom(zoom);
      });
    }
  });

  createEffect(() => {
    if (map() && selectedWildfire()) {
      // Remove wildfire from map
      if (map().getSource('wildfire')) {
        map().removeLayer('wildfire');
        map().removeSource('wildfire');
      }

      setBasicData(null);
      setHighResData(null);
      setWildfireImage(null);

      // Set loading basic data to true
      setLoadingBasicData(true);

      const loadData = async () => {
        try {
          const data = await fetchBasicData(selectedWildfire());
          setWildfireImage(await getImage(selectedWildfire()));
          setLoadingBasicData(false);
          setBasicData(data);

          // Center map on wildfire
          const centerPoint = turf.default(data.geojson.geometry);
          map().flyTo({
            center: [
              centerPoint.geometry.coordinates[0],
              centerPoint.geometry.coordinates[1],
            ],
            zoom: 10,
          });

          setLoadingHighResData(true);
          const highResData = await fetchHighResData(selectedWildfire());
          setHighResData(highResData);
          setLoadingHighResData(false);

          // Add wildfire to map
          map().addSource('wildfire', {
            type: 'geojson',
            data: highResData,
          });

          map().addLayer({
            id: 'wildfire',
            source: 'wildfire',
            type: 'fill',
            paint: {
              'fill-color': '#00ff00',
              'fill-opacity': 0.5,
            },
          });

          // Zoom to wildfire
          const bounds = bbox(bboxPolygon(bbox(highResData)));
          map().fitBounds(bounds as any, {
            padding: 50,
          });
        } catch (error) {
          console.error(error);
        }
      };

      loadData();
    }
  }, [selectedWildfire()]);

  async function getScreenshot() {
    setDownloading(true);
    const res = await fetch(
      `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng()},${lat()},${zoom()},0,0/400x400?access_token=${
        mapboxgl.accessToken
      }`
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'map.png';
    link.click();
    setDownloading(false);
  }

  return (
    <div class="w-full h-full absolute">
      {(loadingHighResData() || loadingBasicData()) && (
        <div class="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center z-[999] justify-center">
          <div class="bg-white p-4 rounded-md shadow-xl">
            <div class="flex items-center space-x-2 gap-2">
              <div role="status">
                <svg
                  aria-hidden="true"
                  class="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span class="sr-only">Loading...</span>
              </div>
              {/* Loading high resolution data... */}
              <div class="text-gray-700 dark:text-gray-200">
                {loadingHighResData() ? (
                  <>Loading high resolution data...</>
                ) : (
                  <>Loading Wildfire information..</>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {basicData() && (
        <div class="absolute top-10 left-10 pointer-events-none flex items-center z-[900] justify-center">
          <div class="bg-white w-96 p-4 h-full rounded-md shadow-xl pointer-events-auto">
            <div class="flex items-center space-x-2 gap-2">
              <div class="text-gray-700 dark:text-gray-200">
                <div class="text-lg font-bold">{basicData().source}</div>
                {wildfireImage() && (
                  <div class="mt-2 w-full inline-flex justify-center items-center m-auto">
                    <img
                      src={wildfireImage()}
                      class="w-full h-auto object-cover rounded-md m-auto self-center"
                    />
                  </div>
                )}
                <div class="mt-2">
                  {highResData()?.features[0]?.properties && (
                    <div class="flex flex-col">
                      <div class="text-gray-500 dark:text-gray-400">
                        <div class="font-bold">Event type:</div>
                        {selectedWildfire().activationEventType}
                      </div>
                      <div class="text-gray-500 dark:text-gray-400">
                        <div class="font-bold">Damaged area:</div>
                        {getArea(highResData().features[0])} km²
                      </div>
                      <div class="text-gray-500 dark:text-gray-400">
                        <div class="font-bold">Detection method:</div>
                        {highResData().features[0].properties['det_method']}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* <div class="absolute rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-2 border-white bg-transparent z-[900] shadow-2xl pointer-events-none" />
      <button
        class="absolute bg-white p-2 rounded-md top-1/2 left-1/2 mt-40 transform -translate-x-1/2 -translate-y-1/2 z-[900]"
        onClick={getScreenshot}
      >
        {downloading() ? <>Downloading...</> : <>Download</>}
      </button> */}
      <div id="map" class="w-full h-full" />
    </div>
  );
};

export default Map;

async function fetchBasicData(wildfire: Wildfire): Promise<WildfireBasicData> {
  const res = await fetch(
    `https://wildfires-api.snpm.workers.dev/activations/${wildfire.guid}`
  );
  const data = await res.json();
  return data[0];
}

async function fetchHighResData(
  wildfire: Wildfire
): Promise<FeatureCollection> {
  const res = await fetch(
    `https://wildfires-api.snpm.workers.dev/activations/${wildfire.guid}/geojson`
  );
  const data = await res.json();
  return data.geojson;
}

async function getImage(wildfire: Wildfire): Promise<string> {
  const res = await fetch(
    `https://wildfires-api.snpm.workers.dev/activations/${wildfire.guid}/image`
  );
  const data = await res.json();
  return data.original;
}

function getArea(feature: Feature): number {
  const _ = area(feature);
  return Math.round(_ / 1000);
}

export interface WildfireBasicData {
  title: string;
  link: string;
  description: string;
  category: string;
  guid: string;
  source: string;
  internal_id: string;
  polygon: string;
  geojson: Geojson;
  pubDate: string;
  'gdacs:thumbnail': string;
  'gdacs:cemsptype': string;
  'gdacs:cemsctype': string;
  'gdacs:cemsmonit': string;
}

export interface Geojson {
  type: string;
  properties: Properties;
  geometry: Geometry;
}

export interface Geometry {
  type: string;
  coordinates: Array<Array<number[]>>;
}

export interface Properties {}
