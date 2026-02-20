import { setGlobalOptions } from 'firebase-functions';
import { createPerson } from './http/create-person';
import { importConferenceHall } from './http/import-conference-hall';
import { resetConferenceHallImport } from './http/reset-conference-hall-import';
import { deleteConference } from './http/delete-conference';
import { refreshConferenceDashboard } from './http/refresh-conference-dashboard';
import { recomputeConferenceDashboardDaily } from './scheduler/recompute-conference-dashboard-daily';

setGlobalOptions({ maxInstances: 10 });

export {
  createPerson,
  importConferenceHall,
  resetConferenceHallImport,
  deleteConference,
  refreshConferenceDashboard,
  recomputeConferenceDashboardDaily,
};
