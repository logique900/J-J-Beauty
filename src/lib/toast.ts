import { ToastType } from '../components/ToastContainer';

export const toast = {
  success: (message: string) => {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message, type: 'success' } }));
  },
  error: (message: string) => {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message, type: 'error' } }));
  },
  info: (message: string) => {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message, type: 'info' } }));
  },
  warning: (message: string) => {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message, type: 'warning' } }));
  }
};
