# Data for the club directory

Committed reference data the directory build uses. The club data itself is
**never** committed (this repo is public): it is fetched at build time from
the app's `web-directory` function, or read from the gitignored
`.cache/directory.json` when building locally. See `src/data/directory.ts`.

| File | What | Source and licence |
|---|---|---|
| `data/lad.geojson` | Council areas (Local Authority Districts, May 2024, UK, ultra generalised, 361 features). `src/data/geo.ts` places each club's venue in one, and that is its area page. | ONS Open Geography Portal, `Local_Authority_Districts_May_2024_Boundaries_UK_BUC`. Open Government Licence v3.0. Contains OS data © Crown copyright and database right 2024. |
| `public/postcode-districts.json` | Active postcode districts as `[district, lat, lng, localities]` (2,944 rows), for the finder's postcode and town search in the browser, so a postcode never leaves the visitor's device. | Doogal postcode districts, derived from ONS and OS Code-Point Open. Open Government Licence v3.0. Contains OS data © Crown copyright and database right; contains Royal Mail data © Royal Mail copyright and database right. |

The directory pages' footer carries the attribution. To refresh either file,
download it again, keep the same shape, and rebuild:

```sh
# Council areas
curl -o data/lad.geojson 'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Local_Authority_Districts_May_2024_Boundaries_UK_BUC/FeatureServer/0/query?where=1%3D1&outFields=LAD24CD,LAD24NM&outSR=4326&f=geojson'
```

Postcode districts: download `https://www.doogal.co.uk/PostcodeDistrictsCSV.ashx`
and keep rows with active postcodes, writing `[Postcode, Latitude (3dp),
Longitude (3dp), Town/Area]`.

## Building locally

```sh
DIRECTORY_URL=https://<project>.supabase.co/functions/v1/web-directory \
DIRECTORY_SECRET=<secret> npm run build
```

The first build with both set saves the response to `.cache/directory.json`;
later builds without them reuse it. In CI (`CI` set) both are required, and a
failed fetch fails the build, so the live site keeps its last good directory.
