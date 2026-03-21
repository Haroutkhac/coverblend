import { BlendSettings } from '@/types/blend';

export interface DemoPreset {
  id: string;
  title: string;
  description: string;
  photoGradient: string;
  coverIds: string[];
  settings: BlendSettings;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'demo-sunset',
    title: 'Golden Sunset',
    description: 'Warm amber tones dissolve into the horizon — perfect for mellow, atmospheric covers.',
    photoGradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 30%, #ffd700 60%, #2d1b69 100%)',
    coverIds: ['cover-003', 'cover-018', 'cover-042'],
    settings: {
      opacity: 0.82,
      featherRadius: 45,
      positionX: 0.5,
      positionY: 0.45,
      scale: 0.85,
      rotation: 0,
      blendMode: 'normal',
      colorTransferEnabled: true,
      colorTransferStrength: 0.75,
    },
  },
  {
    id: 'demo-ocean',
    title: 'Deep Ocean',
    description: 'Cool blues and teals with gentle texture — album art vanishes into the waves.',
    photoGradient: 'linear-gradient(180deg, #0c2340 0%, #1a5276 30%, #2e86c1 60%, #85c1e9 100%)',
    coverIds: ['cover-007', 'cover-025', 'cover-089'],
    settings: {
      opacity: 0.88,
      featherRadius: 50,
      positionX: 0.5,
      positionY: 0.5,
      scale: 0.9,
      rotation: 0,
      blendMode: 'normal',
      colorTransferEnabled: true,
      colorTransferStrength: 0.8,
    },
  },
  {
    id: 'demo-neon',
    title: 'Neon Night',
    description: 'Electric purples and magentas — urban nightlife swallows the cover whole.',
    photoGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 60%, #e91e8c 100%)',
    coverIds: ['cover-012', 'cover-056', 'cover-101'],
    settings: {
      opacity: 0.85,
      featherRadius: 35,
      positionX: 0.5,
      positionY: 0.5,
      scale: 0.95,
      rotation: 0,
      blendMode: 'screen',
      colorTransferEnabled: true,
      colorTransferStrength: 0.65,
    },
  },
  {
    id: 'demo-forest',
    title: 'Emerald Forest',
    description: 'Deep greens and earth tones — organic textures absorb the album artwork.',
    photoGradient: 'linear-gradient(160deg, #1a472a 0%, #2d5016 30%, #4a7c20 60%, #2d3b1a 100%)',
    coverIds: ['cover-031', 'cover-067', 'cover-112'],
    settings: {
      opacity: 0.80,
      featherRadius: 55,
      positionX: 0.48,
      positionY: 0.52,
      scale: 0.88,
      rotation: 0,
      blendMode: 'multiply',
      colorTransferEnabled: true,
      colorTransferStrength: 0.7,
    },
  },
  {
    id: 'demo-minimal',
    title: 'Concrete Minimal',
    description: 'Muted grays and subtle textures — monochrome covers disappear into urban surfaces.',
    photoGradient: 'linear-gradient(180deg, #3a3a3a 0%, #5c5c5c 30%, #8a8a8a 60%, #4a4a4a 100%)',
    coverIds: ['cover-045', 'cover-078', 'cover-134'],
    settings: {
      opacity: 0.90,
      featherRadius: 40,
      positionX: 0.5,
      positionY: 0.5,
      scale: 1.0,
      rotation: 0,
      blendMode: 'overlay',
      colorTransferEnabled: true,
      colorTransferStrength: 0.85,
    },
  },
];
