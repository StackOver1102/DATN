// /lib/gtag.ts
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || '';

interface GtagEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: Record<string, unknown>) => void;
  }
}

export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

export const event = ({ action, category, label, value }: GtagEvent) => {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
