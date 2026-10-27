import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateGlobalSongBank } from './validate-global-songbank.mjs';

test('public catalog validates and rejects missing, duplicate, mismatched, unsafe or private data', () => {
  const root = mkdtempSync(join(tmpdir(),'ww-catalog-'));
  const catalog = join(root,'catalog.json');
  mkdirSync(join(root,'songs'));
  const entry = {id:'song-a',title:'Original song',file:'songs/a.json'};
  const song = {id:entry.id,title:entry.title,lyrics:'Original text',musical_key:'C',arrangement:null};
  const write = (entries = [entry], content = song) => {
    writeFileSync(catalog,JSON.stringify({schema_version:1,songs:entries}));
    writeFileSync(join(root,'songs/a.json'),JSON.stringify(content));
  };
  try {
    write(); assert.equal(validateGlobalSongBank(catalog).songCount,1);
    write([{...entry,seed:'never publish'}]); assert.throws(() => validateGlobalSongBank(catalog),/Unexpected index field/);
    write([entry,entry]); assert.throws(() => validateGlobalSongBank(catalog),/Duplicate/);
    write([{...entry,file:'songs/missing.json'}]); assert.throws(() => validateGlobalSongBank(catalog));
    write([{...entry,file:'../private.json'}]); assert.throws(() => validateGlobalSongBank(catalog),/Invalid song path/);
    write([entry],{...song,id:'wrong'}); assert.throws(() => validateGlobalSongBank(catalog),/does not match/);
    write([entry],{...song,seed:'never publish'}); assert.throws(() => validateGlobalSongBank(catalog),/Unexpected field/);
    write([entry],{...song,arrangement:{version:1,sections:[{label:'Verse',content:123}]}}); assert.throws(() => validateGlobalSongBank(catalog),/Invalid section/);
  } finally {rmSync(root,{recursive:true,force:true});}
});
