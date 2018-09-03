import React from 'react';
import * as THREE from 'three';
import './Cube.scss'
import connect from "react-redux/es/connect/connect";
import OrbitControls from "../../../webgl/three/controls/OrbitControls";


const DEVELOPMENT = process.env.NODE_ENV === 'development';
const VR_BG_COLOR = 0x000000;

class Cube extends React.Component {
  constructor(props) {
    super(props);

    this.draw = this.draw.bind(this);
    this.onResize = this.onResize.bind(this);

    this.orbitControls = null;
  }

  componentDidMount() {
    this.initThree();


    window.addEventListener('resize', this.onResize, true);
    this.onResize();
  }


  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize, true);
  }


  initThree() {
    const options = {canvas: this.canvas, antialias: true};
    this.renderer = new THREE.WebGLRenderer(options);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);


    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(VR_BG_COLOR);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

    this.camera.position.set(0, 0, 0);
    // this.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
    this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI / 2;

    let geometry = new THREE.BoxGeometry(1, 1, 1);
    let material = new THREE.MeshNormalMaterial();
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.position.z = 0;
    this.scene.add(this.cube);


    requestAnimationFrame(this.draw);
  }

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }


  initOrbitControls() {
    this.orbitControls = new OrbitControls(this.camera, this.canvas);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.25;
    this.orbitControls.enableZoom = true;
    // this.orbitControls.autoRotate = true;
    // this.orbitControls.enableZoom = false;
    // this.orbitControls.enablePan = false;
    // this.orbitControls.target.set(0, 0, 0);
    // this.orbitControls.rotateUp(-HALF_PI);
    // this.orbitControls.update();
    // this.orbitControls.enabled = true;

    console.log(this.orbitControls)
  }

  update() {
    // this.cube.rotation.x += .03;
    // this.cube.rotation.y += .03;

    this.orbitControls.update();
  }


  draw() {

    // this.update();

    this.controls.update();

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.draw);
  }


  render() {
    return (
      <div className={'canvas-wrapper'} id={'canvas-wrapper'}>
        <canvas ref={ref => this.canvas = ref}/>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    width: state.ui.width,
    height: state.ui.height,
  };
}

export default connect(mapStateToProps, {})(Cube);

