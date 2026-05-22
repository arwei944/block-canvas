import { useEditorStore } from '../store/editor-store';
import type { BlockDocument } from '../types';

const STORAGE_KEY = 'blockcanvas_document';

export function saveToLocalStorage(): void {
  try {
    const doc = useEditorStore.getState().document;
    if (doc) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    }
  } catch (e) {
    console.error('[Persistence] Save failed:', e);
  }
}

export function loadFromLocalStorage(): BlockDocument | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as BlockDocument;
    }
  } catch (e) {
    console.error('[Persistence] Load failed:', e);
  }
  return null;
}

export function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Auto-save subscriber
export function enableAutoSave(): () => void {
  // Save on every document change
  return useEditorStore.subscribe((state, prevState) => {
    if (state.document !== prevState.document && state.document) {
      saveToLocalStorage();
    }
  });
}
