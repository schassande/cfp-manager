import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate } from '@angular/router';
import { catchError, map, Observable, of, take } from 'rxjs';
import { ConferenceService } from '../services/conference.service';
import { ConferenceManageContextService } from '../services/conference-manage-context.service';

@Injectable({ providedIn: 'root' })
export class ConferenceManageContextGuard implements CanActivate {
  private readonly conferenceService = inject(ConferenceService);
  private readonly conferenceManageContextService = inject(ConferenceManageContextService);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const conferenceId = route.paramMap.get('conferenceId');
    if (!conferenceId) {
      this.conferenceManageContextService.clearContext();
      return of(true);
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
  }
}
