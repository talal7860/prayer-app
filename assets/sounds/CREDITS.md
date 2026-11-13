# Adhan recordings

The bundled adhan sounds. Each clip is the opening 29.5 s of the original (iOS plays at most 30 s
of a notification sound), converted to 22.05 kHz mono 16-bit WAV, faded out over the last 2.5 s
and loudness-matched to the Makkah adhan (about −12 LUFS). Clips made from CC BY-SA recordings are
shared under the same licence.

| File | Recording | Author | Licence | Source |
|---|---|---|---|---|
| `makkah_azan.wav` | Makkah adhan | (bundled since the first version) | | |
| `adhan_istanbul.wav` | Adhan in Istanbul | Viceskeeni2 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Adhan_in_Istanbul.webm) |
| `adhan_konya.wav` | Hminsec150 Konya | Frans van der Vaart | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hminsec150_Konya.webm) |
| `adhan_casablanca.wav` | Llamada a oración, Mezquita Hassan II (Casablanca) | Fraguando | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Llamada_a_oraci%C3%B3n_Mezquita_Hassan_II.wav) |
| `adhan_tripoli.wav` | Adhan in Al-Nour Square, Tripoli, Lebanon (2019) | باسم | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Adhan_During_the_Lebanese_Protests_in_Tripoli_2019.webm) |
| `adhan_isfahan.wav` | Adhan in the Shah Mosque, Isfahan, Iran | 10EldarionElessar | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Tour_guide_recite_Adhan_in_the_Shah_mosque_in_Isfahan,_Iran.webm) |
| `adhan_azeez.wav` | The Adhan, Aaqib Azeez | Atcovi | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:The_Adhan_-_Muslim_Call_to_Prayer_-_Aaqib_Azeez.mp3) |
| `adhan_fajr.wav` | Eid al-Fitr Fajr azan, Malmö Mosque (2012) | Islamic Center Malmö | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Eid_al-Fitr_Fajr_azan_at_Malm%C3%B6_Mosque_-_19_August_2012.webm) |

The in-app credit is in Settings → Adhan sound (`app/screens/SettingsScreen/Sound`). Recordings
of specific mosques' broadcasts (Madinah, Al-Aqsa) or reciters' albums aren't included: no openly
licensed copies were found, and copies marked "public domain" by third-party uploaders aren't
theirs to license.

How a clip was made (ffmpeg), e.g. Casablanca, whose adhan starts 2 s in:

```bash
ffmpeg -ss 2 -t 29.5 -i input.wav \
  -af "afade=t=in:d=0.05,afade=t=out:st=27:d=2.5,loudnorm=I=-12:TP=-1:LRA=11" \
  -ac 1 -ar 22050 -c:a pcm_s16le adhan_casablanca.wav
```
