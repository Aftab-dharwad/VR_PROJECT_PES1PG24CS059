import * as THREE from "three";
import { Equipment } from "./Equipment";
import { ChemicalSystem } from "./ChemicalSystem";
import { Controls } from "./Controls";

import wallTextureImg from "../assets/wall.jpeg";
import floorTextureImg from "../assets/floor.jpg";
import ceilingTextureImg from "../assets/ceiling.jpeg";

export class LabScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: Controls;
  private equipment: Equipment;
  private chemicalSystem: ChemicalSystem;
  private animationId: number | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedChemical: string | null = null;
  private isDragging = false;
  private dragObject: THREE.Object3D | null = null;
  private dragOffset: THREE.Vector3 = new THREE.Vector3();

  public onReaction: ((reaction: string) => void) | null = null;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupRenderer(container);
    this.setupLighting();
    this.setupEnvironment();

    this.controls = new Controls(this.camera, this.renderer.domElement);
    this.equipment = new Equipment(this.scene);
    this.chemicalSystem = new ChemicalSystem();

    this.setupEventListeners(container);
    this.animate();
  }

  private setupRenderer(container: HTMLElement) {
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x1a1a2e);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.6;

    container.appendChild(this.renderer.domElement);
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(0, 15, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    this.scene.add(mainLight);

    const ceilingLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    ceilingLight1.position.set(-10, 12, 0);
    this.scene.add(ceilingLight1);

    const ceilingLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    ceilingLight2.position.set(10, 12, 0);
    this.scene.add(ceilingLight2);

    const accent1 = new THREE.SpotLight(0x4a90e2, 0.8);
    accent1.position.set(-8, 10, 8);
    accent1.angle = Math.PI / 4;
    accent1.penumbra = 0.1;
    accent1.castShadow = true;
    this.scene.add(accent1);

    const accent2 = new THREE.SpotLight(0x50c878, 0.6);
    accent2.position.set(8, 10, -8);
    accent2.angle = Math.PI / 4;
    accent2.penumbra = 0.1;
    accent2.castShadow = true;
    this.scene.add(accent2);

    const taskLight = new THREE.SpotLight(0xffffff, 1.2);
    taskLight.position.set(0, 8, 3);
    taskLight.angle = Math.PI / 3;
    taskLight.penumbra = 0.2;
    taskLight.castShadow = true;
    this.scene.add(taskLight);

    const upwardLight = new THREE.DirectionalLight(0xffffff, 0.5); // Soft upward light
    upwardLight.position.set(0, 5, 0); // Lower position
    upwardLight.target.position.set(0, 20, 0); // Aiming toward ceiling
    this.scene.add(upwardLight);
    this.scene.add(upwardLight.target);
  }
  private setupEnvironment() {
    const textureLoader = new THREE.TextureLoader();
    const wallTexture = textureLoader.load(wallTextureImg);
    const floorTexture = textureLoader.load(floorTextureImg);
    const ceilingTexture = textureLoader.load(ceilingTextureImg);

    // Texture tiling/repeat settings
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(2, 2);

    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);

    ceilingTexture.wrapS = ceilingTexture.wrapT = THREE.RepeatWrapping;
    ceilingTexture.repeat.set(4, 4);

    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -4;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Walls
    const wallGeometry = new THREE.PlaneGeometry(50, 30);
    const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture });

    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, 8, -10);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    const sideWall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    sideWall1.rotation.y = Math.PI / 2;
    sideWall1.position.set(-25, 8, 0);
    sideWall1.receiveShadow = true;
    this.scene.add(sideWall1);

    const sideWall2 = new THREE.Mesh(wallGeometry, wallMaterial);
    sideWall2.rotation.y = -Math.PI / 2;
    sideWall2.position.set(25, 8, 0);
    sideWall2.receiveShadow = true;
    this.scene.add(sideWall2);

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(50, 50);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      map: ceilingTexture,
      side: THREE.DoubleSide,
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = -Math.PI / 2;
    ceiling.position.y = 20;
    ceiling.receiveShadow = false;
    this.scene.add(ceiling);

    // Camera
    this.camera.position.set(0, 5, 15);
    this.camera.lookAt(0, 0, 0);
    this.createLabTable();
  }

  private createLabTable() {
  const tableGroup = new THREE.Group();

  // === TABLETOP ===
  const tabletop = new THREE.Mesh(
    new THREE.BoxGeometry(30, 1, 12), // wider and longer
    new THREE.MeshStandardMaterial({ color: 0x000000 }) // black
  );
  tabletop.position.set(0, 5.5, 0); // ~5.5 is good height for large scene
  tabletop.castShadow = true;
  tabletop.receiveShadow = true;
  tableGroup.add(tabletop);

  // === SHELF ===
  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(28, 0.6, 10), // slightly smaller than top
    new THREE.MeshStandardMaterial({ color: 0xffffff }) // white
  );
  shelf.position.set(0, 3.5, 0); // below the top
  shelf.castShadow = true;
  tableGroup.add(shelf);

  // === LEGS ===
  const legGeometry = new THREE.BoxGeometry(0.8, 4, 0.8); // 4 units tall
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });

  const legOffsets = [
    [-14, 2, -5], [14, 2, -5], // front
    [-14, 2, 5],  [14, 2, 5],  // back
  ];

  for (const [x, y, z] of legOffsets) {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    leg.receiveShadow = true;
    tableGroup.add(leg);
  }

  // === FINAL POSITION ===
  tableGroup.position.y = -4; // sits flat on floor
  this.scene.add(tableGroup);
}



  private setupEventListeners(container: HTMLElement) {
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.isDragging && this.dragObject) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects([
          this.getBenchObject(),
        ]);
        if (intersects.length > 0) {
          const point = intersects[0].point;
          this.dragObject.position.copy(point.add(this.dragOffset));
        }
      }
    };

