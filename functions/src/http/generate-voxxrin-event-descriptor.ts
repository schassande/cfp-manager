import { onRequest } from 'firebase-functions/https';
import * as logger from 'firebase-functions/logger';
import { admin } from '../common/firebase-admin';
import { FIRESTORE_COLLECTIONS } from '../common/firestore-collections';
import {
  HttpError,
  ensurePostMethod,
  parseConferenceId,
  getRequesterEmailFromAuthorization,
  loadConference,
  ensureRequesterIsOrganizer,
} from './conference-http-common';

export const generateVoxxrinEventDescriptor = onRequest({ cors: true, timeoutSeconds: 60 }, async (req, res) => {
  try {
    applyCorsHeaders(req, res);
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    ensurePostMethod(req.method, 'generateVoxxrinEventDescriptor');

    const conferenceId = parseConferenceId(req.body, 'generateVoxxrinEventDescriptor');
    const db = admin.firestore();
    const requesterEmail = await getRequesterEmailFromAuthorization(
      req.headers.authorization,
      conferenceId,
      'generateVoxxrinEventDescriptor'
    );

    const { conferenceData } = await loadConference(db, conferenceId, 'generateVoxxrinEventDescriptor');
    ensureRequesterIsOrganizer(conferenceData, conferenceId, requesterEmail, 'generateVoxxrinEventDescriptor');

    const voxxrinConfig = await loadVoxxrinConfig(db, conferenceId);
    if (!voxxrinConfig) {
      throw new HttpError(
        400,
        'Voxxrin config not found',
        'generateVoxxrinEventDescriptor rejected: voxxrin config not found',
        { conferenceId }
      );
    }

    const descriptor = buildEventDescriptor(conferenceData, voxxrinConfig);
    const payload = JSON.stringify(descriptor, null, 2);

    logger.info('generateVoxxrinEventDescriptor completed', {
      conferenceId,
      requesterEmail,
      hasDescriptor: !!descriptor,
      payloadSize: payload.length,
    });

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="voxxrin-${conferenceId}.json"`);
    res.status(200).send(payload);
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      logger.warn(err.logMessage, err.meta);
      res.status(err.status).send({ error: err.message });
      return;
    }

    const message = err instanceof Error ? err.message : 'unknown error';
    logger.error('generateVoxxrinEventDescriptor error', { message });
    res.status(500).send({
      error: 'Voxxrin descriptor generation failed',
      code: 'VOXXRIN_DESCRIPTOR_GENERATION_ERROR',
      detail: message,
    });
  }
});

function applyCorsHeaders(req: any, res: any): void {
  const origin = String(req?.headers?.origin ?? '*');
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

async function loadVoxxrinConfig(db: admin.firestore.Firestore, conferenceId: string): Promise<any | null> {
  const querySnap = await db
    .collection(FIRESTORE_COLLECTIONS.VOXXRIN_CONFIG)
    .where('conferenceId', '==', conferenceId)
    .limit(1)
    .get();

  if (!querySnap.empty) {
    return querySnap.docs[0].data() as any;
  }

  const byDocId = await db.collection(FIRESTORE_COLLECTIONS.VOXXRIN_CONFIG).doc(conferenceId).get();
  if (byDocId.exists) {
    return byDocId.data() as any;
  }

  return null;
}

function buildEventDescriptor(conference: any, config: any): any {
  const title = buildConferenceTitle(conference);
  const description = pickLocalizedText(conference?.description, conference?.languages);
  const days = mapDays(conference?.days ?? []);
  const start = days.length ? days[0].localDate : undefined;
  const end = days.length ? days[days.length - 1].localDate : undefined;

  return compactObject({
    eventFamily: cleanString(config?.eventFamily),
    title,
    headingTitle: title,
    headingSubTitle: cleanString(config?.headingSubTitle),
    headingBackground: cleanString(config?.headingBackground),
    description,
    timezone: cleanString(config?.timezone) ?? 'UTC',
    peopleDescription: cleanString(config?.peopleDescription),
    websiteUrl: cleanString(config?.websiteUrl),
    ticketsUrl: cleanString(config?.ticketsUrl),
    location: compactObject({
      country: cleanString(config?.location?.country),
      city: cleanString(config?.location?.city),
      address: cleanString(config?.location?.address),
      latitude: toOptionalNumber(config?.location?.latitude),
      longitude: toOptionalNumber(config?.location?.longitude),
    }),
    keywords: normalizeStringArray(config?.keywords),
    start,
    end,
    days,
    infos: compactObject({
      eventDescription: cleanString(config?.infos?.eventDescription),
      venuePicture: cleanString(config?.infos?.venuePicture),
      address: cleanString(config?.infos?.address),
      floorPlans: mapFloorPlans(config?.infos?.floorPlans),
      socialMedias: mapSocialMedias(config?.infos?.socialMedias),
    }),
    socialMedias: mapSocialMedias(config?.socialMedias),
    sponsors: mapSponsors(conference?.sponsoring),
    features: mapFeatures(config?.features),
    formattings: mapFormattings(config?.formattings),
    logoUrl: cleanString(conference?.logo),
    backgroundUrl: cleanString(config?.backgroundUrl),
    theming: mapTheming(config?.theming),
    supportedTalkLanguages: mapSupportedTalkLanguages(conference?.languages ?? []),
    rooms: mapRooms(conference?.rooms ?? []),
    talkTracks: mapTracks(conference?.tracks ?? []),
    talkFormats: mapTalkFormats(conference?.sessionTypes ?? []),
  });
}

function buildConferenceTitle(conference: any): string {
  const name = cleanString(conference?.name) ?? '';
  const edition = String(conference?.edition ?? '').trim();
  return `${name} ${edition}`.trim();
}

function pickLocalizedText(values: any, languages: any): string | undefined {
  if (!values || typeof values !== 'object') {
    return undefined;
  }

  const langCodes = Array.isArray(languages)
    ? languages.map((lang) => String(lang ?? '').trim().toLowerCase()).filter((lang) => lang.length > 0)
    : [];

  for (const lang of langCodes) {
    const byLower = cleanString(values?.[lang]);
    if (byLower) {
      return byLower;
    }
    const byUpper = cleanString(values?.[lang.toUpperCase()]);
    if (byUpper) {
      return byUpper;
    }
  }

  for (const key of Object.keys(values)) {
    const value = cleanString(values[key]);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function mapDays(days: any[]): Array<{ id: string; localDate: string }> {
  if (!Array.isArray(days)) {
    return [];
  }

  return days
    .map((day) => {
      const localDate = toLocalDate(day?.date);
      if (!localDate) {
        return null;
      }

      return {
        id: dayIdFromDate(localDate),
        localDate,
      };
    })
    .filter((day): day is { id: string; localDate: string } => !!day)
    .sort((a, b) => a.localDate.localeCompare(b.localDate));
}

function dayIdFromDate(localDate: string): string {
  const weekday = new Date(`${localDate}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  return weekday.toLowerCase();
}

function toLocalDate(value: any): string | undefined {
  const source = cleanString(value);
  if (!source) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(source)) {
    return source;
  }

  const date = new Date(source);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString().slice(0, 10);
}

function mapSocialMedias(values: any): Array<{ type: string; href: string }> | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const socials = values
    .map((entry) => {
      const type = cleanString(entry?.type);
      const href = cleanString(entry?.href);
      if (!type || !href) {
        return null;
      }
      return { type, href };
    })
    .filter((entry): entry is { type: string; href: string } => !!entry);

  return socials.length ? socials : undefined;
}

