import * as THREE from 'three';
import { bleach } from 'three/examples/jsm/tsl/display/BleachBypass.js';

export class Equipment {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private equipmentObjects: THREE.Object3D[] = [];
  private chemicalContents: Map<THREE.Object3D, string[]> = new Map();
  private reactionCallbacks: ((reaction: string) => void)[] = [];
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private selectedObject?: THREE.Object3D;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
  }
public addEquipment(type: string, position: THREE.Vector3) {
  let equipment: THREE.Object3D;

  switch (type) {
    case 'beaker':
      equipment = this.createBeaker();
      break;
    case 'testTube':
      equipment = this.createTestTube();
      break;
    case 'flask':
      equipment = this.createFlask();
      break;
    case 'burner':
      equipment = this.createBurner();
      break;
    default:
      equipment = this.createBeaker();
  }

  equipment.userData = { type };
  equipment.castShadow = true;
  equipment.receiveShadow = true;

  const yOffsets: Record<string, number> = {
    beaker: 1.5,
    testTube: 2.0,
    flask: 2.0,
    burner: 0.5
  };

  const offsetY = yOffsets[type] ?? 1.5; // ✅ Add this line

  equipment.position.copy(position);
  equipment.position.y = 1 + offsetY; // white tabletop Y = 1

  this.scene.add(equipment);
  this.equipmentObjects.push(equipment);
  this.chemicalContents.set(equipment, []);
}



  public onReaction(callback: (reaction: string) => void) {
    this.reactionCallbacks.push(callback);
  }

  private triggerReactionCallback(reaction: string) {
    this.reactionCallbacks.forEach(callback => callback(reaction));
  }

private getGlassMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0,
    transparent: true,
    opacity: 15,              // Lightly transparent
    transmission: 1.0,          // Allow light through like real glass
    ior: 1.45,                  // Refractive index for glass
    thickness: 5.5,
    reflectivity: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0
  });
}




private createBeaker(): THREE.Object3D {
  const group = new THREE.Group();

  const outerGeometry = new THREE.CylinderGeometry(1, 1, 3, 32, 1, true);
  const outerMesh = new THREE.Mesh(outerGeometry, this.getGlassMaterial());
  outerMesh.position.y = 1.5;

  const baseGeometry = new THREE.CircleGeometry(1, 32);
  const baseMesh = new THREE.Mesh(baseGeometry, this.getGlassMaterial());
  baseMesh.rotation.x = -Math.PI / 2;
  baseMesh.position.y = 0;

  group.add(outerMesh, baseMesh);

  // ✅ Add userData for type recognition in addLiquid()
  group.userData.type = 'beaker';

  return group;
}

private createTestTube(): THREE.Object3D {
  const group = new THREE.Group();

  const outerGeometry = new THREE.CylinderGeometry(0.4, 0.4, 4, 32, 1, true);
  const outerMesh = new THREE.Mesh(outerGeometry, this.getGlassMaterial());
  outerMesh.position.y = 2;

  const baseGeometry = new THREE.CircleGeometry(0.4, 32);
  const baseMesh = new THREE.Mesh(baseGeometry, this.getGlassMaterial());
  baseMesh.rotation.x = -Math.PI / 2;
  baseMesh.position.y = 0;

  group.add(outerMesh, baseMesh);

  // ✅ Add userData for type recognition in addLiquid()
  group.userData.type = 'testTube';

  return group;
}

