import { BlendSettings } from './blend';

export interface DemoExample {
  id: string;
  title: string;
  description: string;
  photoPath: string;
  coverId: string;
  settings: BlendSettings;
  resultPath: string;
}
