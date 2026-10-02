import {
  Activity,
  Wifi,
  Headphones,
  Monitor,
  PanelsTopLeft,
  Gauge,
  Snowflake,
  Cpu,
  MemoryStick,
  HardDrive,
  Thermometer,
  Gamepad2,
  Globe,
  Mic,
  Volume2,
  Usb,
  Power,
  Settings2,
  type LucideProps,
} from 'lucide-react';
const icons = {
  Activity,
  Wifi,
  Headphones,
  Monitor,
  PanelsTopLeft,
  Gauge,
  Snowflake,
  Cpu,
  MemoryStick,
  HardDrive,
  Thermometer,
  Gamepad2,
  Globe,
  Mic,
  Volume2,
  Usb,
  Power,
  Settings2,
};
export function Icon({ name, ...props }: LucideProps & { name: string }) {
  const Component = icons[name as keyof typeof icons] ?? Activity;
  return <Component aria-hidden="true" {...props} />;
}
export function Mark() {
  return (
    <svg aria-hidden="true" width="29" height="29" viewBox="0 0 32 32" fill="none">
      <path
        d="M7 7h17M7 7v17m0-8h14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="7" cy="7" r="4" fill="currentColor" />
      <circle cx="24" cy="7" r="3" fill="currentColor" />
      <circle cx="21" cy="16" r="3" fill="currentColor" />
      <circle cx="7" cy="25" r="3" fill="currentColor" />
    </svg>
  );
}
