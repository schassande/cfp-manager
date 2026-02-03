import { Injectable } from '@angular/core';

const STORAGE_KEY = 'returnUrl';

@Injectable({ providedIn: 'root' })
export class RedirectService {
  set(url: string) {
    try {
      sessionStorage.setItem(STORAGE_KEY, url);
    } catch (e) {
      // ignore storage errors
    }
  }

  get(): string | null {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  clear(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }
}
