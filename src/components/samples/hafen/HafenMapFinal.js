import React from 'react';
import connect from "react-redux/es/connect/connect";
import {Button} from 'reactstrap';
import 'gsap/TweenMax';
import CloseIcon from 'core/icons/close.inline.svg';
// import mapImage from 'components/samples/hafen/images/FinalMap.png';
import mapImage from 'components/samples/hafen/images/FinalMapReferenz.jpg';
import * as PIXI from 'pixi.js'

import '../Scene.scss'
import 'bootstrap/dist/css/bootstrap.css';
import VTRecorderFinal from "./VTRecorderFinal";
import VTRecorderFinalUtils from "./utils/final/VTRecorderFinalUtils";

// Nutzername: jwu
// Passwort: 9j583t
//
// https://newapi.vesseltracker.com/api/v1/api-docs/index.html#/AISData/get_vessels_userpolygon


const DEVELOPMENT = process.env.NODE_ENV === 'development';

class HafenMapFinal extends React.Component {
  constructor(props) {
    super(props);

    this.loadReady = this.loadReady.bind(this);
    this.onSaveData = this.onSaveData.bind(this);
    this.onStartRecord = this.onStartRecord.bind(this);
    this.onStopRecord = this.onStopRecord.bind(this);

    this.strokeParams = {
      strokeLength: 100,
      colors: ['#5ef559', '#f15119']
    };

    this.state = {
      vesselPoolSize: 0,
      vesselsPassedRange: 0,
      vesselsInMapRange: 0,
      movingVessels: 0,
      staticVessels: 0,
      movedVessels: 0,
      currentStep: 0
    };

  }

  onStartRecord() {
    this.vtc.startRecord();
  }

  onStopRecord() {
    this.vtc.stopRecord();
  }

  onSaveRawData() {
    this.vtc.saveData(true);
  }

  onSaveData() {
    this.vtc.saveData();
  }

  componentDidMount() {

    this.vtc = new VTRecorderFinal(this);

    this.initialLoad();

  }

  componentWillUnmount() {
  }

  initialLoad() {
    PIXI.loader.add(mapImage).load(this.loadReady);
  }

  loadReady() {
    this.initStage();

    let sprite = new PIXI.Sprite(PIXI.loader.resources[mapImage].texture);
    this.app.stage.addChild(sprite);

    this.collisionLayer = new PIXI.Container();
    this.pathGraphics = new PIXI.Container();
    this.pointGraphics = new PIXI.Container();
    this.vesselGraphics = new PIXI.Container();

    this.app.stage.addChild(this.collisionLayer);
    this.app.stage.addChild(this.pathGraphics);
    this.app.stage.addChild(this.pointGraphics);
    this.app.stage.addChild(this.vesselGraphics);

    this.plotMapRange();

    for (let i = 0; i < VTRecorderFinalUtils.collisionBounds.length; i++) {
      this.plotCollisionBounds(VTRecorderFinalUtils.collisionBounds[i], this.collisionLayer);
    }

    this.show();
  }

  show() {
    TweenMax.to(this.canvasWrapper, .5, {delay: .25, opacity: 1, ease: Cubic.easeIn});
  }


