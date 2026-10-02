import { performanceFlows } from './performance';
import { microphone, sound } from './audio';
import { wifi, internet } from './network';
import { usb, monitor } from './hardware';
import { heat, gaming } from './specialized';
import { boot, driver } from './windows';
export const flows = [
  ...performanceFlows,
  heat,
  gaming,
  wifi,
  internet,
  microphone,
  sound,
  usb,
  monitor,
  boot,
  driver,
];
export const getFlow = (id: string) => flows.find((f) => f.id === id);