function mapFloorPlans(values: any): Array<{ label: string; pictureUrl: string }> | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const floorPlans = values
    .map((entry) => {
      const label = cleanString(entry?.label);
      const pictureUrl = cleanString(entry?.pictureUrl);
      if (!label || !pictureUrl) {
        return null;
      }
      return { label, pictureUrl };
    })
    .filter((entry): entry is { label: string; pictureUrl: string } => !!entry);

  return floorPlans.length ? floorPlans : undefined;
}

function mapSponsors(sponsoring: any): any[] | undefined {
  const sponsors = Array.isArray(sponsoring?.sponsors) ? sponsoring.sponsors : [];
  if (!sponsors.length) {
    return undefined;
  }

  const grouped = new Map<string, any[]>();

  for (const sponsor of sponsors) {
    const typeName = cleanString(sponsor?.type?.name) ?? 'Sponsors';
    const sponsorship = compactObject({
      name: cleanString(sponsor?.name),
      logoUrl: cleanString(sponsor?.logo),
      href: cleanString(sponsor?.website),
    });

    if (!sponsorship) {
      continue;
    }

    if (!grouped.has(typeName)) {
      grouped.set(typeName, []);
    }
    grouped.get(typeName)?.push(sponsorship);
  }

  const result = Array.from(grouped.entries())
    .map(([type, sponsorships]) => compactObject({ type, sponsorships }))
    .filter((entry): entry is any => !!entry);

  return result.length ? result : undefined;
}

