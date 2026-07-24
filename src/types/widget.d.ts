export {};

declare global {
  interface Window {
    ChatbotMvp?: {
      version: string;
      loaded?: boolean;
      status: string;
      botId?: string;
      open?: () => void;
      close?: () => void;
    };
  }
}
