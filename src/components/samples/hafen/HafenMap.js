import React from 'react';
import connect from "react-redux/es/connect/connect";
import 'gsap/TweenMax';
import CloseIcon from 'core/icons/close.inline.svg';
import map from 'components/samples/hafen/images/map.png';
import vesselTrackerRange from 'components/samples/hafen/images/VesselTrackerRange.png';
import * as PIXI from 'pixi.js'

import '../Scene.scss'
import VesselTrackerConnector from "./VesselTrackerConnector";


const DEVELOPMENT = process.env.NODE_ENV === 'development';

class HafenMap extends React.Component {
  constructor(props) {
    super(props);

    this.draw = this.draw.bind(this);
    this.onResize = this.onResize.bind(this);
    this.loadReady = this.loadReady.bind(this);

    this.GeoBounds = {
      minLong: 9.7538,
      maxLong: 10.0948,
      minLat: 53.5743,
      maxLat: 53.4605
    };

    this.mapData = {
      size: {
        width: 1920,
        height: 1077
      }
    }

    this.timerData = {
      timeStep: 60
    }

  }

  componentDidMount() {

    this.vtc = new VesselTrackerConnector(this);

    this.initialLoad();
    // requestAnimationFrame(this.draw);

    window.addEventListener('resize', this.onResize, true);
    this.onResize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize, true);
  }

  show() {
    TweenMax.to(this.canvasWrapper, .5, {delay: .25, opacity: 1, ease: Cubic.easeIn});
  }


  initialLoad() {
    PIXI.loader.add(vesselTrackerRange).load(this.loadReady);
  }

  initStage() {
    this.app = new PIXI.Application({
        width: this.mapData.size.width,
        height: this.mapData.size.height,
        antialias: true,    // default: false
        transparent: false, // default: false
        resolution: 1       // default: 1
      }
    );

    this.app.view.id = 'pixi-app-view';
    this.canvasWrapper.appendChild(this.app.view);

  }

  loadReady() {
    this.initStage();

    let sprite = new PIXI.Sprite(PIXI.loader.resources[vesselTrackerRange].texture);
    this.app.stage.addChild(sprite);

    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    // let pos = this.getXY(53.544448333333335, 9.985446666666666);
    // point.x = pos[0];
    // point.y = pos[1];


    this.show();

    this.vtc.load();

    this.startTimer();

  }


  startTimer() {
    TweenMax.delayedCall(this.timerData.timeStep, this.stepTimer, null, this);
  }

  stepTimer() {
    console.log('vtc-reqest');
    this.vtc.load();
    this.startTimer();
  }

  getColorByStatus(status) {
    let color = 0x000000;
    switch (status) {
      case 'moored':
        color = 0xff0000;
        break;
      case 'waiting':
        color = 0x0000ff;
        break;
      case 'moving':
        color = 0x00ff00;
        break;
    }
    return color;
  }

  plotVessel(vesselData) {

    let vessel = new PIXI.Graphics();
    vessel.beginFill(this.getColorByStatus(vesselData.status));
    // point.drawCircle(0, 0, 3);
    vessel.drawPolygon([0, -5, 4, 5, -4, 5]);
    vessel.endFill();
    let pos = this.getXY(vesselData.aisPosition.lat, vesselData.aisPosition.lon);
    vessel.x = pos[0];
    vessel.y = pos[1];
    vessel.rotation = vesselData.aisPosition.cog * 0.0174533; // rad to deg

    this.container.addChild(vessel);
  }

  onUpdateTrackerData(vesselPool) {

    this.container.removeChildren(0, this.container.children.length);

    for (let i = 0; i < vesselPool.length; i++) {
      this.plotVessel(vesselPool[i]);
    }

  }

  getXY(lat, long) {
    return [
      (long - this.GeoBounds.minLong) / (this.GeoBounds.maxLong - this.GeoBounds.minLong) * this.mapData.size.width,
      (lat - this.GeoBounds.minLat) / (this.GeoBounds.maxLat - this.GeoBounds.minLat) * this.mapData.size.height
    ];
  }


  onResize() {
  }


  update() {

  }


  draw() {

    requestAnimationFrame(this.draw);

    this.update();
  }


  render() {
    return (
      <div>
        <div className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}></div>
        <a href={'/'}>
          <CloseIcon fill={'#000000'} className="close-icon"/>
        </a>
      </div>

    );
  }
}

function mapStateToProps(state) {
  return {};
}

export default connect(mapStateToProps, {})(HafenMap);

