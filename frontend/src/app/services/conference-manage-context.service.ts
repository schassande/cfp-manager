import { Injectable, computed, signal } from '@angular/core';

interface ConferenceManageContext {
  conferenceId: string;
  conferenceLogo: string;
  conferenceTitle: string;
  isOrganizer: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConferenceManageContextService {
  private readonly contextSignal = signal<ConferenceManageContext | null>(null);

  readonly context = computed(() => this.contextSignal());
  readonly conferenceLogo = computed(() => this.contextSignal()?.conferenceLogo ?? '');
  readonly conferenceId = computed(() => this.contextSignal()?.conferenceId ?? '');
  readonly conferenceTitle = computed(() => this.contextSignal()?.conferenceTitle ?? '');
  readonly isOrganizer = computed(() => this.contextSignal()?.isOrganizer ?? false);

  setContext(conferenceId: string, 
    conferenceLogo: string, 
    conferenceTitle: string, 
    isOrganizer: boolean = false): void {
    this.contextSignal.set({
      conferenceId: String(conferenceId ?? '').trim(),
      conferenceLogo: String(conferenceLogo ?? '').trim(),
      conferenceTitle: String(conferenceTitle ?? '').trim(),
      isOrganizer: isOrganizer
    });
  }

  clearContext(): void {
    this.contextSignal.set(null);
  }
}
