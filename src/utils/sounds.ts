import * as FileSystem from 'expo-file-system';

// Generates a simple sine-wave WAV as a base64 string.
// No audio files needed — tones are computed at runtime.
function generateWav(frequency: number, durationMs: number, volume = 60): string {
    const sampleRate = 8000;
    const numSamples = Math.floor((sampleRate * durationMs) / 1000);
    const bytes: number[] = [];

    const w32 = (n: number) => bytes.push(n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff);
    const w16 = (n: number) => bytes.push(n & 0xff, (n >> 8) & 0xff);
    const ws = (s: string) => { for (const c of s) bytes.push(c.charCodeAt(0)); };

    ws('RIFF'); w32(36 + numSamples); ws('WAVE');
    ws('fmt '); w32(16); w16(1); w16(1);
    w32(sampleRate); w32(sampleRate); w16(1); w16(8);
    ws('data'); w32(numSamples);

    for (let i = 0; i < numSamples; i++) {
        const env = i < numSamples * 0.08
            ? i / (numSamples * 0.08)
            : i > numSamples * 0.65
                ? 1 - (i - numSamples * 0.65) / (numSamples * 0.35)
                : 1;
        const sample = 128 + volume * env * Math.sin(2 * Math.PI * frequency * i / sampleRate);
        bytes.push(Math.max(0, Math.min(255, Math.round(sample))));
    }

    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s);
}

type SoundName = 'tap' | 'goal' | 'achievement';

const SOUND_DEFS: Record<SoundName, { freq: number; durationMs: number; volume?: number }> = {
    tap:         { freq: 600,  durationMs: 55  },
    goal:        { freq: 880,  durationMs: 220, volume: 70 },
    achievement: { freq: 1047, durationMs: 420, volume: 70 },
};

// Cache of loaded Audio.Sound objects
const soundCache: Partial<Record<SoundName, any>> = {};

async function loadSound(name: SoundName): Promise<any | null> {
    try {
        const { Audio } = await import('expo-av');
        if (soundCache[name]) return soundCache[name];

        const def = SOUND_DEFS[name];
        const base64 = generateWav(def.freq, def.durationMs, def.volume);
        const path = `${FileSystem.cacheDirectory}momentum_${name}.wav`;
        await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });

        const { sound } = await Audio.Sound.createAsync({ uri: path }, { shouldPlay: false });
        soundCache[name] = sound;
        return sound;
    } catch {
        return null;
    }
}

export const playSound = async (name: SoundName, enabled: boolean) => {
    if (!enabled) return;
    try {
        const sound = await loadSound(name);
        if (!sound) return;
        await sound.setPositionAsync(0);
        await sound.playAsync();
    } catch {
        // Silently fail — audio is non-critical
    }
};
