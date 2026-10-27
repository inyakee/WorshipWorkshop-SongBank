import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const fail = message => { throw new Error(message); };
const read = path => {
  if (statSync(path).size > 5 * 1024 * 1024) fail(`File exceeds 5 MiB: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
};
const isText = (value, max, required = false) => typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0);

export function validateGlobalSongBank(catalogPath) {
  const catalog = read(catalogPath);
  if (!catalog || catalog.schema_version !== 1 || !Array.isArray(catalog.songs)) fail('Expected schema_version: 1 and a songs array.');
  if (Object.keys(catalog).some(key => !['schema_version','songs'].includes(key))) fail('Unexpected catalog field. Publish the song index only.');
  const ids = new Set(), paths = new Set();
  const allowed = new Set(['id','title','artist','lyrics','chords','musical_key','arrangement','contributor_name','contributor_id','arrangement_label']);
  for (const entry of catalog.songs) {
    if (!entry || !isText(entry.id, 200, true) || !isText(entry.title, 200, true)) fail('Each catalog entry needs an ID and title.');
    if (Object.keys(entry).some(key => !['id','title','file'].includes(key))) fail(`Unexpected index field for ${entry.id}.`);
    if (ids.has(entry.id)) fail(`Duplicate song ID: ${entry.id}`);
    ids.add(entry.id);
    if (typeof entry.file !== 'string' || !/^songs\/[A-Za-z0-9_-]+\.json$/.test(entry.file)) fail(`Invalid song path for ${entry.id}.`);
    if (paths.has(entry.file)) fail(`Multiple entries reference ${entry.file}.`);
    paths.add(entry.file);
    const song = read(resolve(dirname(catalogPath), entry.file));
    if (song.id !== entry.id || song.title !== entry.title) fail(`Catalog ID/title does not match ${entry.file}.`);
    for (const field of Object.keys(song)) {
      if (!allowed.has(field)) fail(`Unexpected field '${field}' in ${entry.file}. Publish song content only.`);
    }
    for (const field of ['artist','lyrics','chords','musical_key','contributor_name','contributor_id','arrangement_label']) {
      if (song[field] != null && !isText(song[field], ['artist','lyrics','chords'].includes(field) ? 50000 : 200)) fail(`Invalid ${field} in ${entry.file}.`);
    }
    if (song.musical_key && !/^[A-G](?:#|b)?m?$/.test(song.musical_key)) fail(`Invalid musical key in ${entry.file}.`);
    if (song.arrangement != null) {
      const chart = song.arrangement;
      if (chart.version !== 1 || !Array.isArray(chart.sections) || chart.sections.length > 100) fail(`Invalid arrangement in ${entry.file}.`);
      const fields = new Set(['version','entry_mode','sections','legacy_chords']);
      if (Object.keys(chart).some(key => !fields.has(key))) fail(`Unexpected arrangement field in ${entry.file}.`);
      for (const field of ['entry_mode','legacy_chords']) {
        if (chart[field] != null && !isText(chart[field],50000)) fail(`Invalid arrangement ${field} in ${entry.file}.`);
      }
      for (const section of chart.sections) {
        if (!section || !isText(section.label,200) || !isText(section.content,50000) || Object.keys(section).some(key => !['label','content'].includes(key))) fail(`Invalid section in ${entry.file}.`);
      }
      if (chart.sections.map(section => `${section.label}\n${section.content}`).join('\n').length > 50000) fail(`Arrangement is too large in ${entry.file}.`);
    }
  }
  return { songCount: ids.size, files: [...paths] };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const catalogPath = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../catalog.json', import.meta.url));
    const result = validateGlobalSongBank(catalogPath);
    console.log(`Global SongBank validated: ${result.songCount} songs; all files match their catalog entries.`);
    if (result.songCount === 0) console.log('The catalog is empty; users will have no songs to download.');
  } catch (error) {
    console.error(`Global SongBank validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
