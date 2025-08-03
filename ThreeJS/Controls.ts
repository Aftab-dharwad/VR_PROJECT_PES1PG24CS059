import * as THREE from 'three';

export class Controls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private target: THREE.Vector3;
  private spherical: THREE.Spherical;
  private sphericalDelta: THREE.Spherical;
  private scale: number;
  private panOffset: THREE.Vector3;
  private zoomChanged: boolean;
  private rotateStart: THREE.Vector2;
  private rotateEnd: THREE.Vector2;
  private rotateDelta: THREE.Vector2;
  private panStart: THREE.Vector2;
  private panEnd: THREE.Vector2;
  private panDelta: THREE.Vector2;
  private dollyStart: THREE.Vector2;
  private dollyEnd: THREE.Vector2;
  private dollyDelta: THREE.Vector2;

  public enabled: boolean = true;
  public enableDamping: boolean = true;
  public dampingFactor: number = 0.05;
  public enableZoom: boolean = true;
  public zoomSpeed: number = 1.0;
  public enableRotate: boolean = true;
  public rotateSpeed: number = 1.0;
  public enablePan: boolean = true;
  public panSpeed: number = 1.0;
  public minDistance: number = 5;
  public maxDistance: number = 50;
  public minPolarAngle: number = 0;
  public maxPolarAngle: number = Math.PI;

  private state: 'NONE' | 'ROTATE' | 'DOLLY' | 'PAN' = 'NONE';
  private EPS: number = 0.000001;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3();
    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();
    this.scale = 1;
    this.panOffset = new THREE.Vector3();
    this.zoomChanged = false;

    this.rotateStart = new THREE.Vector2();
    this.rotateEnd = new THREE.Vector2();
    this.rotateDelta = new THREE.Vector2();
    this.panStart = new THREE.Vector2();
    this.panEnd = new THREE.Vector2();
    this.panDelta = new THREE.Vector2();
    this.dollyStart = new THREE.Vector2();
    this.dollyEnd = new THREE.Vector2();
    this.dollyDelta = new THREE.Vector2();

    this.setupEventListeners();
    this.update();
  }

  private setupEventListeners() {
    this.domElement.addEventListener('contextmenu', this.onContextMenu.bind(this));
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.addEventListener('wheel', this.onMouseWheel.bind(this));
    this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
    this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this));
  }

  private onContextMenu(event: Event) {
    if (!this.enabled) return;
    event.preventDefault();
  }

  private onMouseDown(event: MouseEvent) {
    if (!this.enabled) return;

    event.preventDefault();

    switch (event.button) {
      case 0: // Left mouse button
        if (this.enableRotate) {
          this.handleMouseDownRotate(event);
          this.state = 'ROTATE';
        }
        break;
      case 1: // Middle mouse button
        if (this.enableZoom) {
          this.handleMouseDownDolly(event);
          this.state = 'DOLLY';
        }
        break;
      case 2: // Right mouse button
        if (this.enablePan) {
          this.handleMouseDownPan(event);
          this.state = 'PAN';
        }
        break;
    }

    if (this.state !== 'NONE') {
      document.addEventListener('mousemove', this.onMouseMove.bind(this));
      document.addEventListener('mouseup', this.onMouseUp.bind(this));
    }
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.enabled) return;

    event.preventDefault();

    switch (this.state) {
      case 'ROTATE':
        if (this.enableRotate) {
          this.handleMouseMoveRotate(event);
        }
        break;
      case 'DOLLY':
        if (this.enableZoom) {
          this.handleMouseMoveDolly(event);
        }
        break;
      case 'PAN':
        if (this.enablePan) {
          this.handleMouseMovePan(event);
        }
        break;
    }
  }

  private onMouseUp() {
    if (!this.enabled) return;

    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));

    this.state = 'NONE';
  }

  private onMouseWheel(event: WheelEvent) {
    if (!this.enabled || !this.enableZoom || this.state !== 'NONE') return;

    event.preventDefault();

    this.handleMouseWheel(event);
  }

  private onTouchStart(event: TouchEvent) {
    if (!this.enabled) return;

    event.preventDefault();

    switch (event.touches.length) {
      case 1: // One finger - rotate
        if (this.enableRotate) {
          this.handleTouchStartRotate(event);
          this.state = 'ROTATE';
        }
        break;
      case 2: // Two fingers - dolly and pan
        if (this.enableZoom && this.enablePan) {
          this.handleTouchStartDollyPan(event);
          this.state = 'DOLLY';
        }
        break;
    }
  }

  private onTouchMove(event: TouchEvent) {
    if (!this.enabled) return;

    event.preventDefault();

    switch (this.state) {
      case 'ROTATE':
        if (this.enableRotate) {
          this.handleTouchMoveRotate(event);
        }
        break;
      case 'DOLLY':
        if (this.enableZoom && this.enablePan) {
          this.handleTouchMoveDollyPan(event);
        }
        break;
    }
  }

  private onTouchEnd() {
    if (!this.enabled) return;
    this.state = 'NONE';
  }

  private handleMouseDownRotate(event: MouseEvent) {
    this.rotateStart.set(event.clientX, event.clientY);
  }

  private handleMouseMoveRotate(event: MouseEvent) {
    this.rotateEnd.set(event.clientX, event.clientY);
    this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);

    const element = this.domElement;
    this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight);
    this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);

    this.rotateStart.copy(this.rotateEnd);
  }

  private handleMouseDownPan(event: MouseEvent) {
    this.panStart.set(event.clientX, event.clientY);
  }

  private handleMouseMovePan(event: MouseEvent) {
    this.panEnd.set(event.clientX, event.clientY);
    this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);

    this.pan(this.panDelta.x, this.panDelta.y);
    this.panStart.copy(this.panEnd);
  }

  private handleMouseDownDolly(event: MouseEvent) {
    this.dollyStart.set(event.clientX, event.clientY);
  }

  private handleMouseMoveDolly(event: MouseEvent) {
    this.dollyEnd.set(event.clientX, event.clientY);
    this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

    if (this.dollyDelta.y > 0) {
      this.dollyOut(this.getZoomScale());
    } else if (this.dollyDelta.y < 0) {
      this.dollyIn(this.getZoomScale());
    }

    this.dollyStart.copy(this.dollyEnd);
  }

  private handleMouseWheel(event: WheelEvent) {
    if (event.deltaY < 0) {
      this.dollyIn(this.getZoomScale());
    } else if (event.deltaY > 0) {
      this.dollyOut(this.getZoomScale());
    }
  }

  private handleTouchStartRotate(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
    }
  }

  private handleTouchMoveRotate(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
      this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);

      const element = this.domElement;
      this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight);
      this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);

      this.rotateStart.copy(this.rotateEnd);
    }
  }

  private handleTouchStartDollyPan(event: TouchEvent) {
    if (this.enableZoom) {
      const dx = event.touches[0].pageX - event.touches[1].pageX;
      const dy = event.touches[0].pageY - event.touches[1].pageY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      this.dollyStart.set(0, distance);
    }

    if (this.enablePan) {
      const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
      const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
      this.panStart.set(x, y);
    }
  }

  private handleTouchMoveDollyPan(event: TouchEvent) {
    if (this.enableZoom) {
      const dx = event.touches[0].pageX - event.touches[1].pageX;
      const dy = event.touches[0].pageY - event.touches[1].pageY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      this.dollyEnd.set(0, distance);
      this.dollyDelta.set(0, Math.pow(this.dollyEnd.y / this.dollyStart.y, this.zoomSpeed));
      this.dollyOut(this.dollyDelta.y);
      this.dollyStart.copy(this.dollyEnd);
    }

    if (this.enablePan) {
      const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
      const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
      this.panEnd.set(x, y);
      this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);
      this.pan(this.panDelta.x, this.panDelta.y);
      this.panStart.copy(this.panEnd);
    }
  }

  private rotateLeft(angle: number) {
    this.sphericalDelta.theta -= angle;
  }

  private rotateUp(angle: number) {
    this.sphericalDelta.phi -= angle;
  }

  private pan(deltaX: number, deltaY: number) {
    const offset = new THREE.Vector3();
    const position = this.camera.position;

    offset.copy(position).sub(this.target);
    let targetDistance = offset.length();
    targetDistance *= Math.tan((this.camera.fov / 2) * Math.PI / 180.0);

    this.panLeft(2 * deltaX * targetDistance / this.domElement.clientHeight, this.camera.matrix);
    this.panUp(2 * deltaY * targetDistance / this.domElement.clientHeight, this.camera.matrix);
  }

  private panLeft(distance: number, objectMatrix: THREE.Matrix4) {
    const v = new THREE.Vector3();
    v.setFromMatrixColumn(objectMatrix, 0);
    v.multiplyScalar(-distance);
    this.panOffset.add(v);
  }

  private panUp(distance: number, objectMatrix: THREE.Matrix4) {
    const v = new THREE.Vector3();
    v.setFromMatrixColumn(objectMatrix, 1);
    v.multiplyScalar(distance);
    this.panOffset.add(v);
  }

  private dollyIn(dollyScale: number) {
    this.scale /= dollyScale;
  }

  private dollyOut(dollyScale: number) {
    this.scale *= dollyScale;
  }

  private getZoomScale() {
    return Math.pow(0.95, this.zoomSpeed);
  }

  public update(): boolean {
    const offset = new THREE.Vector3();
    const quat = new THREE.Quaternion().setFromUnitVectors(this.camera.up, new THREE.Vector3(0, 1, 0));
    const quatInverse = quat.clone().invert();

    const lastPosition = new THREE.Vector3();
    const lastQuaternion = new THREE.Quaternion();

    const twoPI = 2 * Math.PI;

    return (() => {
      const position = this.camera.position;

      offset.copy(position).sub(this.target);
      offset.applyQuaternion(quat);
      this.spherical.setFromVector3(offset);

      if (this.enableDamping) {
        this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
        this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
      } else {
        this.spherical.theta += this.sphericalDelta.theta;
        this.spherical.phi += this.sphericalDelta.phi;
      }

      this.spherical.theta = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.theta));
      this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
      this.spherical.makeSafe();

      this.spherical.radius *= this.scale;
      this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));

      if (this.enableDamping) {
        this.target.addScaledVector(this.panOffset, this.dampingFactor);
      } else {
        this.target.add(this.panOffset);
      }

      offset.setFromSpherical(this.spherical);
      offset.applyQuaternion(quatInverse);

      position.copy(this.target).add(offset);
      this.camera.lookAt(this.target);

      if (this.enableDamping) {
        this.sphericalDelta.theta *= (1 - this.dampingFactor);
        this.sphericalDelta.phi *= (1 - this.dampingFactor);
        this.panOffset.multiplyScalar(1 - this.dampingFactor);
      } else {
        this.sphericalDelta.set(0, 0, 0);
        this.panOffset.set(0, 0, 0);
      }

      this.scale = 1;

      if (this.zoomChanged ||
          lastPosition.distanceToSquared(this.camera.position) > this.EPS ||
          8 * (1 - lastQuaternion.dot(this.camera.quaternion)) > this.EPS) {
        
        lastPosition.copy(this.camera.position);
        lastQuaternion.copy(this.camera.quaternion);
        this.zoomChanged = false;

        return true;
      }

      return false;
    })();
  }

  public dispose() {
    this.domElement.removeEventListener('contextmenu', this.onContextMenu.bind(this));
    this.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.removeEventListener('wheel', this.onMouseWheel.bind(this));
    this.domElement.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.domElement.removeEventListener('touchend', this.onTouchEnd.bind(this));
    this.domElement.removeEventListener('touchmove', this.onTouchMove.bind(this));
  }
}