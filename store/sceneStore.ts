import { create } from 'zustand';

export type SceneType = 'scene1' | 'scene2' | 'result';

interface SceneState {
  currentScene: SceneType;
  setScene: (scene: SceneType) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  currentScene: 'scene1',
  setScene: (scene) => set({ currentScene: scene }),
}));
