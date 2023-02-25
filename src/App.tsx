import type { Component } from 'solid-js';
import Map from './components/map';

const App: Component = () => {
  return (
    <section class="flex flex-col w-screen h-screen justify-center items-center">
      <Map />
    </section>
  );
};

export default App;
