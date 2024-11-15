import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Apple, PlayCircle, RotateCcw, Crown, Volume2, Volume1, Smartphone } from 'lucide-react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;
const SWIPE_THRESHOLD = 50;

export default function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [isGameOver, setIsGameOver] = useState(true);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [isMuted, setIsMuted] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

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

  const generateFood = useCallback((): Position => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection('RIGHT');
    setIsGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
  };

  const checkCollision = (head: Position): boolean => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    return snake.some((segment) => segment.x === head.x && segment.y === head.y);
  };

  const moveSnake = useCallback(() => {
    if (isGameOver) return;

    setSnake((prevSnake) => {
      const head = { ...prevSnake[0] };

      switch (direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      if (checkCollision(head)) {
        setIsGameOver(true);
        setHighScore((prev) => Math.max(prev, score));
        playSound(150);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      if (head.x === food.x && head.y === food.y) {
        setFood(generateFood());
        setScore((prev) => prev + 1);
        setSpeed((prev) => prev - SPEED_INCREMENT);
        playSound(400);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, generateFood, isGameOver, score]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isGameOver) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_THRESHOLD) return;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0) {
        setDirection((prev) => prev !== 'LEFT' ? 'RIGHT' : prev);
      } else {
        setDirection((prev) => prev !== 'RIGHT' ? 'LEFT' : prev);
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        setDirection((prev) => prev !== 'UP' ? 'DOWN' : prev);
      } else {
        setDirection((prev) => prev !== 'DOWN' ? 'UP' : prev);
      }
    }

    setTouchStart(null);
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isGameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
          setDirection((prev) => prev !== 'DOWN' ? 'UP' : prev);
          break;
        case 'ArrowDown':
          setDirection((prev) => prev !== 'UP' ? 'DOWN' : prev);
          break;
        case 'ArrowLeft':
          setDirection((prev) => prev !== 'RIGHT' ? 'LEFT' : prev);
          break;
        case 'ArrowRight':
          setDirection((prev) => prev !== 'LEFT' ? 'RIGHT' : prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isGameOver]);

  useEffect(() => {
    const gameLoop = setInterval(moveSnake, speed);
    return () => clearInterval(gameLoop);
  }, [moveSnake, speed]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-900 to-gray-900 text-white p-4">
      <div className="mb-6 flex items-center gap-3">
        <Crown className="w-8 h-8 text-yellow-400" />
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-yellow-400">
          Snake Game
        </h1>
      </div>

      <div className="mb-4 flex gap-6 items-center">
        <div className="text-lg">Score: <span className="font-bold text-emerald-400">{score}</span></div>
        <div className="text-lg">Best: <span className="font-bold text-yellow-400">{highScore}</span></div>
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
        >
          {isMuted ? <Volume1 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <div 
        className="relative bg-gray-800 rounded-lg shadow-xl overflow-hidden mb-6 touch-none"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Food */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute"
          style={{
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
          }}
        >
          <Apple className="w-full h-full text-red-500" />
        </motion.div>

        {/* Snake */}
        {snake.map((segment, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute rounded-sm ${
              index === 0 
                ? 'bg-emerald-400' 
                : 'bg-emerald-500'
            }`}
            style={{
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          />
        ))}
      </div>

      {isGameOver && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetGame}
          className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 font-semibold
            shadow-lg transition-colors text-lg flex items-center gap-2"
        >
          {score === 0 ? (
            <>
              <PlayCircle className="w-5 h-5" />
              Start Game
            </>
          ) : (
            <>
              <RotateCcw className="w-5 h-5" />
              Play Again
            </>
          )}
        </motion.button>
      )}

      <div className="mt-4 text-gray-400 text-sm flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Swipe to control on mobile
        </div>
        <div>Use arrow keys to control on desktop</div>

        <footer className="text-white py-4 mt-20 flex justify-center items-center">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="text-sm mr-5">
          <span>&copy; {new Date().getFullYear()} - Developed by Nadun Kosala</span>
        </div>
       
      </div>
     
    </footer>
    <div className='mt-0 flex justify-center items-center'>
      <div className="flex space-x-4 mt-2 md:mt-0 gap-2">
          <a
            href="https://github.com/nadun-kosala"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white"
          >
            GitHub
          </a>
          <a
            href="https://kosala.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white"
          >
            Website
          </a>
        </div>
      </div>
      </div>
    </div>
  );
}