function mapFeatures(features: any): any {
  if (!features || typeof features !== 'object') {
    return undefined;
  }

  return compactObject({
    favoritesEnabled: toOptionalBoolean(features?.favoritesEnabled),
    roomsDisplayed: toOptionalBoolean(features?.roomsDisplayed),
    remindMeOnceVideosAreAvailableEnabled: toOptionalBoolean(features?.remindMeOnceVideosAreAvailableEnabled),
    showInfosTab: toOptionalBoolean(features?.showInfosTab),
    hideLanguages: normalizeStringArray(features?.hideLanguages),
    showRoomCapacityIndicator: toOptionalBoolean(features?.showRoomCapacityIndicator),
    ratings: compactObject({
      scale: compactObject({
        enabled: toOptionalBoolean(features?.ratings?.scale?.enabled),
        icon: cleanString(features?.ratings?.scale?.icon),
        labels: normalizeStringArray(features?.ratings?.scale?.labels),
      }),
      bingo: compactObject({
        enabled: toOptionalBoolean(features?.ratings?.bingo?.enabled),
        isPublic: toOptionalBoolean(features?.ratings?.bingo?.isPublic),
        choices: mapLabelChoices(features?.ratings?.bingo?.choices),
      }),
      'free-text': compactObject({
        enabled: toOptionalBoolean(features?.ratings?.['free-text']?.enabled),
        maxLength: toOptionalNumber(features?.ratings?.['free-text']?.maxLength),
      }),
    }),
    topRatedTalks: compactObject({
      minimumNumberOfRatingsToBeConsidered: toOptionalNumber(features?.topRatedTalks?.minimumNumberOfRatingsToBeConsidered),
      minimumAverageScoreToBeConsidered: toOptionalNumber(features?.topRatedTalks?.minimumAverageScoreToBeConsidered),
      numberOfDailyTopTalksConsidered: toOptionalNumber(features?.topRatedTalks?.numberOfDailyTopTalksConsidered),
    }),
    recording: compactObject({
      platform: cleanString(features?.recording?.platform),
      youtubeHandle: cleanString(features?.recording?.youtubeHandle),
      ignoreVideosPublishedAfter: toLocalDate(features?.recording?.ignoreVideosPublishedAfter),
      recordedFormatIds: normalizeStringArray(features?.recording?.recordedFormatIds),
      notRecordedFormatIds: normalizeStringArray(features?.recording?.notRecordedFormatIds),
      recordedRoomIds: normalizeStringArray(features?.recording?.recordedRoomIds),
      notRecordedRoomIds: normalizeStringArray(features?.recording?.notRecordedRoomIds),
      excludeTitleWordsFromMatching: normalizeStringArray(features?.recording?.excludeTitleWordsFromMatching),
    }),
  });
}

