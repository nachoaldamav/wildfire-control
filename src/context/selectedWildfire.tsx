import { createSignal, createContext, useContext } from 'solid-js';
import { Wildfire } from '../components/side-panel';

const WildfireSelectedContext = createContext(null);

export const WildfireSelectedProvider = (props: any) => {
  const [wildfire, setWildfire] = createSignal<Wildfire | null>(null);

  const selectedWildfire = [
    wildfire,
    (wildfire: Wildfire | null) => {
      setWildfire(wildfire);
    },
  ];

  return (
    <WildfireSelectedContext.Provider value={selectedWildfire}>
      {props.children}
    </WildfireSelectedContext.Provider>
  );
};

export const useSelectedWildfire = () => {
  const ctx = useContext(WildfireSelectedContext);
  return [ctx[0], ctx[1]] as [
    () => Wildfire | null,
    (wildfire: Wildfire | null) => void
  ];
};
