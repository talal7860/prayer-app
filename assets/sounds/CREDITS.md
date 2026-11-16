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
| `adhan_fajr.wav` | Fajr adhan (Nov 2026, replaced the Malmö recording) | | Recording given by the app's owner | a TikTok video, downloaded as MP3 (3 min 41 s; the clip is its first 29.5 s) |

The in-app credit is in Settings → Adhan sound (`app/screens/SettingsScreen/Sound`). Madinah and
Al-Aqsa were added at the owner's request from assabile.com, and the Fajr adhan is a recording the
owner gave; their licence isn't stated, so confirm the right to use them.

How a clip was made (ffmpeg), e.g. Madinah, whose adhan starts 4 s in:

```bash
ffmpeg -ss 4 -t 29.5 -i input.wav \
  -af "afade=t=in:d=0.05,afade=t=out:st=27:d=2.5,loudnorm=I=-12:TP=-1:LRA=11" \
  -ac 1 -ar 22050 -c:a pcm_s16le adhan_madinah.wav
```
