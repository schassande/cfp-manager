import { environment } from '../../environments/environment';

export const functionBaseUrl = `https://${environment.firebase.function_region}-${environment.firebase.projectId}.cloudfunctions.net/`;