import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { functionBaseUrl } from './constantes';

export interface DeleteConferenceReport {
  conferenceDeleted: number;
  sessionsDeleted: number;
  conferenceSpeakersDeleted: number;
  personsDeleted: number;
  activitiesDeleted: number;
  activityParticipationsDeleted: number;
  sessionAllocationsDeleted: number;
  conferenceHallConfigsDeleted: number;
  conferenceSecretsDeleted: number;
  deletedAt: string;
}

export interface RefreshConferenceDashboardReport {
  historyId: string;
  dashboard: {
    conferenceId: string;
    computedAt: string;
    trigger: 'MANUAL_REFRESH' | 'SCHEDULED_DAILY' | 'AUTO_EVENT';
    submitted: {
      total: number;
      bySessionTypeId: Record<string, number>;
    };
    confirmed: {
      total: number;
      bySessionTypeId: Record<string, number>;
    };
    allocated: {
      total: number;
      bySessionTypeId: Record<string, number>;
    };
    speakers: {
      total: number;
      sessionsWith2Speakers: number;
      sessionsWith3Speakers: number;
    };
    slots: {
      allocated: number;
      total: number;
      ratio: number;
    };
    conferenceHall: {
      lastImportAt: string;
    };
    schedule: {
      conferenceStartDate: string;
      daysBeforeConference: number;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class ConferenceAdminService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);

  async deleteConference(conferenceId: string): Promise<DeleteConferenceReport> {
    const idToken = await this.getIdTokenOrThrow();
    const response = await firstValueFrom(
      this.http.post<{ report: DeleteConferenceReport }>(
        `${functionBaseUrl}deleteConference`,
        { conferenceId },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      )
    );
    return response.report;
  }

  async refreshConferenceDashboard(conferenceId: string): Promise<RefreshConferenceDashboardReport> {
    const idToken = await this.getIdTokenOrThrow();
    const response = await firstValueFrom(
      this.http.post<{ report: RefreshConferenceDashboardReport }>(
        `${functionBaseUrl}refreshConferenceDashboard`,
        { conferenceId },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      )
    );
    return response.report;
  }

  private async getIdTokenOrThrow(): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  }
}
