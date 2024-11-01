import React from 'react';
import { motion } from 'framer-motion';
import { Square, Brain, Volume2, Volume1 } from 'lucide-react';

interface Tile {
  id: number;
  color: string;
}

const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500'];

export default function GameBoard() {
  const [sequence, setSequence] = React.useState<number[]>([]);
  const [userSequence, setUserSequence] = React.useState<number[]>([]);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [highScore, setHighScore] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);

  const tiles: Tile[] = colors.map((color, index) => ({
    id: index,
    color,
  }));

  const playSound = (frequency: number) => {
    if (isMuted) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const startGame = () => {
    setSequence([Math.floor(Math.random() * 4)]);
    setUserSequence([]);
    setIsPlaying(true);
    setScore(0);
  };

  const playSequence = async () => {
    setIsPlaying(true);
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      playSound(200 + sequence[i] * 100);
      const tile = document.querySelector(`[data-tile="${sequence[i]}"]`);
      tile?.classList.add('active');
      await new Promise(resolve => setTimeout(resolve, 300));
      tile?.classList.remove('active');
    }
    setIsPlaying(false);
  };

  const handleTileClick = (tileId: number) => {
    if (isPlaying) return;
    
    playSound(200 + tileId * 100);
    const newUserSequence = [...userSequence, tileId];
    setUserSequence(newUserSequence);

    if (newUserSequence[newUserSequence.length - 1] !== sequence[newUserSequence.length - 1]) {
      setHighScore(Math.max(score, highScore));
      setIsPlaying(true);
      setTimeout(() => {
        startGame();
      }, 1000);
      return;
    }

    if (newUserSequence.length === sequence.length) {
      setScore(score + 1);
      setUserSequence([]);
      setTimeout(() => {
        setSequence([...sequence, Math.floor(Math.random() * 4)]);
      }, 1000);
    }
  };

  React.useEffect(() => {
    if (sequence.length > 0) {
      playSequence();
    }
  }, [sequence]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
      <div className="mb-8 flex items-center gap-3">
        <Brain className="w-8 h-8 text-indigo-400" />
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">
          Mind Challenge
        </h1>
      </div>

      <div className="mb-6 flex gap-4 items-center">
        <div className="text-lg">Score: <span className="font-bold text-emerald-400">{score}</span></div>
        <div className="text-lg">Best: <span className="font-bold text-amber-400">{highScore}</span></div>
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
        >
          {isMuted ? <Volume1 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {tiles.map((tile) => (
          <motion.button
            key={tile.id}
            data-tile={tile.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTileClick(tile.id)}
            className={`w-32 h-32 rounded-xl ${tile.color} shadow-lg cursor-pointer transition-all duration-200
              hover:brightness-110 active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed
              [&.active]:brightness-125 [&.active]:scale-95`}
            disabled={isPlaying}
          >
            <Square className="w-8 h-8 mx-auto opacity-50" />
          </motion.button>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={startGame}
        className="px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-600 font-semibold
          shadow-lg transition-colors text-lg"
      >
        {sequence.length === 0 ? 'Start Game' : 'Restart'}
      </motion.button>
    </div>
  );
}