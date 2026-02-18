export const FIRESTORE_COLLECTIONS = {
  CONFERENCE: 'conference',
  CONFERENCE_HALL_CONFIG: 'conference-hall-config',
  CONFERENCE_SECRET: 'conferenceSecret',
  SESSION: 'session',
  PERSON: 'person',
  PERSON_EMAILS: 'person_emails',
  ACTIVITY: 'activity',
  ACTIVITY_PARTICIPATION: 'activityParticipation',
  SLOT_TYPE: 'slot-type',
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];
