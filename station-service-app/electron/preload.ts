import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,

  // App version
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),

  // Storage (for offline capabilities)
  store: {
    get: (key: string) => ipcRenderer.invoke('store-get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('store-set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store-delete', key),
  },

  // Notifications
  showNotification: (title: string, body: string) => {
    ipcRenderer.send('show-notification', { title, body });
  },
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      platform: string;
      getVersion: () => Promise<string>;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      store: {
        get: (key: string) => Promise<unknown>;
        set: (key: string, value: unknown) => Promise<void>;
        delete: (key: string) => Promise<void>;
      };
      showNotification: (title: string, body: string) => void;
    };
  }
}
