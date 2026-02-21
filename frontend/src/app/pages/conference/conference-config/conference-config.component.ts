import { ChangeDetectionStrategy, Component, inject, signal, computed, CUSTOM_ELEMENTS_SCHEMA, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ConferenceService } from '../../../services/conference.service';
import { Conference } from '../../../model/conference.model';
import { TranslateService } from '@ngx-translate/core';
import { UserSignService } from '../../../services/usersign.service';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ConferenceGeneralConfigComponent } from './conference-general-config/conference-general-config.component';
import { ConferenceTracksConfigComponent } from './conference-tracks-config/conference-tracks-config.component';
import { ConferenceSessionTypesConfigComponent } from './conference-session-types-config/conference-session-types-config.component';
import { ConferencePlanningStructureConfigComponent } from './conference-planning-structure-config/conference-planning-structure-config.component';
import { ConferenceRoomsConfigComponent } from './conference-rooms-config/conference-rooms-config.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-conference-config',
  imports: [
    CommonModule,
    RouterModule,
    TabsModule,
    ButtonModule,
    ToastModule,
    TranslateModule,
    ConferenceGeneralConfigComponent,
    ConferenceRoomsConfigComponent,
    ConferenceTracksConfigComponent,
    ConferenceSessionTypesConfigComponent,
    ConferencePlanningStructureConfigComponent,
  ],
  providers: [MessageService],
  templateUrl: './conference-config.component.html',
  styleUrls: ['./conference-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ConferenceConfigComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly conferenceService = inject(ConferenceService);
  private readonly userSignService = inject(UserSignService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translateService = inject(TranslateService);
  private readonly messageService = inject(MessageService);
  
  private readonly _conference = signal<Conference | undefined>(undefined);
  private readonly _loading = signal(true);
  protected readonly activeTab = signal<number>(0);
  private readonly tabKeys: readonly string[] = ['general', 'session-types', 'tracks', 'rooms', 'planning-structure'];
  
  readonly conference = computed(() => this._conference());
  readonly loading = computed(() => this._loading());
  readonly lang = computed(() => this.translateService.getCurrentLang());

  constructor() {
  }

  ngOnInit() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const rawTab = params.get('tab');
        const tabIndex = this.parseTabQueryParam(rawTab);
        this.activeTab.set(tabIndex);
        if (!rawTab) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { tab: this.toTabKey(tabIndex) },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }
      });

    const id = this.route.snapshot.paramMap.get('conferenceId');
    // console.log('ConferenceConfigComponent initialized with id:', id);
    if (id) {
      this.conferenceService.byId(id).subscribe({
        next: (conf: Conference | undefined) => {
          this._conference.set(conf);
          this._loading.set(false);
        },
        error: () => {
          this._loading.set(false);
        }
      });
    } else {
      // No id provided: create a default conference and persist it
      const lang = this.translateService.getCurrentLang() || 'EN';
      const rand4 = Math.floor(1000 + Math.random() * 9000);
      const currentPerson = this.userSignService.getCurrentPerson();
      const defaultConf: Conference = {
        id: '',
        lastUpdated: new Date().getTime().toString(),
        name: `New Conference ${rand4}`,
        edition: new Date().getFullYear(),
        days: [],
        location: '',
        logo: '',
        languages: [lang.toUpperCase()],
        description: { [lang]: 'New conference description' },
        visible: false,
        organizerEmails: currentPerson && currentPerson.email ? [currentPerson.email] : [],
        tracks: [],
        rooms: [],
        sessionTypes: [],
        cfp: { startDate: '', endDate: '', status: 'closed' },
      };

      this.conferenceService.save(defaultConf).subscribe({
        next: (created: Conference) => {
          this._conference.set(created);
          this._loading.set(false);
          // update URL to include new id
          try {
            this.router.navigate(['/conference', created.id, 'edit'], {
              replaceUrl: true,
              queryParams: { tab: this.toTabKey(this.activeTab()) },
            });
          } catch (e) {
            // ignore navigation errors
          }
        },
        error: () => {
          this._loading.set(false);
        }
      });
    }
  }

  onSave() {
    const conference = this.conference()!;
    const sanitizedConference: Conference = {
      ...conference,
    };
    this.conferenceService.save(sanitizedConference).subscribe({
      next: (saved) => {
        this._conference.set(saved);
        this.messageService.add({
          severity: 'success',
          summary: this.translateService.instant('COMMON.SUCCESS'),
          detail: this.translateService.instant('CONFERENCE.CONFIG.SAVED'),
        });
      },
      error: (err) => {
        console.error('Error saving conference:', err);
        this.messageService.add({
          severity: 'error',
          summary: this.translateService.instant('COMMON.ERROR'),
          detail: this.translateService.instant('CONFERENCE.CONFIG.UPDATE_ERROR'),
        });
      },
    });
  }

  onActiveTabChange(event: any) {
    const tabIndex = this.extractTabIndex(event);
    this.activeTab.set(tabIndex);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: this.toTabKey(tabIndex) },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private extractTabIndex(event: any): number {
    if (typeof event === 'number') {
      return this.clampTabIndex(event);
    }
    if (typeof event?.index === 'number') {
      return this.clampTabIndex(event.index);
    }
    if (typeof event?.value === 'number') {
      return this.clampTabIndex(event.value);
    }
    return 0;
  }

  private parseTabQueryParam(rawValue: string | null): number {
    if (!rawValue) {
      return 0;
    }

    const asNumber = Number(rawValue);
    if (Number.isInteger(asNumber)) {
      return this.clampTabIndex(asNumber);
    }

    const byKey = this.tabKeys.indexOf(rawValue.toLowerCase());
    return byKey >= 0 ? byKey : 0;
  }

  private toTabKey(index: number): string {
    return this.tabKeys[this.clampTabIndex(index)] ?? this.tabKeys[0];
  }

  private clampTabIndex(index: number): number {
    return Math.max(0, Math.min(index, this.tabKeys.length - 1));
  }
}
