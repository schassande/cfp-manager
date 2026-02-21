import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ConferenceService } from '../../../services/conference.service';
import { Conference } from '../../../model/conference.model';
import { ConferenceAdminService } from '../../../services/conference-admin.service';

@Component({
  selector: 'app-session-publish',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, ButtonModule],
  templateUrl: './session-publish.component.html',
  styleUrls: ['./session-publish.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionPublishComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly conferenceService = inject(ConferenceService);
  private readonly conferenceAdminService = inject(ConferenceAdminService);

  private readonly _conference = signal<Conference | undefined>(undefined);
  private readonly _loading = signal(true);
  private readonly _downloading = signal(false);
  private readonly _downloadError = signal<string>('');

  readonly conference = computed(() => this._conference());
  readonly loading = computed(() => this._loading());
  readonly downloading = computed(() => this._downloading());
  readonly downloadError = computed(() => this._downloadError());

  constructor() {
    const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    if (!conferenceId) {
      this._loading.set(false);
      return;
    }

    this.conferenceService.byId(conferenceId).subscribe({
      next: (conf) => {
        this._conference.set(conf);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  async downloadVoxxrinDescriptor(): Promise<void> {
    const conferenceId = this.conference()?.id;
    if (!conferenceId || this._downloading()) {
      return;
    }

    this._downloading.set(true);
    this._downloadError.set('');
    try {
      await this.conferenceAdminService.downloadVoxxrinEventDescriptor(conferenceId);
    } catch (error: unknown) {
      this._downloadError.set(error instanceof Error ? error.message : 'Download error');
    } finally {
      this._downloading.set(false);
    }
  }
}
