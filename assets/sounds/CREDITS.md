# Adhan recordings

The bundled adhan sounds. Each clip is the opening 29.5 s of the original (iOS plays at most 30 s
of a notification sound), converted to 22.05 kHz mono 16-bit WAV, faded out over the last 2.5 s
and loudness-matched to the Makkah adhan (about −12 LUFS). Clips made from CC BY-SA recordings are
shared under the same licence.

| File | Recording | Author | Licence | Source |
|---|---|---|---|---|
| `makkah_azan.wav` | Makkah adhan | (bundled since the first version) | | |
| `adhan_madinah.wav` | Madinah adhan (Masjid an-Nabawi) | | Source given by the app's owner | [assabile.com](https://media.assabile.com/assabile/adhan_3435370/e9bb86af0d30.mp3) |
| `adhan_aqsa.wav` | Al-Aqsa adhan | | Source given by the app's owner | [assabile.com](https://media.assabile.com/assabile/adhan_3435370/c888cbd50d15.mp3) (16 kbps source, so it sounds thin) |
| `adhan_fajr.wav` | Eid al-Fitr Fajr azan, Malmö Mosque (2012) | Islamic Center Malmö | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Eid_al-Fitr_Fajr_azan_at_Malm%C3%B6_Mosque_-_19_August_2012.webm) |

The in-app credit is in Settings → Adhan sound (`app/screens/SettingsScreen/Sound`). Madinah and
Al-Aqsa were added at the owner's request from assabile.com; their licence isn't stated there, so
confirm the right to use them before a public release.

How a clip was made (ffmpeg), e.g. Madinah, whose adhan starts 4 s in:

```bash
ffmpeg -ss 4 -t 29.5 -i input.wav \
  -af "afade=t=in:d=0.05,afade=t=out:st=27:d=2.5,loudnorm=I=-12:TP=-1:LRA=11" \
  -ac 1 -ar 22050 -c:a pcm_s16le adhan_madinah.wav
```
