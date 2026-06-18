import type { Tehsil } from './location-data';

export function tehsilSlug(name: Tehsil): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export function tehsilRaEmail(name: Tehsil): string {
  return `ra.es.${tehsilSlug(name)}@wfm.local`;
}

export function tehsilRaUsername(name: Tehsil): string {
  return `ra_es_${tehsilSlug(name).replace(/-/g, '_')}`;
}
