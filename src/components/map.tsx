import type { Component } from 'solid-js';
import { createSignal, createEffect } from 'solid-js';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken =
  'pk.eyJ1IjoibmFjaG9hbGRhbWEiLCJhIjoiY2tpYncyM21uMGdvbTJ5azB1Y3hpbWd6cyJ9.Ud-MHZSsztzRigQQOprQsg';

const Map: Component = () => {
  const [map, setMap] = createSignal<mapboxgl.Map | null>(null);
  const [lng, setLng] = createSignal(-74.5);
  const [lat, setLat] = createSignal(40);
  const [zoom, setZoom] = createSignal(9);

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
      <div class="absolute rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-2 border-white bg-transparent z-[999] shadow-2xl pointer-events-none" />
      <button
        class="absolute bg-white p-2 rounded-md top-1/2 left-1/2 mt-40 transform -translate-x-1/2 -translate-y-1/2 z-[999]"
        onClick={getScreenshot}
      >
        {downloading() ? <>Downloading...</> : <>Download</>}
      </button>
      <div id="map" class="w-full h-full" />
    </div>
  );
};

export default Map;
