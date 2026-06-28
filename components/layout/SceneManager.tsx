'use client';

import { useSceneStore } from '@/store/sceneStore';
import { Scene1 } from '../scene/Scene1';
import { Scene2_StarHill } from '../scene/Scene2_StarHill';
import { ResultTemplate } from '../result/ResultTemplate';

export const SceneManager = () => {
  const currentScene = useSceneStore((state) => state.currentScene);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {currentScene === 'scene1' && <Scene1 />}
      {currentScene === 'scene2' && <Scene2_StarHill />}
      {currentScene === 'result' && <ResultTemplate />}
    </div>
  );
};
