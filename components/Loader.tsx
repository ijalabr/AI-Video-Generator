
import React, { useState, useEffect } from 'react';
import { LOADING_MESSAGES } from '../constants';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = "Processing..." }) => {
  const [dynamicMessage, setDynamicMessage] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDynamicMessage(prevMessage => {
        const currentIndex = LOADING_MESSAGES.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
        return LOADING_MESSAGES[nextIndex];
      });
    }, 2500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-lg">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
      <h2 className="text-xl font-semibold text-white mt-6">{message}</h2>
      <p className="text-slate-300 mt-2 text-center transition-opacity duration-500">{dynamicMessage}</p>
    </div>
  );
};

export default Loader;
