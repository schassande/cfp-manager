import { Injectable, computed, signal } from '@angular/core';

interface ConferenceManageContext {
  conferenceId: string;
  conferenceLogo: string;
}

@Injectable({ providedIn: 'root' })
export class ConferenceManageContextService {
  private readonly contextSignal = signal<ConferenceManageContext | null>(null);

  readonly context = computed(() => this.contextSignal());
  readonly conferenceLogo = computed(() => this.contextSignal()?.conferenceLogo ?? '');
  readonly manageRoute = computed(() => {
    const conferenceId = this.contextSignal()?.conferenceId;
    return conferenceId ? ['/conference', conferenceId, 'manage'] : ['/'];
  });

  setContext(conferenceId: string, conferenceLogo: string): void {
    this.contextSignal.set({
      conferenceId: String(conferenceId ?? '').trim(),
      conferenceLogo: String(conferenceLogo ?? '').trim(),
    });
  }

  clearContext(): void {
    this.contextSignal.set(null);
  }
}