private createFlask(): THREE.Object3D {
  const group = new THREE.Group();

  const baseGeometry = new THREE.SphereGeometry(1.2, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const baseMesh = new THREE.Mesh(baseGeometry, this.getGlassMaterial());
  baseMesh.position.y = 1.2;

  const neckGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 32);
  const neckMesh = new THREE.Mesh(neckGeometry, this.getGlassMaterial());
  neckMesh.position.y = 2.8;

  group.add(baseMesh, neckMesh);

  // ✅ Add userData for type recognition in addLiquid()
  group.userData.type = 'flask';

  return group;
}

  private createBurner(): THREE.Object3D {
    const group = new THREE.Group();
    
    // Burner base
    const baseGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
    const baseMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x333333,
      shininess: 50
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.25;
    group.add(base);

    // Burner stem
    const stemGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 16);
    const stemMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x666666,
      shininess: 30
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 2;
    group.add(stem);

    // Burner head
    const headGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x444444,
      shininess: 40
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 3.65;
    group.add(head);

    // Flame (particle system would be better, but simplified for now)
    const flameGeometry = new THREE.ConeGeometry(0.3, 1.5, 8);
    const flameMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff4444, 
      transparent: true, 
      opacity: 0.8
    });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.y = 4.5;
    
    // Add flame animation
    const animateFlame = () => {
      flame.scale.y = 1 + Math.sin(Date.now() * 0.01) * 0.2;
      flame.scale.x = 1 + Math.cos(Date.now() * 0.015) * 0.1;
      flame.scale.z = 1 + Math.sin(Date.now() * 0.012) * 0.1;
      requestAnimationFrame(animateFlame);
    };
    animateFlame();
    
    group.add(flame);

    return group;
  }

  public addChemicalToEquipment(chemical: string) {
  if (!this.selectedObject) {
    console.warn("No equipment selected to add chemical to.");
    return;
  }

  const equipment = this.selectedObject;

  if (!this.chemicalContents.has(equipment)) {
    this.chemicalContents.set(equipment, []);
  }

  const contents = this.chemicalContents.get(equipment)!;
  contents.push(chemical);

  const level = contents.length; // Fill level based on chemical count

  this.addLiquid(equipment, chemical, level);
}