  initStage() {
    this.app = new PIXI.Application({
        width: VTRecorderFinalUtils.mapData.size.width,
        height: VTRecorderFinalUtils.mapData.size.height,
        antialias: true,    // default: false
        transparent: false, // default: false
        resolution: 1       // default: 1
      }
    );

    this.app.view.id = 'pixi-app-view';
    this.canvasWrapper.appendChild(this.app.view);

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
      case 'static':
        color = 0xf3b611;
        break;
      case 'lost':
        color = 0x2ad2f6;
        break;
      case 'fastest':
        color = 0xf311f0;
        break;
      case 'longest':
        color = 0xe6f311;
        break;
    }
    return color;
  }


  plotStaticVessel(vesselData, infoTrack) {
    this.plotVessel(vesselData, infoTrack)
  }


  plotVesselPath(pathArray, vesselData) {

    // console.log(pathArray, vesselData)

    let path = new PIXI.Graphics();
    this.pathGraphics.addChild(path);

    let points = new PIXI.Graphics();
    this.pointGraphics.addChild(points);

    for (let i = 0; i < pathArray.length; i++) {
      if (i == 0) {
        const pos = VTRecorderFinalUtils.cartesianFromLatLong(pathArray[0].lat, pathArray[0].lon);
        path.moveTo(pos[0], pos[1]);
      } else {
        const pos = VTRecorderFinalUtils.cartesianFromLatLong(pathArray[i].lat, pathArray[i].lon);
        path.lineStyle(1, 0x47f62a, vesselData.inMapRange ? 1 : .25);
        path.lineTo(pos[0], pos[1]);
      }
    }

    for (let j = 0; j < pathArray.length - 1; j++) {
      const pos = VTRecorderFinalUtils.cartesianFromLatLong(pathArray[j].lat, pathArray[j].lon);
      points.beginFill(0x125e0a, vesselData.inMapRange ? 1 : .25);
      points.drawCircle(pos[0], pos[1], 1);
      points.endFill();
    }


  }

  plotVessel(vesselData, infoTrack) {

    if (this.vtc.timerData.currentStep > 0) {
      if (!vesselData.valid) return;
    }

    let vessel = new PIXI.Graphics();
    this.vesselGraphics.addChild(vessel);

    vessel.mmsi = vesselData['mmsi'];
    vessel.interactive = true;
    vessel.cursor = 'pointer';
    vessel.on('click', (event) => {
      let vesselData = this.vtc.getVesselByMMSI(event.target.mmsi);
      console.log(event.target.mmsi, vesselData)
    });

    // textures? ...
    let vesselColor = this.getColorByStatus(vesselData.status);
    if (infoTrack[infoTrack.length - 1]['fastestVessel']['mmsi'] === vessel.mmsi) vesselColor = this.getColorByStatus('fastest');
    if (infoTrack[infoTrack.length - 1]['longestVessel']['mmsi'] === vessel.mmsi) vesselColor = this.getColorByStatus('longest');

    vessel.beginFill(vesselColor, vesselData.inMapRange ? 1 : .25);
    vessel.drawPolygon([0, -5, 4, 5, -4, 5]);
    vessel.endFill();

    let pos = VTRecorderFinalUtils.cartesianFromLatLong(vesselData.aisPosition.lat, vesselData.aisPosition.lon);
    vessel.x = pos[0];
    vessel.y = pos[1];
    vessel.rotation = vesselData.aisPosition.cog * 0.0174533; // deg to rad

    // display 'hdg' if available
    if (vesselData.aisPosition.hdg !== 511) {
      let line = new PIXI.Graphics();
      line.lineStyle(1, 0x0a17c5, 1);
      line.moveTo(0, 0);
      line.lineTo(0, -12);
      line.x = vessel.x;
      line.y = vessel.y;
      line.rotation = vesselData.aisPosition.hdg * 0.0174533; // deg to rad
      this.vesselGraphics.addChild(line);

      // TODO => set in Record Data!
      if (vesselData.status == 'static' || vesselData.status == 'moored') {
        vessel.rotation = vesselData.aisPosition.hdg * 0.0174533; // deg to rad
      }
    }
  }

  onUpdateTrackerData(vesselPool, rawPoolSize = 0, infoTrack) {

    // console.log('updated', infoTrack)

    for (let i = 0; i < this.vesselGraphics.children.length; i++) {
      this.vesselGraphics.children[i].destroy();
    }
    this.vesselGraphics.removeChildren(0, this.vesselGraphics.children.length);
    this.pathGraphics.removeChildren(0, this.pathGraphics.children.length);
    this.pointGraphics.removeChildren(0, this.pointGraphics.children.length);

    let vesselsPassedRange = 0;
    let vesselsInMapRange = 0;
    let movingVessels = 0;
    let staticVessels = 0;
    let movedVessels = 0;

    for (let i = 0; i < vesselPool.length; i++) {
      this.plotVessel(vesselPool[i], infoTrack);

      if (vesselPool[i]['passedMapRange'] === true) {
        vesselsPassedRange++
      }

      if (vesselPool[i]['inMapRange'] === true) {
        vesselsInMapRange++
      }

      if (vesselPool[i]['hasMoved'] === true) {
        movedVessels++
      }

      if (vesselPool[i]['inMapRange'] === true) {
        if (vesselPool[i]['status'] === 'moving') {
          this.plotVesselPath(vesselPool[i]['trackData'], vesselPool[i]);
          movingVessels++;
        } else {
          this.plotStaticVessel(vesselPool[i], infoTrack);
          staticVessels++
        }
      }
    }

    // update Debug
    this.setState({vesselPoolSize: rawPoolSize});
    this.setState({currentStep: this.vtc.timerData.currentStep});
    this.setState({vesselsPassedRange: vesselsPassedRange});
    this.setState({vesselsInMapRange: vesselsInMapRange});
    this.setState({movingVessels: movingVessels});
    this.setState({staticVessels: staticVessels});
    this.setState({movedVessels: movedVessels});

  }

  plotCollisionBounds(boundsObject, layer) {
    let topLeft = VTRecorderFinalUtils.cartesianFromLatLong(boundsObject.minLat, boundsObject.minLong);
    let topRight = VTRecorderFinalUtils.cartesianFromLatLong(boundsObject.minLat, boundsObject.maxLong);
    let bottomLeft = VTRecorderFinalUtils.cartesianFromLatLong(boundsObject.maxLat, boundsObject.minLong);

    let container = new PIXI.Container();
    let shape = new PIXI.Graphics();
    shape.beginFill(0xd37f11, .2);
    // shape.lineStyle(.5, 0x062f3c);
    shape.drawRect(topLeft[0], topLeft[1], topRight[0] - topLeft[0], bottomLeft[1] - topLeft[1]);
    shape.endFill();

    container.addChild(shape);
    layer.addChild(container);

    this.plotPoint(layer, boundsObject.collisionLineStart, 0x000000, 1, 'bounds');
    this.plotPoint(layer, boundsObject.collisionLineEnd, 0x000000, 1, 'bounds');
    let line = new PIXI.Graphics();
    line.lineStyle(.5, 0x062f3c);
    line.moveTo(boundsObject.collisionLineStart.x, boundsObject.collisionLineStart.y)
    line.lineTo(boundsObject.collisionLineEnd.x, boundsObject.collisionLineEnd.y)
    layer.addChild(line);

  };

  plotPoint(layer, vPos, color = 0xffffff, r = 1.5) {
    let point = new PIXI.Graphics();
    point.beginFill(color);
    point.drawCircle(0, 0, r);
    point.endFill();
    point.x = vPos.x;
    point.y = vPos.y;
    layer.addChild(point);
  };

  plotMapRange() {

    let topLeft = VTRecorderFinalUtils.cartesianFromLatLong(VTRecorderFinalUtils.mapRange.minLat, VTRecorderFinalUtils.mapRange.minLong);
    let topRight = VTRecorderFinalUtils.cartesianFromLatLong(VTRecorderFinalUtils.mapRange.minLat, VTRecorderFinalUtils.mapRange.maxLong);
    let bottomRight = VTRecorderFinalUtils.cartesianFromLatLong(VTRecorderFinalUtils.mapRange.maxLat, VTRecorderFinalUtils.mapRange.maxLong);
    let bottomLeft = VTRecorderFinalUtils.cartesianFromLatLong(VTRecorderFinalUtils.mapRange.maxLat, VTRecorderFinalUtils.mapRange.minLong);

    let shape = new PIXI.Graphics();
    // shape.beginFill(0xc30000, .1);
    shape.lineStyle(.5, 0x062f3c);
    shape.drawRect(topLeft[0], topLeft[1], topRight[0] - topLeft[0], bottomLeft[1] - topLeft[1]);
    shape.endFill();
    this.app.stage.addChild(shape);

    for (let i = 0; i <= 3; i++) {
      let point = new PIXI.Graphics();
      point.beginFill(0x000000);
      point.drawCircle(0, 0, 1.5);
      point.endFill();

      let pos = [];
      switch (i) {
        case 0:
          pos = topLeft;
          break;
        case 1:
          pos = topRight;
          break;
        case 2:
          pos = bottomRight;
          break;
        case 3:
          pos = bottomLeft;
          break;
      }

      point.x = pos[0];
      point.y = pos[1];
      this.app.stage.addChild(point);
    }

  }

  resetTimerDisplay() {
    TweenMax.killTweensOf(['#circle', this.strokeParams]);
    this.strokeParams.strokeLength = 100;
    TweenMax.set('#circle', {strokeDasharray: '0 100', stroke: this.strokeParams.colors[0]});
  }

  restartTimerDisplay() {
    TweenMax.killTweensOf(['#circle', this.strokeParams]);
    this.strokeParams.strokeLength = 100;
    TweenMax.set('#circle', {strokeDasharray: '0 100', stroke: this.strokeParams.colors[0]});

    TweenMax.to('#circle', this.vtc.timerData.timeStep, {stroke: this.strokeParams.colors[1]});
    TweenMax.to(this.strokeParams, this.vtc.timerData.timeStep, {
      ease: Power0.easeNone,
      strokeLength: 0,
      onUpdate: () => {
        const dash = String(this.strokeParams.strokeLength) + ' 100';
        TweenMax.set('#circle', {
          strokeDasharray: dash
        })
      }
    });
  }

  render() {
    let indicatorMarkup =
      <div style={{position: 'absolute', right: '5px', top: '5px'}}>
        <svg
          viewBox="0 0 36 36" className="circular-chart">
          <path className={'circle'} id={'circle'} strokeDasharray="0, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
        </svg>
      </div>;

    return (
      <div style={{position: 'absolute', width: '100%', height: '100%', overflow: 'hidden'}}>
        <div className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}></div>
        <div className={'debug'}>
          {indicatorMarkup}
          <div style={{position: 'absolute', top: '45px', right: '5px', width: '185px'}}>{'vesselPoolSize: ' + this.state.vesselPoolSize}</div>
          <div style={{position: 'absolute', top: '65px', right: '5px', width: '185px'}}>{'currentStep: ' + this.state.currentStep}</div>
          <div style={{position: 'absolute', color: '#ccccff', top: '85px', right: '5px', width: '185px'}}>{'vesselsPassed: ' + this.state.vesselsPassedRange}</div>
          <div style={{position: 'absolute', color: '#ccccff', top: '105px', right: '5px', width: '185px'}}>{'vesselsInRange: ' + this.state.vesselsInMapRange}</div>
          <div style={{position: 'absolute', color: '#ccccff', top: '125px', right: '5px', width: '185px'}}>{'movingVessels: ' + this.state.movingVessels}</div>
          <div style={{position: 'absolute', color: '#ccccff', top: '145px', right: '5px', width: '185px'}}>{'staticVessels: ' + this.state.staticVessels}</div>
          {/*<div style={{position: 'absolute', top: '125px', right: '5px', width: '185px'}}>{'movedVessels: ' + this.state.movedVessels}</div>*/}

          <div style={{position: 'absolute', top: '175px', right: '5px', width: '185px'}}>
            <Button onClick={() => this.onStartRecord()} color="success">Start</Button>
          </div>
          <div style={{position: 'absolute', top: '175px', right: '-60px', width: '185px'}}>
            <Button onClick={() => this.onStopRecord()} color="danger">Stop</Button>
          </div>
          <div style={{position: 'absolute', top: '220px', right: '5px', width: '185px'}}>
            <Button onClick={() => this.onSaveRawData()} color="warning">Save Raw Data</Button>
          </div>
          <div style={{position: 'absolute', top: '265px', right: '5px', width: '185px'}}>
            <Button onClick={() => this.onSaveData()} color="warning">Save Data</Button>
          </div>
        </div>
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

export default connect(mapStateToProps, {})(HafenMapFinal);

