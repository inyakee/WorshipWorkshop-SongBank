# WorshipWorkshop-SongBank

Public song library for Worship Workspace. This repository contains only songs,
the downloadable catalog, credits, and a validation script. The Flutter app source
remains in its separate repository. No GitHub login is needed to download songs.

The catalog is at the repository root: `catalog.json`. Hymn files are in `songs/`.
Publish the catalog and all referenced song files together.

## Starter hymns and credits

| Hymn | Text author | Key | Included text | Public-domain reference |
|---|---|---|---|---|
| Amazing Grace | John Newton | G | Four traditional Newton stanzas | [Hymnary text record](https://hymnary.org/text/amazing_grace_how_sweet_the_sound) |
| Holy, Holy, Holy! | Reginald Heber | D | Four traditional stanzas | [Hymnary text record](https://www.hymnary.org/text/holy_holy_holy_lord_god_almighty_early) |
| Praise God, from Whom All Blessings Flow | Thomas Ken | D | Traditional four-line doxology | [Hymnary text record](https://hymnary.org/text/praise_god_from_whom_all_blessings_ken) |

These entries use traditional public-domain texts. The simple chord charts were
prepared for this app; they are not copies of a modern published arrangement.
No modern added choruses, translations, scores, audio, or recordings are included.
The writer is credited in `artist`; these seed entries do not claim a user
contributor identity. Review the charts before using them for a service.

Each hymn has its own new permanent ID. Devices keep existing downloaded songs under the insert-only sync behavior.

## Before pushing

```sh
node scripts/validate-global-songbank.mjs
```

This checks that catalog IDs are unique, referenced files exist, IDs/titles match,
and song files contain only the supported public song fields. Do not add an entire
SQLite database, account records, contributor private keys, or recovery codes.

## Add another song

1. Create `songs/your-permanent-id.json` with the same format as the other songs.
2. Add its ID, title, and relative file path to `catalog.json`.
3. Keep previously published IDs and paths stable. Do not reuse an existing ID for
   another arrangement or contributor; create a different ID for that version.
4. Run the validator, review the changes, and commit/push the files together.

An optional `contributor_name` is display attribution, not verified identity. Keep
it separate from the original song writer stored in `artist`.

## Check after pushing

Open the app on Chrome or your iPhone simulator. In **Global SongBank**, choose
**Check for new songs**, then **Download all songs** (or **Download N new songs**).
Open a downloaded song with the network disconnected to check local storage.
New songs are identified by their IDs. Existing downloaded songs are never replaced
or deleted by sync, even if their files change on GitHub.

The default catalog URL is:
<https://raw.githubusercontent.com/inyakee/WorshipWorkshop-SongBank/main/catalog.json>

GitHub must serve the catalog and song files publicly for downloads without login.
Publishing via the app's contribution interface still needs the future GitHub App
and Cloudflare service. Pushing song files manually does not enable that service.

## Validate changes

Requires Node.js (no dependencies or server needed):

```sh
node scripts/validate-global-songbank.mjs
node --test scripts/validate-global-songbank.test.mjs
```

Only commit files intended to be public. Contributor private keys, recovery codes,
account data, and full application databases do not belong in this repository.