function mapFormattings(formattings: any): any {
  if (!formattings || typeof formattings !== 'object') {
    return undefined;
  }

  return compactObject({
    talkFormatTitle: cleanString(formattings?.talkFormatTitle),
    parseMarkdownOn: normalizeStringArray(formattings?.parseMarkdownOn),
  });
}

function mapTheming(theming: any): any {
  if (!theming || typeof theming !== 'object') {
    return undefined;
  }

  return compactObject({
    colors: compactObject({
      primaryHex: normalizeHexColor(theming?.colors?.primaryHex),
      primaryContrastHex: normalizeHexColor(theming?.colors?.primaryContrastHex),
      secondaryHex: normalizeHexColor(theming?.colors?.secondaryHex),
      secondaryContrastHex: normalizeHexColor(theming?.colors?.secondaryContrastHex),
      tertiaryHex: normalizeHexColor(theming?.colors?.tertiaryHex),
      tertiaryContrastHex: normalizeHexColor(theming?.colors?.tertiaryContrastHex),
      light: compactObject({
        primaryHex: normalizeHexColor(theming?.colors?.light?.primaryHex),
        primaryContrastHex: normalizeHexColor(theming?.colors?.light?.primaryContrastHex),
        secondaryHex: normalizeHexColor(theming?.colors?.light?.secondaryHex),
        secondaryContrastHex: normalizeHexColor(theming?.colors?.light?.secondaryContrastHex),
        tertiaryHex: normalizeHexColor(theming?.colors?.light?.tertiaryHex),
        tertiaryContrastHex: normalizeHexColor(theming?.colors?.light?.tertiaryContrastHex),
      }),
      dark: compactObject({
        primaryHex: normalizeHexColor(theming?.colors?.dark?.primaryHex),
        primaryContrastHex: normalizeHexColor(theming?.colors?.dark?.primaryContrastHex),
        secondaryHex: normalizeHexColor(theming?.colors?.dark?.secondaryHex),
        secondaryContrastHex: normalizeHexColor(theming?.colors?.dark?.secondaryContrastHex),
        tertiaryHex: normalizeHexColor(theming?.colors?.dark?.tertiaryHex),
        tertiaryContrastHex: normalizeHexColor(theming?.colors?.dark?.tertiaryContrastHex),
      }),
    }),
    headingSrcSet: mapHeadingSrcSet(theming?.headingSrcSet),
    headingCustomStyles: compactObject({
      title: cleanString(theming?.headingCustomStyles?.title),
      subTitle: cleanString(theming?.headingCustomStyles?.subTitle),
      banner: cleanString(theming?.headingCustomStyles?.banner),
    }),
    customImportedFonts: mapImportedFonts(theming?.customImportedFonts),
  });
}

function mapHeadingSrcSet(values: any): Array<{ url: string; descriptor: string }> | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const srcSet = values
    .map((entry) => {
      const url = cleanString(entry?.url);
      const descriptor = cleanString(entry?.descriptor);
      if (!url || !descriptor) {
        return null;
      }
      return { url, descriptor };
    })
    .filter((entry): entry is { url: string; descriptor: string } => !!entry);

  return srcSet.length ? srcSet : undefined;
}

function mapImportedFonts(values: any): Array<{ provider: string; family: string }> | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const fonts = values
    .map((entry) => {
      const provider = cleanString(entry?.provider);
      const family = cleanString(entry?.family);
      if (!provider || !family) {
        return null;
      }
      return { provider, family };
    })
    .filter((entry): entry is { provider: string; family: string } => !!entry);

  return fonts.length ? fonts : undefined;
}

