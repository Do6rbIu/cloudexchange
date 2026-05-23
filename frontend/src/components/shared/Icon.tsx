interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

const PATHS: Record<string, string> = {
  inbox: 'M3 4h18l-2 9h-4l-1 2h-4l-1-2H5L3 4Zm0 9v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6h-5l-1 2h-6l-1-2H3Z',
  star: 'M12 2.5l2.8 6.3 6.7.6-5 4.6 1.5 6.6L12 17l-6 3.6 1.5-6.6-5-4.6 6.7-.6L12 2.5Z',
  send: 'M3 11L21 3l-7 18-2-8-9-2Z',
  draft: 'M4 4h12l4 4v12H4V4Zm12 0v4h4',
  snooze: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Zm.5-13H11v6l5 3 .8-1.3-4.3-2.5V7Z',
  archive: 'M3 6h18v3H3V6Zm1 5h16v9H4v-9Zm5 2v2h6v-2H9Z',
  spam: 'M12 2 2 22h20L12 2Zm0 7v6m0 2v2',
  trash: 'M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 11H7L6 9Z',
  search: 'M11 4a7 7 0 1 0 4.2 12.5l4.6 4.6 1.4-1.4-4.6-4.6A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z',
  calendar: 'M5 4h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm0 6v9h14v-9H5Zm3-8v3m8-3v3',
  contacts: 'M12 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4Zm0 10c4 0 8 2 8 5v1H4v-1c0-3 4-5 8-5Z',
  settings: 'M19.4 13a8 8 0 0 0 0-2l2-1.5-2-3.5L17 7a8 8 0 0 0-1.7-1L15 3.5h-4L10.6 6a8 8 0 0 0-1.7 1L6.5 6 4.5 9.5 6.5 11a8 8 0 0 0 0 2l-2 1.5 2 3.5L9 17a8 8 0 0 0 1.7 1l.4 2.5h4l.4-2.5a8 8 0 0 0 1.7-1l2.4 1 2-3.5L19.4 13ZM12 15a3 3 0 1 1 3-3 3 3 0 0 1-3 3Z',
  logo: 'M4 6l8-4 8 4-8 4-8-4Zm0 6l8 4 8-4M4 18l8 4 8-4',
  paperclip: 'M21 11l-9 9a5 5 0 0 1-7-7l9-9a3 3 0 0 1 4 4l-9 9a1 1 0 0 1-1-1l8-8',
  reply: 'M9 7L3 13l6 6m-6-6h13a5 5 0 0 1 5 5',
  forward: 'M15 7l6 6-6 6m6-6H8a5 5 0 0 0-5 5',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5 9-11',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  user: 'M12 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4Zm0 10c4 0 8 2 8 5v1H4v-1c0-3 4-5 8-5Z',
  flag: 'M5 3v18M5 5h12l-2 4 2 4H5',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Zm-3 9l2 2 4-4',
};

export function Icon({ name, size = 18, color = 'currentColor' }: IconProps) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
