import { PersistentData } from "./persistant.model";

/**
 * Voxxrin-only publication settings.
 * Do not duplicate data that already exists in other persistent entities:
 * - Conference: name/edition, description, dates/days, logo, languages, tracks, rooms, sessionTypes, sponsors
 * - Session/Allocation: schedule content
 */
export interface VoxxrinConfig extends PersistentData {
  /** Target conference for this publication config */
  conferenceId: string;

  /** Voxxrin API base URL (for example https://api-demo.voxxr.in) */
  baseUrl?: string;

  /** Voxxrin event identifier */
  eventId?: string;

  /** Optional family/category used by Voxxrin (ex: "devoxx") */
  eventFamily?: string;

  /** IANA timezone (ex: "Europe/Brussels") */
  timezone: string;

  /** Optional text for Voxxrin "people" page */
  peopleDescription?: string;

  /** Optional conference website shown in Voxxrin */
  websiteUrl?: string;

  /** Optional ticketing URL shown in Voxxrin */
  ticketsUrl?: string;

  /** Optional subtitle displayed in event header */
  headingSubTitle?: string;

  /** Optional CSS background used on event header */
  headingBackground?: string;

  /** Optional search keywords/tags for Voxxrin */
  keywords: string[];

  /** Optional extra location details not covered by Conference.location */
  location?: VoxxrinLocationConfig;

  /** Optional extra info tab content */
  infos?: VoxxrinInfosConfig;

  /** Optional social links for the event (deprecated location, use infos.socialMedias) */
  socialMedias?: VoxxrinSocialMedia[];

  /** Optional formatting settings for rendered content */
  formattings?: VoxxrinFormattingsConfig;

  /** Optional visual assets specific to Voxxrin */
  backgroundUrl?: string;

  /** Optional theme configuration specific to Voxxrin */
  theming?: VoxxrinThemingConfig;

  /** Optional feature flags and rating configuration */
  features?: VoxxrinFeaturesConfig;
}