private addLiquid(equipment: THREE.Object3D | undefined, chemical: string, level: number) {
  if (!equipment) {
    console.warn("addLiquid: equipment is undefined");
    return;
  }

  const colors: { [key: string]: number } = {
    'Water': 0x4A90E2,
    'Hydrochloric Acid': 0xFF6B6B,
    'Sodium Hydroxide': 0x4ECDC4,
    'Phenolphthalein': 0xFF69B4,
    'Copper Sulfate': 0x1E90FF,
    'Iron Chloride': 0xDAA520,
    'Silver Nitrate': 0xC0C0C0,
    'Potassium Permanganate': 0x800080,
    'Methylene Blue': 0x0000FF,
    'Iodine': 0x4B0082
  };

  // Remove old liquid
  const existing = equipment.children.find(c => c.userData?.isLiquid);
  if (existing) equipment.remove(existing);

  const type = equipment.userData?.type;
  if (!type) return;

  let radius = 0.3, height = 0.6, yOffset = 0.4;
  if (type === 'testTube') {
    radius = 0.25; height = level * 0.6; yOffset = 0.3 + height / 2;
  } else if (type === 'beaker') {
    radius = 0.85; height = level * 0.6; yOffset = 0.1 + height / 2;
  } else if (type === 'flask') {
    radius = 1.0; height = level * 0.6; yOffset = 1.05 + height / 2;
  }

  // Get color
  const all = this.chemicalContents.get(equipment) || [];
  let finalColor = colors[chemical] || 0x4A90E2;
  if (all.length > 1) {
    finalColor = this.mixColors(all.map(name => colors[name] || 0x4A90E2));
  }

  // Create liquid mesh (💡 use brighter material)
 const material = new THREE.MeshStandardMaterial({
    color: finalColor,
    emissive: finalColor,
    emissiveIntensity: 0.4,
    metalness: 0.1,
    roughness: 0.2,
    transparent: false
  });

  const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
  const liquid = new THREE.Mesh(geometry, material);
  liquid.position.y = yOffset;
  liquid.userData.isLiquid = true;
  liquid.castShadow = false;
  liquid.receiveShadow = true;

  equipment.add(liquid);
}



  private mixColors(colors: number[]): number {
    if (colors.length === 0) return 0x4A90E2;
    if (colors.length === 1) return colors[0];
    
    // Simple RGB averaging
    let r = 0, g = 0, b = 0;
    colors.forEach(color => {
      r += (color >> 16) & 0xFF;
      g += (color >> 8) & 0xFF;
      b += color & 0xFF;
    });
    
    r = Math.floor(r / colors.length);
    g = Math.floor(g / colors.length);
    b = Math.floor(b / colors.length);
    
    return (r << 16) | (g << 8) | b;
  }

  private checkReactions(equipment: THREE.Object3D, contents: string[]): string | null {
    // Simple reaction system
    if (contents.includes('Hydrochloric Acid') && contents.includes('Sodium Hydroxide')) {
      this.triggerVisualReaction(equipment, 'neutralization');
      return 'Neutralization: HCl + NaOH → NaCl + H₂O + Heat';
    }
    
    if (contents.includes('Phenolphthalein') && contents.includes('Sodium Hydroxide')) {
      this.triggerVisualReaction(equipment, 'indicator');
      return 'Phenolphthalein turns pink in basic solution';
    }
    
    if (contents.includes('Copper Sulfate') && contents.includes('Iron Chloride')) {
      this.triggerVisualReaction(equipment, 'precipitation');
      return 'Precipitation: CuSO₄ + FeCl₃ → Complex formation';
    }
    
    if (contents.includes('Silver Nitrate') && contents.includes('Hydrochloric Acid')) {
      this.triggerVisualReaction(equipment, 'precipitation');
      return 'Precipitation: AgNO₃ + HCl → AgCl↓ + HNO₃';
    }
    
    if (contents.includes('Potassium Permanganate') && contents.includes('Hydrochloric Acid')) {
      this.triggerVisualReaction(equipment, 'gas_evolution');
      return 'Redox: KMnO₄ + HCl → Cl₂↑ + MnCl₂ + H₂O';
    }
    
    if (contents.includes('Methylene Blue') && contents.includes('Sodium Hydroxide')) {
      this.triggerVisualReaction(equipment, 'color_change');
      return 'Color change: Methylene blue decolorization in basic medium';
    }
    
    return null;
  }

  private triggerVisualReaction(equipment: THREE.Object3D, reactionType: string) {
    switch (reactionType) {
      case 'neutralization':
        this.createBubbleEffect(equipment, 0xffffff, 15);
        this.createHeatEffect(equipment);
        break;
      case 'precipitation':
        this.createPrecipitateEffect(equipment);
        break;
      case 'gas_evolution':
        this.createGasEffect(equipment);
        break;
      case 'indicator':
        this.createColorChangeEffect(equipment, 0xFF69B4);
        break;
      case 'color_change':
        this.createColorChangeEffect(equipment, 0x00FF00);
        break;
    }
  }

  private createBubbleEffect(equipment: THREE.Object3D, color: number, count: number) {
    const bubbleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const bubbleMaterial = new THREE.MeshBasicMaterial({ 
      color: color, 
      transparent: true, 
      opacity: 0.5 
    });
    
    for (let i = 0; i < count; i++) {
      const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      bubble.position.set(
        (Math.random() - 0.5) * 1.5,
        Math.random() * 1.5 - 1,
        (Math.random() - 0.5) * 1.5
      );
      equipment.add(bubble);
      
      // Animate bubble rising
      const animateBubble = () => {
        bubble.position.y += 0.03;
        bubble.material.opacity -= 0.015;
        bubble.scale.multiplyScalar(1.01);
        
        if (bubble.material.opacity > 0) {
          requestAnimationFrame(animateBubble);
        } else {
          equipment.remove(bubble);
        }
      };
      
      setTimeout(animateBubble, i * 100);
    }
  }

  private createHeatEffect(equipment: THREE.Object3D) {
    // Create heat shimmer effect
    const heatGeometry = new THREE.PlaneGeometry(2, 3);
    const heatMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.1
    });
    
    const heatEffect = new THREE.Mesh(heatGeometry, heatMaterial);
    heatEffect.position.y = 1;
    equipment.add(heatEffect);
    
    let opacity = 0.1;
    const animateHeat = () => {
      opacity -= 0.002;
      heatEffect.material.opacity = opacity;
      heatEffect.rotation.z += 0.01;
      
      if (opacity > 0) {
        requestAnimationFrame(animateHeat);
      } else {
        equipment.remove(heatEffect);
      }
    };
    
    setTimeout(animateHeat, 500);
  }

  private createPrecipitateEffect(equipment: THREE.Object3D) {
    // Create falling particles for precipitation
    const particleGeometry = new THREE.SphereGeometry(0.05, 6, 6);
    const particleMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xcccccc,
      shininess: 10
    });
    
    for (let i = 0; i < 20; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        (Math.random() - 0.5) * 1.2,
        Math.random() * 2,
        (Math.random() - 0.5) * 1.2
      );
      equipment.add(particle);
      
      const animateParticle = () => {
        particle.position.y -= 0.02;
        
        if (particle.position.y > -2) {
          requestAnimationFrame(animateParticle);
        } else {
          equipment.remove(particle);
        }
      };
      
      setTimeout(animateParticle, i * 50);
    }
  }

  private createGasEffect(equipment: THREE.Object3D) {
    // Create gas bubbles rising rapidly
    this.createBubbleEffect(equipment, 0x00ff00, 25);
    
    // Add gas cloud effect
    const gasGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const gasMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.3
    });
    
    for (let i = 0; i < 5; i++) {
      const gasCloud = new THREE.Mesh(gasGeometry, gasMaterial);
      gasCloud.position.set(
        (Math.random() - 0.5) * 2,
        2 + Math.random(),
        (Math.random() - 0.5) * 2
      );
      equipment.add(gasCloud);
      
      const animateGas = () => {
        gasCloud.position.y += 0.05;
        gasCloud.material.opacity -= 0.01;
        gasCloud.scale.multiplyScalar(1.02);
        
        if (gasCloud.material.opacity > 0) {
          requestAnimationFrame(animateGas);
        } else {
          equipment.remove(gasCloud);
        }
      };
      
      setTimeout(animateGas, i * 200);
    }
  }

  private createColorChangeEffect(equipment: THREE.Object3D, newColor: number) {
    // Find the liquid and change its color gradually
    const liquid = equipment.children.find(child => child.userData.isLiquid) as THREE.Mesh;
    if (liquid && liquid.material) {
      const material = liquid.material as THREE.MeshPhongMaterial;
      const originalColor = material.color.getHex();
      
      let progress = 0;
      const animateColorChange = () => {
        progress += 0.02;
        
        // Interpolate between original and new color
        const r1 = (originalColor >> 16) & 0xFF;
        const g1 = (originalColor >> 8) & 0xFF;
        const b1 = originalColor & 0xFF;
        
        const r2 = (newColor >> 16) & 0xFF;
        const g2 = (newColor >> 8) & 0xFF;
        const b2 = newColor & 0xFF;
        
        const r = Math.floor(r1 + (r2 - r1) * progress);
        const g = Math.floor(g1 + (g2 - g1) * progress);
        const b = Math.floor(b1 + (b2 - b1) * progress);
        
        material.color.setHex((r << 16) | (g << 8) | b);
        
        if (progress < 1) {
          requestAnimationFrame(animateColorChange);
        }
      };
      
      animateColorChange();
    }
  }

  public getInteractableObjects(): THREE.Object3D[] {
    return this.equipmentObjects;
  }

  public update() {
    // Update animations or physics here
  }

  private handleMouseDown = (event: MouseEvent) => {
  // Convert mouse click to normalized device coordinates (-1 to +1)
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  // Cast ray from camera through the mouse position
  this.raycaster.setFromCamera(mouse, this.camera);

  // Get intersected objects from equipment
  const intersects = this.raycaster.intersectObjects(this.getInteractableObjects(), true);

  if (intersects.length > 0) {
    let selected = intersects[0].object;

    // Traverse up to parent group with userData.type (like beaker, flask)
    while (selected.parent && !selected.userData?.type) {
      selected = selected.parent;
    }
    this.selectedObject = selected;

    // Optional: highlight selected object
    selected.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat?.emissive) mat.emissive.setHex(0x4444ff); // Blue glow
      }
    });

    console.log("✅ Selected equipment:", selected.userData?.type);
  }
};

}