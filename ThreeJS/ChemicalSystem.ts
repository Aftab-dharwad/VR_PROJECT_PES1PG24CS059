export interface Chemical {
  name: string;
  formula: string;
  color: string;
  state: 'solid' | 'liquid' | 'gas';
  ph: number;
  reactivity: string[];
}

export class ChemicalSystem {
  private chemicals: Map<string, Chemical> = new Map();
  private reactions: Map<string, string> = new Map();

  constructor() {
    this.initializeChemicals();
    this.initializeReactions();
  }

  private initializeChemicals() {
    const chemicalData: Chemical[] = [
      {
        name: 'Water',
        formula: 'H₂O',
        color: '#4A90E2',
        state: 'liquid',
        ph: 7,
        reactivity: ['universal_solvent']
      },
      {
        name: 'Hydrochloric Acid',
        formula: 'HCl',
        color: '#FF6B6B',
        state: 'liquid',
        ph: 1,
        reactivity: ['acid', 'corrosive']
      },
      {
        name: 'Sodium Hydroxide',
        formula: 'NaOH',
        color: '#4ECDC4',
        state: 'liquid',
        ph: 14,
        reactivity: ['base', 'corrosive']
      },
      {
        name: 'Phenolphthalein',
        formula: 'C₂₀H₁₄O₄',
        color: '#FF69B4',
        state: 'liquid',
        ph: 7,
        reactivity: ['indicator']
      },
      {
        name: 'Copper Sulfate',
        formula: 'CuSO₄',
        color: '#1E90FF',
        state: 'solid',
        ph: 4,
        reactivity: ['salt', 'crystalline']
      },
      {
        name: 'Iron Chloride',
        formula: 'FeCl₃',
        color: '#DAA520',
        state: 'solid',
        ph: 2,
        reactivity: ['salt', 'oxidizing']
      }
    ];

    chemicalData.forEach(chemical => {
      this.chemicals.set(chemical.name, chemical);
    });
  }

  private initializeReactions() {
    // Define reaction combinations and their results
    this.reactions.set('Hydrochloric Acid + Sodium Hydroxide', 'Neutralization: HCl + NaOH → NaCl + H₂O + Heat');
    this.reactions.set('Phenolphthalein + Sodium Hydroxide', 'Indicator reaction: Solution turns pink');
    this.reactions.set('Copper Sulfate + Iron Chloride', 'Double displacement: CuSO₄ + FeCl₃ → Complex formation');
    this.reactions.set('Water + Copper Sulfate', 'Dissolution: CuSO₄ dissolves forming blue solution');
    this.reactions.set('Water + Iron Chloride', 'Dissolution: FeCl₃ dissolves forming yellow-brown solution');
  }

  public getChemical(name: string): Chemical | undefined {
    return this.chemicals.get(name);
  }

  public checkReaction(chemicals: string[]): string | null {
    // Sort chemicals to create consistent reaction keys
    const sortedChemicals = chemicals.sort();
    
    // Check for two-chemical reactions
    if (sortedChemicals.length >= 2) {
      for (let i = 0; i < sortedChemicals.length - 1; i++) {
        for (let j = i + 1; j < sortedChemicals.length; j++) {
          const reactionKey = `${sortedChemicals[i]} + ${sortedChemicals[j]}`;
          const reverseKey = `${sortedChemicals[j]} + ${sortedChemicals[i]}`;
          
          if (this.reactions.has(reactionKey)) {
            return this.reactions.get(reactionKey)!;
          }
          if (this.reactions.has(reverseKey)) {
            return this.reactions.get(reverseKey)!;
          }
        }
      }
    }

    return null;
  }

  public getAllChemicals(): Chemical[] {
    return Array.from(this.chemicals.values());
  }

  public getReactionColor(chemicals: string[]): string {
    // Return mixed color based on chemical combination
    const colors = chemicals.map(name => {
      const chemical = this.chemicals.get(name);
      return chemical ? chemical.color : '#FFFFFF';
    });

    // Simple color mixing (in practice, you'd want more sophisticated color mixing)
    if (colors.length === 0) return '#FFFFFF';
    if (colors.length === 1) return colors[0];
    
    // For now, return the last added chemical's color
    return colors[colors.length - 1];
  }
}