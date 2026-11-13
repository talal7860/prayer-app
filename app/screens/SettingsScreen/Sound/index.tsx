import React, {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useAudioPlayer, useAudioPlayerStatus} from 'expo-audio';
import AppConstants from '../../../AppConstants';
import {Card, Row, SectionLabel} from '../../../components/ui/Card';
import Icon from '../../../components/ui/Icon';
import Text from '../../../components/ui/Text';
import Toggle from '../../../components/ui/Toggle';
import useAppSettings from '../../../hooks/useAppSettings';
import usePalette from '../../../hooks/usePalette';
import useReadableWidth from '../../../hooks/useReadableWidth';
import I18n from '../../../I18n';

/** Who made each recording (assets/sounds/CREDITS.md has the links and licences). */
const CREDITS =
  'Istanbul: Viceskeeni2 (CC0) · Konya: Frans van der Vaart (CC BY 3.0) · ' +
  'Casablanca: Fraguando (CC BY-SA 4.0) · Tripoli: باسم (CC BY-SA 4.0) · ' +
  'Isfahan: 10EldarionElessar (CC BY 3.0) · Aaqib Azeez: Atcovi (CC BY-SA 4.0) · ' +
  'Fajr: Islamic Center Malmö (CC BY 3.0). From Wikimedia Commons; trimmed to 30 s and ' +
  'volume-matched.';

type Previewable = {key: string; name: string; preview?: number};

const SoundScreen = () => {
  const column = useReadableWidth();
  const {t} = usePalette();
  const {settings, setSetting} = useAppSettings();
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const [picked, setPicked] = useState<string | null>(null);
  // The preview that's playing: none once it ends on its own or is stopped.
  const playing = status.playing ? picked : null;

  const toggle = (sound: Previewable) => {
    if (playing === sound.key) {
      player.pause();
      setPicked(null);
      return;
    }
    if (sound.preview === undefined) {
      return;
    }
    player.replace(sound.preview);
    player.seekTo(0).catch(() => undefined);
    player.play();
    setPicked(sound.key);
  };

  const playButton = (sound: Previewable) =>
    sound.preview === undefined ? null : (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          playing === sound.key
            ? `${I18n.t('soundsScreen.stop')}: ${sound.name}`
            : I18n.t('soundsScreen.play', {name: sound.name})
        }
        hitSlop={8}
        onPress={() => {
          toggle(sound);
        }}
        style={({pressed}) => [styles.play, {backgroundColor: t.hi, opacity: pressed ? 0.7 : 1}]}>
        <Icon
          name={playing === sound.key ? 'stop' : 'play'}
          size={16}
          color={t.accent}
          strokeWidth={2}
        />
      </Pressable>
    );

  const options: Previewable[] = Object.entries(AppConstants.sounds).map(([key, s]) => ({
    key,
    name: s.name,
    preview: s.preview,
  }));
  const fajr: Previewable = {key: 'fajr', ...AppConstants.fajrSound};

  return (
    <ScrollView contentContainerStyle={[styles.scroll, column]}>
      <SectionLabel>{I18n.t('soundsScreen.adhan')}</SectionLabel>
      <Card>
        {options.map((o, i) => {
          const on = o.key === settings.sound;
          return (
            // The play button sits next to the choice, not inside it: inside a radio, VoiceOver
            // can't reach it.
            <View
              key={o.key}
              style={[
                styles.row,
                i < options.length - 1 && {borderBottomWidth: 1, borderBottomColor: t.divider},
              ]}>
              {playButton(o)}
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{selected: on}}
                onPress={() => {
                  setSetting('sound')(o.key);
                }}
                style={({pressed}) => [styles.choice, pressed && {backgroundColor: t.hi}]}>
                <Text
                  weight={on ? 'semibold' : 'medium'}
                  size={15}
                  color={t.text}
                  style={styles.flex}>
                  {o.name}
                </Text>
                {on ? <Icon name="check" size={20} color={t.accent} strokeWidth={2.2} /> : null}
              </Pressable>
            </View>
          );
        })}
      </Card>

      <View style={styles.gap} />
      <Card>
        <Row title={I18n.t('soundsScreen.fajr')} subtitle={I18n.t('soundsScreen.fajrHint')} last>
          <View style={styles.controls}>
            {playButton(fajr)}
            <Toggle
              value={settings.fajrAdhan}
              onChange={setSetting('fajrAdhan')}
              accessibilityLabel={I18n.t('soundsScreen.fajr')}
              accessibilityHint={I18n.t('soundsScreen.fajrHint')}
            />
          </View>
        </Row>
      </Card>

      <Text weight="semibold" size={13} color={t.muted} style={styles.creditsTitle}>
        {I18n.t('soundsScreen.credits')}
      </Text>
      <Text size={12} color={t.muted} style={styles.credits}>
        {CREDITS}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {padding: 16, paddingBottom: 32},
  row: {
    minHeight: 56,
    paddingStart: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  choice: {
    flex: 1,
    alignSelf: 'stretch',
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: {flex: 1, minWidth: 0},
  play: {width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  controls: {flexDirection: 'row', alignItems: 'center', gap: 12},
  gap: {height: 16},
  creditsTitle: {paddingHorizontal: 4, paddingTop: 20, paddingBottom: 4},
  credits: {paddingHorizontal: 4, lineHeight: 17},
});

export default SoundScreen;
