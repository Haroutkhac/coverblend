export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';

export interface BlendSettings {
  opacity: number;
  featherRadius: number;
  positionX: number;
  positionY: number;
  scale: number;
  rotation: number;
  blendMode: BlendMode;
  colorTransferEnabled: boolean;
  colorTransferStrength: number;
}

export interface CompositeResult {
  dataUrl: string;
  width: number;
  height: number;
}

export const DEFAULT_BLEND_SETTINGS: BlendSettings = {
  opacity: 0.85,
  featherRadius: 40,
  positionX: 0.5,
  positionY: 0.5,
  scale: 1.0,
  rotation: 0,
  blendMode: 'normal',
  colorTransferEnabled: true,
  colorTransferStrength: 0.7,
};
