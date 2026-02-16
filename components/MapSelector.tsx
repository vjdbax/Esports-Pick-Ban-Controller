import React from 'react';
import { MapData } from '../types';

interface MapSelectorProps {
  isOpen: boolean;
  maps: MapData[];
  onSelect: (map: MapData) => void;
  onClose: () => void;
  usedMapNames: string[];
}

export const MapSelector: React.FC<MapSelectorProps> = ({ isOpen, maps, onSelect, onClose, usedMapNames }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-950 rounded-t-lg">
          <h2 className="text-xl font-bold text-white">Select Map</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white px-3 py-1 rounded hover:bg-gray-800">
            Close
          </button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {maps.map((map) => {
            const isUsed = usedMapNames.includes(map.name);
            return (
              <div 
                key={map.name}
                onClick={() => !isUsed && onSelect(map)}
                className={`
                  relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all aspect-video
                  ${isUsed 
                    ? 'border-gray-800 opacity-40 grayscale cursor-not-allowed' 
                    : 'border-gray-700 hover:border-blue-500 hover:scale-105 hover:z-10 bg-gray-800'}
                `}
              >
                <img src={map.imageFile} alt={map.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end justify-center p-2">
                  <span className="text-white font-bold text-sm text-center truncate w-full">{map.name}</span>
                </div>
                {isUsed && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-red-500 font-bold border-2 border-red-500 px-2 py-1 rounded rotate-[-12deg]">USED</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};