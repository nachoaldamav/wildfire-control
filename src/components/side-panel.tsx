import {
  Dialog,
  DialogOverlay,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from 'solid-headless';
import { createEffect, createSignal, For } from 'solid-js';
import { useSelectedWildfire } from '../context/selectedWildfire';

export default function SidePanel({
  open,
  setOpen,
}: {
  open: () => boolean;
  setOpen: (open: boolean) => void;
}) {
  const [, setSelectedWildfire] = useSelectedWildfire();
  const [wildFires, setWildFires] = createSignal<Wildfire[]>([]);
  const [loading, setLoading] = createSignal(true);

  createEffect(() => {
    fetch('https://wildfires-api.snpm.workers.dev/activations-xml')
      .then((res) => res.json())
      .then((data) => {
        setWildFires(data);
        setLoading(false);
      });
  });

  const closeModal = () => {
    setOpen(false);
  };

  return (
    <Transition appear show={open()}>
      <Dialog
        isOpen
        class="fixed inset-0 z-[999] overflow-y-auto"
        onClose={closeModal}
      >
        <div class="min-h-screen px-4 flex items-center justify-center">
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <DialogOverlay class="fixed inset-0 bg-gray-900 bg-opacity-50" />
          </TransitionChild>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span class="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel class="inline-block w-full h-screen max-w-xl p-6 my-8 overflow-auto text-left align-middle transition-all transform bg-gray-50 dark:bg-gray-900 shadow-xl rounded-2xl dark:border dark:border-gray-50">
              <DialogTitle
                as="h3"
                class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-50"
              >
                Historical Wildfires
              </DialogTitle>
              <div class="mt-2">
                <p class="text-sm text-gray-900 dark:text-gray-50">
                  This is a list of historical wildfires. Click on a fire to see
                  more information.
                </p>
                <div class="mt-4">
                  {loading() ? (
                    <div class="flex justify-center">
                      <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-gray-50"></div>
                    </div>
                  ) : (
                    <ul class="divide-y divide-gray-200 dark:divide-gray-50">
                      <For each={wildFires()}>
                        {(fire) => (
                          <li
                            class="py-4 cursor-pointer"
                            onClick={() => {
                              setSelectedWildfire(fire);
                              closeModal();
                            }}
                          >
                            {fire.title}
                          </li>
                        )}
                      </For>
                    </ul>
                  )}
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

export interface Wildfire {
  title: string;
  link: string;
  description: string;
  category: string;
  guid: string;
  pubDate: string;
  source: string;
  thumbnail: string;
  point: string;
  actor: string;
  activationGUID: string;
  activationName: string;
  activationEventType: string;
  activationPublished: string;
  activationLocation: string;
  activationAffectedCountries: string;
  activationDescription: string;
  activationLink: string;
  activationStatus: string;
  activationPreview: string;
  activationRSS: string;
}