function mapLabelChoices(values: any): Array<{ id: string; label: string }> | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const choices = values
    .map((entry) => {
      const id = cleanString(entry?.id);
      const label = cleanString(entry?.label);
      if (!id || !label) {
        return null;
      }
      return { id, label };
    })
    .filter((entry): entry is { id: string; label: string } => !!entry);

  return choices.length ? choices : undefined;
}

function mapSupportedTalkLanguages(values: any[]): Array<{ id: string; label: string }> | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const languages = values
    .map((language) => {
      const raw = cleanString(language);
      if (!raw) {
        return null;
      }

      return {
        id: raw.toLowerCase(),
        label: raw.toUpperCase(),
      };
    })
    .filter((language): language is { id: string; label: string } => !!language);

  return languages.length ? languages : undefined;
}

function mapRooms(values: any[]): Array<{ id: string; title: string }> | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const rooms = values
    .map((room) => {
      const id = cleanString(room?.id);
      const title = cleanString(room?.name);
      if (!id || !title) {
        return null;
      }

      return { id, title };
    })
    .filter((room): room is { id: string; title: string } => !!room);

  return rooms.length ? rooms : undefined;
}

function mapTracks(values: any[]): Array<{ id: string; title: string; themeColor?: string }> | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const tracks: Array<{ id: string; title: string; themeColor?: string }> = [];
  for (const track of values) {
    const id = cleanString(track?.id);
    const title = cleanString(track?.name);
    if (!id || !title) {
      continue;
    }

    const mapped = compactObject({
      id,
      title,
      themeColor: normalizeHexColor(track?.color),
    });
    if (mapped) {
      tracks.push(mapped as { id: string; title: string; themeColor?: string });
    }
  }

  return tracks.length ? tracks : undefined;
}

function mapTalkFormats(values: any[]): Array<{ id: string; title: string; duration?: string; themeColor?: string }> | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const formats: Array<{ id: string; title: string; duration?: string; themeColor?: string }> = [];
  for (const format of values) {
    const id = cleanString(format?.id);
    const title = cleanString(format?.name);
    if (!id || !title) {
      continue;
    }

    const mapped = compactObject({
      id,
      title,
      duration: toIsoDurationMinutes(format?.duration),
      themeColor: normalizeHexColor(format?.color),
    });
    if (mapped) {
      formats.push(mapped as { id: string; title: string; duration?: string; themeColor?: string });
    }
  }

  return formats.length ? formats : undefined;
}

function toIsoDurationMinutes(value: any): string | undefined {
  const duration = toOptionalNumber(value);
  if (duration === undefined || duration <= 0) {
    return undefined;
  }
  return `PT${Math.round(duration)}M`;
}

function normalizeStringArray(value: any): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const entries = value
    .map((item) => cleanString(item))
    .filter((item): item is string => !!item);

  return entries.length ? entries : undefined;
}

function normalizeHexColor(value: any): string | undefined {
  const text = cleanString(value);
  if (!text) {
    return undefined;
  }

  const raw = text.startsWith('#') ? text.slice(1) : text;
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw.toUpperCase()}`;
  }

  return undefined;
}

function cleanString(value: any): string | undefined {
  const text = String(value ?? '').trim();
  return text.length ? text : undefined;
}

function toOptionalNumber(value: any): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toOptionalBoolean(value: any): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  return undefined;
}

function compactObject<T extends object>(value: T): T | undefined {
  const entries = Object.entries(value).filter(([, entry]) => {
    if (entry === null || entry === undefined) {
      return false;
    }
    if (typeof entry === 'string') {
      return entry.trim().length > 0;
    }
    if (Array.isArray(entry)) {
      return entry.length > 0;
    }
    if (typeof entry === 'object') {
      return Object.keys(entry).length > 0;
    }
    return true;
  });

  if (!entries.length) {
    return undefined;
  }

  return Object.fromEntries(entries) as T;
}
