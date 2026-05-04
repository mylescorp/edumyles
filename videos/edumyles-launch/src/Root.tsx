import { Composition } from "remotion";
import { EduMylesLaunch } from "./EduMylesLaunch";

export const RemotionRoot = () => {
  return (
    <Composition
      id="EduMylesLaunch"
      component={EduMylesLaunch}
      durationInFrames={1350}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
