import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { catchError, map, Observable, of, switchMap, take } from 'rxjs';
import { ConferenceService } from '../services/conference.service';
import { ConferenceManageContextService } from '../services/conference-manage-context.service';
import { PlatformConfigService } from '../services/platform-config.service';

@Injectable({ providedIn: 'root' })
export class ConferenceManageContextGuard implements CanActivate {
  private readonly conferenceService = inject(ConferenceService);
  private readonly conferenceManageContextService = inject(ConferenceManageContextService);
  private readonly platformConfigService = inject(PlatformConfigService);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const conferenceId = route.paramMap.get('conferenceId');
    if (!conferenceId) {
      this.conferenceManageContextService.clearContext();
      return of(true);
    }

    return this.platformConfigService.getPlatformConfig().pipe(
      take(1),
      switchMap((platformConfig) => {
        const singleConferenceId = String(platformConfig.singleConferenceId ?? '').trim();
        if (
          platformConfig.onlyPlatformAdminCanCreateConference
          && singleConferenceId
          && conferenceId !== singleConferenceId
        ) {
          this.conferenceManageContextService.clearContext();
          return of(this.router.parseUrl(`/conference/${singleConferenceId}`));
        }

        return this.conferenceService.byId(conferenceId).pipe(
          take(1),
          map((conference) => {
            if (!conference) {
              this.conferenceManageContextService.clearContext();
              return true;
            }
            this.conferenceManageContextService.setContext(conferenceId, conference.logo ?? '');
            return true;
          }),
          catchError(() => {
            this.conferenceManageContextService.clearContext();
            return of(true);
          })
        );
      })
    );
  }
}
