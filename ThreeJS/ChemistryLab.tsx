import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { LabScene } from '../lab/LabScene';
import { Equipment } from '../lab/Equipment';
import { ChemicalSystem } from '../lab/ChemicalSystem';
import { Controls } from '../lab/Controls';
import { FlaskRound as Flask, TestTube, Flame, Beaker, Atom } from 'lucide-react';

const ChemistryLab: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChemical, setSelectedChemical] = useState<string | null>(null);
  const [reactionLog, setReactionLog] = useState<string[]>([]);
  const [labScene, setLabScene] = useState<LabScene | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize lab scene
    const scene = new LabScene(mountRef.current);
    setLabScene(scene);

    // Add reaction log handler
    scene.onReaction = (reaction: string) => {
      setReactionLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${reaction}`]);
    };

    // Setup complete
    setIsLoading(false);

    return () => {
      scene.dispose();
    };
  }, []);

  const handleChemicalSelect = (chemical: string) => {
    setSelectedChemical(chemical);
    if (labScene) {
      labScene.selectChemical(chemical);
    }
  };

  const handleEquipmentAdd = (equipmentType: string) => {
    if (labScene) {
      labScene.addEquipment(equipmentType);
    }
  };

  const clearReactionLog = () => {
    setReactionLog([]);
  };

  const chemicals = [
    { name: 'Water', color: '#4A90E2', symbol: 'H₂O' },
    { name: 'Hydrochloric Acid', color: '#FF6B6B', symbol: 'HCl' },
    { name: 'Sodium Hydroxide', color: '#4ECDC4', symbol: 'NaOH' },
    { name: 'Phenolphthalein', color: '#FF69B4', symbol: 'Indicator' },
    { name: 'Copper Sulfate', color: '#1E90FF', symbol: 'CuSO₄' },
    { name: 'Iron Chloride', color: '#DAA520', symbol: 'FeCl₃' },
    { name: 'Silver Nitrate', color: '#C0C0C0', symbol: 'AgNO₃' },
    { name: 'Potassium Permanganate', color: '#800080', symbol: 'KMnO₄' },
    { name: 'Methylene Blue', color: '#0000FF', symbol: 'MB' },
    { name: 'Iodine', color: '#4B0082', symbol: 'I₂' },
  ];

  const equipment = [
    { name: 'Beaker', icon: Beaker, type: 'beaker' },
    { name: 'Test Tube', icon: TestTube, type: 'testTube' },
    { name: 'Erlenmeyer Flask', icon: Flask, type: 'flask' },
    { name: 'Bunsen Burner', icon: Flame, type: 'burner' },
  ];

  return (
    <div className="relative w-full h-screen">
      {isLoading && (
        <div className="loading">
          <div className="flex items-center space-x-2">
            <Atom className="animate-spin" size={24} />
            <span>Loading Chemistry Lab...</span>
          </div>
        </div>
      )}
      
      <div ref={mountRef} className="w-full h-full" />
      
      {!isLoading && (
        <div className="ui-overlay">
          {/* Chemical Selection Panel */}
          <div className="absolute top-4 left-4 ui-panel">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Atom className="mr-2" size={20} />
              Chemical Inventory
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {chemicals.map((chemical) => (
                <button
                  key={chemical.name}
                  className={`chemical-button ${selectedChemical === chemical.name ? 'ring-2 ring-white' : ''}`}
                  onClick={() => handleChemicalSelect(chemical.name)}
                  style={{ background: `linear-gradient(135deg, ${chemical.color} 0%, ${chemical.color}AA 100%)` }}
                >
                  <div className="text-xs">{chemical.symbol}</div>
                  <div className="text-xs font-normal">{chemical.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Panel */}
          <div className="absolute top-4 right-4 ui-panel">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Flask className="mr-2" size={20} />
              Laboratory Equipment
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {equipment.map((item) => (
                <button
                  key={item.name}
                  className="equipment-button"
                  onClick={() => handleEquipmentAdd(item.type)}
                >
                  <item.icon size={16} className="mb-1" />
                  <div className="text-xs">{item.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Reaction Log Panel */}
          <div className="absolute bottom-4 left-4 ui-panel" style={{ maxWidth: '350px' }}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold">Reaction Log</h3>
              <button
                className="text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                onClick={clearReactionLog}
              >
                Clear
              </button>
            </div>
            <div className="reaction-log">
              {reactionLog.length === 0 ? (
                <p>No reactions logged yet...</p>
              ) : (
                reactionLog.map((log, index) => (
                  <div key={index}>{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChemistryLab;