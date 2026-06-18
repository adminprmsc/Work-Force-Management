"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEHSIL_PACKAGE_NAMING = void 0;
exports.getTehsilPackageNaming = getTehsilPackageNaming;
exports.getTehsilDisplayName = getTehsilDisplayName;
exports.composeProcurementPackageName = composeProcurementPackageName;
exports.composePackageNameWithTehsil = composePackageNameWithTehsil;
exports.stripTehsilFromPackageName = stripTehsilFromPackageName;
exports.getTehsilNamesForGroup = getTehsilNamesForGroup;
const titleCase = (value) => value
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
exports.TEHSIL_PACKAGE_NAMING = {
    BHOWANA: {
        zoneLabel: 'Central-I',
        displayLabel: 'Bhawana',
        abbrev: 'BNA',
        groupKey: 'BNA',
    },
    PAKPATTAN: {
        zoneLabel: 'Central-II',
        displayLabel: 'Pakpattan',
        abbrev: 'PKN',
        groupKey: 'PKN',
    },
    SHUJABAD: {
        zoneLabel: 'South-II',
        displayLabel: 'Shujaabad',
        abbrev: 'SJD',
        groupKey: 'SJD',
    },
    'KALLAR KAHAR': {
        zoneLabel: 'North',
        displayLabel: 'Kallar Kahar & Kot Momin',
        abbrev: 'KLK',
        groupKey: 'KLK',
    },
    'KOT MOMIN': {
        zoneLabel: 'North',
        displayLabel: 'Kallar Kahar & Kot Momin',
        abbrev: 'KLK',
        groupKey: 'KLK',
    },
    'AHMADPUR SIAL': {
        zoneLabel: 'South-I',
        displayLabel: titleCase('AHMADPUR SIAL'),
        abbrev: 'APS',
        groupKey: 'APS',
    },
    ALIPUR: {
        zoneLabel: 'South-I',
        displayLabel: 'Alipur',
        abbrev: 'ALP',
        groupKey: 'ALP',
    },
    BAHAWALNAGAR: {
        zoneLabel: 'Central-III',
        displayLabel: 'Bahawalnagar',
        abbrev: 'BWN',
        groupKey: 'BWN',
    },
    'DARYA KHAN': {
        zoneLabel: 'North',
        displayLabel: titleCase('DARYA KHAN'),
        abbrev: 'DYK',
        groupKey: 'DYK',
    },
    'ISA KHEL': {
        zoneLabel: 'North',
        displayLabel: titleCase('ISA KHEL'),
        abbrev: 'ISK',
        groupKey: 'ISK',
    },
    'KAHROR PACCA': {
        zoneLabel: 'South-II',
        displayLabel: titleCase('KAHROR PACCA'),
        abbrev: 'KPC',
        groupKey: 'KPC',
    },
    'KHAIRPUR TAMEWALI': {
        zoneLabel: 'Central-III',
        displayLabel: titleCase('KHAIRPUR TAMEWALI'),
        abbrev: 'KPT',
        groupKey: 'KPT',
    },
    LIAQATPUR: {
        zoneLabel: 'South-I',
        displayLabel: 'Liaqatpur',
        abbrev: 'LQP',
        groupKey: 'LQP',
    },
    'NOORPUR THAL': {
        zoneLabel: 'North',
        displayLabel: titleCase('NOORPUR THAL'),
        abbrev: 'NPT',
        groupKey: 'NPT',
    },
    ROJHAN: {
        zoneLabel: 'South-I',
        displayLabel: 'Rojhan',
        abbrev: 'RJH',
        groupKey: 'RJH',
    },
    TAUNSA: {
        zoneLabel: 'South-I',
        displayLabel: 'Taunsa',
        abbrev: 'TAU',
        groupKey: 'TAU',
    },
};
function getTehsilPackageNaming(tehsilName) {
    return exports.TEHSIL_PACKAGE_NAMING[tehsilName.toUpperCase()] ?? null;
}
function getTehsilDisplayName(tehsilName) {
    const naming = getTehsilPackageNaming(tehsilName);
    if (naming)
        return naming.displayLabel;
    return titleCase(tehsilName);
}
function composeProcurementPackageName(zoneLabel, tehsilDisplayName, packageCode, contractSuffix) {
    return [zoneLabel, tehsilDisplayName, packageCode, contractSuffix]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ');
}
function composePackageNameWithTehsil(namePart, tehsilDisplayName) {
    const part = namePart.trim().replace(/\s+/g, ' ');
    const tehsil = tehsilDisplayName.trim();
    if (!part)
        return tehsil;
    if (!tehsil)
        return part;
    if (part.toLowerCase().includes(tehsil.toLowerCase()))
        return part;
    const firstSpace = part.indexOf(' ');
    if (firstSpace === -1) {
        return `${part} ${tehsil}`;
    }
    const prefix = part.slice(0, firstSpace);
    const rest = part.slice(firstSpace + 1).trim();
    return `${prefix} ${tehsil}${rest ? ` ${rest}` : ''}`;
}
function stripTehsilFromPackageName(fullName, tehsilDisplayName) {
    const tehsil = tehsilDisplayName.trim();
    if (!tehsil)
        return fullName.trim();
    const escaped = tehsil.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return fullName
        .replace(new RegExp(`\\s${escaped}(?=\\s|$)`, 'i'), ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function getTehsilNamesForGroup(groupKey) {
    return Object.entries(exports.TEHSIL_PACKAGE_NAMING)
        .filter(([, naming]) => naming.groupKey === groupKey)
        .map(([name]) => name);
}
//# sourceMappingURL=tehsil-package-naming.js.map