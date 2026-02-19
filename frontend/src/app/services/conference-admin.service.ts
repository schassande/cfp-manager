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

  private async getIdTokenOrThrow(): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  }
}
