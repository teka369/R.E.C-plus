import Lottie from 'lottie-react';
import astronautAnimation from '../assets/animations/astronauta-bonito.json';

interface WalkingCharacterProps {
  width: number;
  height: number;
  visible: boolean;
}

const WalkingCharacter: React.FC<WalkingCharacterProps> = ({ width, height, visible }) => {
  // if (!visible) {
  //   return null;
  // }

  return (
    <div className="walking-character-container" data-visible={visible}>
      <Lottie
        animationData={astronautAnimation}
        style={{ width, height }}
      />
    </div>
  );
};

export default WalkingCharacter; 