export interface VoxxrinLocationConfig {
  country?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface VoxxrinInfosConfig {
  eventDescription?: string;
  venuePicture?: string;
  address?: string;
  floorPlans?: VoxxrinFloorPlan[];
  socialMedias?: VoxxrinSocialMedia[];
}

export interface VoxxrinFloorPlan {
  label: string;
  pictureUrl: string;
}

export interface VoxxrinSocialMedia {
  type: string;
  href: string;
}

export interface VoxxrinFormattingsConfig {
  talkFormatTitle?: VoxxrinTalkFormatTitleMode;
  parseMarkdownOn?: VoxxrinMarkdownTarget[];
}

export type VoxxrinTalkFormatTitleMode = 'with-duration' | 'without-duration';

export type VoxxrinMarkdownTarget = 'speaker-bio' | 'talk-summary';

export interface VoxxrinThemingConfig {
  colors: VoxxrinThemeColors;
  headingSrcSet?: VoxxrinHeadingImageSource[];
  headingCustomStyles?: VoxxrinHeadingCustomStyles;
  customImportedFonts?: VoxxrinImportedFont[];
}

export interface VoxxrinHeadingImageSource {
  url: string;
  descriptor: string;
}

export interface VoxxrinHeadingCustomStyles {
  title?: string;
  subTitle?: string;
  banner?: string;
}

export interface VoxxrinImportedFont {
  provider: 'google-fonts';
  family: string;
}

export interface VoxxrinThemeColors {
  secondaryContrastHex?: string;
  tertiaryHex?: string;
  tertiaryContrastHex?: string;
  secondaryHex?: string;
  primaryHex?: string;
  primaryContrastHex?: string;
  light?: VoxxrinThemeColorSet;
  dark?: VoxxrinThemeColorSet;
}

export interface VoxxrinThemeColorSet {
  secondaryContrastHex?: string;
  tertiaryHex?: string;
  tertiaryContrastHex?: string;
  secondaryHex?: string;
  primaryHex?: string;
  primaryContrastHex?: string;
}

export interface VoxxrinFeaturesConfig {
  favoritesEnabled?: boolean;
  roomsDisplayed?: boolean;
  remindMeOnceVideosAreAvailableEnabled?: boolean;
  showInfosTab?: boolean;
  hideLanguages?: string[];
  showRoomCapacityIndicator?: boolean;
  ratings?: VoxxrinRatingsConfig;
  topRatedTalks?: VoxxrinTopRatedTalksConfig;
  recording?: VoxxrinRecordingConfig;
}

export interface VoxxrinRatingsConfig {
  scale?: VoxxrinScaleRatingConfig;
  bingo?: VoxxrinBingoRatingConfig;
  'free-text'?: VoxxrinFreeTextRatingConfig;
}

export interface VoxxrinScaleRatingConfig {
  enabled: boolean;
  icon?: string;
  labels?: string[];
}

export interface VoxxrinBingoRatingConfig {
  enabled: boolean;
  isPublic?: boolean;
  choices?: VoxxrinLabelChoice[];
}

export interface VoxxrinFreeTextRatingConfig {
  enabled: boolean;
  maxLength?: number;
}

export interface VoxxrinLabelChoice {
  id: string;
  label: string;
}

export interface VoxxrinTopRatedTalksConfig {
  minimumNumberOfRatingsToBeConsidered?: number;
  minimumAverageScoreToBeConsidered?: number;
  numberOfDailyTopTalksConsidered?: number;
}

export interface VoxxrinRecordingConfig {
  platform?: string;
  youtubeHandle?: string;
  ignoreVideosPublishedAfter?: string;
  recordedFormatIds?: string[];
  notRecordedFormatIds?: string[];
  recordedRoomIds?: string[];
  notRecordedRoomIds?: string[];
  excludeTitleWordsFromMatching?: string[];
}
/*
{
  "eventFamily": "devoxx",
  "title": "Devoxx Belgium 2023",
  "headingTitle": "Devoxx Belgium 2023",
  "description": null,
  "timezone": "Europe/Brussels",
  "peopleDescription": null,
  "websiteUrl": "https://devoxx.be",
  "location": {
    "country": "Belgium",
    "city": "Antwerp"
  },
  "keywords": [ "Devoxx", "Java", "AI", "Cloud", "Big data", "Web", "Spring Boot", "Microservices", "Kubernetes", "Docker", "Serverless", "Architecture", "Security", "Performance", "Reactive", "Functional" ],
  "start": "2023-10-02",
  "end": "2023-10-06",
  "days": [
    { "id": "monday", "localDate": "2023-10-02" },
    { "id": "tuesday", "localDate": "2023-10-03" },
    { "id": "wednesday", "localDate": "2023-10-04" },
    { "id": "thursday", "localDate": "2023-10-05" },
    { "id": "friday", "localDate": "2023-10-06" }
  ],
  "infos": {
    "eventDescription": "Kinepolis Antwerp",
    "venuePicture": "https://devoxx.be/wp-content/uploads/2023/08/kinepolis.jpeg",
    "address": "Groenendaallaan 394, 2030 Antwerpen",
    "floorPlans": [
      { "label": "Cinema Rooms", "pictureUrl": "https://s3-eu-west-1.amazonaws.com/voxxeddays/webapp/images/95c4e19e-858d-4f18-a980-1df451a089d0.jpg" },
    ]
  },
  "socialMedias": [
    {"type": "website", "href": "https://devoxx.be/"},
    {"type": "github", "href": "https://github.com/devoxx"}
  ],
  "sponsors": [
    {
      "type": "Platinium", "typeColor": "#E5E4E2", "typeFontColor": "black",
      "sponsorships": [
        {"name": "ING", "logoUrl": "https://devoxx.be/wp-content/uploads/2023/05/INGLogo.jpg", "href": "https://www.ing.be/en/retail"},
      ]
    }
  ],
  "features": {
    "favoritesEnabled": true,
    "roomsDisplayed": true,
    "remindMeOnceVideosAreAvailableEnabled": false,
    "showInfosTab": true,
    "hideLanguages": [],
    "showRoomCapacityIndicator:": false,
    "ratings": {
      "scale": {
        "enabled": true,
        "icon": "star",
        "labels": [
          "There are rooms for improvement",
          "Talk was OK",
          "Good talk",
          "Great talk",
          "Amazing talk"
        ]
      },
      "bingo": {
        "enabled": true,
        "isPublic": false,
        "choices": [
          { "id": "1", "label": "Difficult to understand" }
        ]
      },
      "free-text": {
        "enabled": false,
        "maxLength": 400
      },
    },
    "topRatedTalks": {
      "minimumNumberOfRatingsToBeConsidered": 10,
      "minimumAverageScoreToBeConsidered": 3,
      "numberOfDailyTopTalksConsidered": 10
    },
    "recording" {
      "platform": "youtube",
      "youtubeHandle": "DevoxxForever",
      "ignoreVideosPublishedAfter": "2023-10-10",
      "notRecordedFormatIds": ["954", "968", "984"]
    }
  },
  "logoUrl": "https://devoxx.be/wp-content/uploads/2019/05/DEVOXX-Name-Only-TransparentBackground.png",
  "backgroundUrl": "https://devoxx.be/wp-content/uploads/2023/06/time-min.jpg",
  "theming": {
    "colors": {
      "secondaryContrastHex": "#FFFFFF",
      "tertiaryHex": "#202020",
      "tertiaryContrastHex": "#FFFFFF",
      "secondaryHex": "#3880FF",
      "primaryHex": "#F78125",
      "primaryContrastHex": "#FFFFFF"
    }
  },
  "supportedTalkLanguages": [
    { "id": "en", "themeColor": "#165CE3", "label": "EN" }
  ],
  "rooms": [
    { "id": "1160", "title": "Room 4" },
    { "id": "1154", "title": "Room 10"}
  ],
  "talkTracks": [
    { "id": "1253", "themeColor": "#9F0E3A", "title": "People & Culture" }
  ],
  "talkFormats": [
    { "id": "956", "title": "Closing keynote", "duration": "PT45m", "themeColor": "#3EDDEF" }
  ]
}
*/