const handleMouseDown = (event: MouseEvent) => {
  if (event.button === 0) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.equipment.getInteractableObjects(),
      true
    );

    if (intersects.length > 0) {
      const object = intersects[0].object;

      // Traverse up to group with userData.type
      let parent = object;
      while (parent && !parent.userData?.type) {
        parent = parent.parent;
      }

      if (!parent) return;

      if (this.selectedChemical) {
        const reaction = this.equipment.addChemicalToEquipment(parent, this.selectedChemical);
        this.logReaction(
          `Added ${this.selectedChemical} to ${parent.userData.type || "equipment"}`
        );
        if (reaction) {
          this.logReaction(`REACTION: ${reaction}`);
        }
      } else {
        // Select the equipment for future chemical use
        this.equipment.selectedObject = parent;
        this.logReaction(`Selected ${parent.userData.type}`);
        this.isDragging = true;
        this.dragObject = parent;
        this.dragOffset.copy(parent.position).sub(intersects[0].point);
        this.controls.enabled = false;
      }
    }
  }
};

    const handleMouseUp = () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.dragObject = null;
        this.controls.enabled = true;
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mouseup", handleMouseUp);

    window.addEventListener("resize", () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });
  }

  private getBenchObject(): THREE.Object3D {
    const benchGeometry = new THREE.PlaneGeometry(20, 8);
    const benchMesh = new THREE.Mesh(benchGeometry);
    benchMesh.position.set(0, -1.75, 0);
    benchMesh.rotation.x = -Math.PI / 2;
    return benchMesh;
  }

  private logReaction(message: string) {
    if (this.onReaction) {
      this.onReaction(message);
    }
  }

  public selectChemical(chemical: string) {
    this.selectedChemical = chemical;
  }

  public addEquipment(type: string) {
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      0,
      (Math.random() - 0.5) * 6
    );

    this.equipment.addEquipment(type, position);
    this.logReaction(`Added ${type} to lab bench`);
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.equipment.update();
    this.renderer.render(this.scene, this.camera);
  };

  public dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this.controls.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
