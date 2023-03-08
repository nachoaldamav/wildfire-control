import { Component, createEffect, createSignal } from 'solid-js';
import Map from './components/map';
import SidePanel from './components/side-panel';

const App: Component = () => {
  return (
    <section class="flex flex-col w-screen h-screen justify-center items-center relative">
      <OpenPanel />
      <Map />
    </section>
  );
};

const Bars4: Component = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    class="block h-6 w-6"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"
    />
  </svg>
);

const OpenPanel: Component = () => {
  const [isOpen, setIsOpen] = createSignal(false);

  createEffect(() => {
    if (isOpen()) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    console.log('isOpen', isOpen());
  });

  return (
    <>
      <button
        class="absolute top-0 right-0 m-4 p-2 rounded-full bg-white shadow-lg z-10"
        onClick={() => setIsOpen(!isOpen())}
      >
        <Bars4 />
      </button>
      <SidePanel open={isOpen} setOpen={setIsOpen} />
    </>
  );
};

export default App;
