import type { Tehsil } from './location-data';
import { SEED_EMAIL_DOMAIN } from './email-domain';

export function tehsilSlug(name: Tehsil): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export function tehsilRaEmail(name: Tehsil): string {
  return `ra.es.${tehsilSlug(name)}@${SEED_EMAIL_DOMAIN}`;
}

export function tehsilRaUsername(name: Tehsil): string {
  return `ra_es_${tehsilSlug(name).replace(/-/g, '_')}`;
}
