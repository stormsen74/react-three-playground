import React from 'react';
import connect from "react-redux/es/connect/connect";
import {Button} from 'reactstrap';
import 'gsap/TweenMax';
import CloseIcon from 'core/icons/close.inline.svg';
import map from 'components/samples/hafen/images/map.png';
import vesselTrackerRange from 'components/samples/hafen/images/VesselTrackerRange.png';
import * as PIXI from 'pixi.js'

import '../Scene.scss'
import 'bootstrap/dist/css/bootstrap.css';
import VesselTrackerConnector from "./VesselTrackerConnector";

// Nutzername: jwu
// Passwort: 9j583t
//
// https://newapi.vesseltracker.com/api/v1/api-docs/index.html#/AISData/get_vessels_userpolygon


const DEVELOPMENT = process.env.NODE_ENV === 'development';

class HafenMap extends React.Component {
  constructor(props) {
    super(props);

    this.draw = this.draw.bind(this);
    this.onResize = this.onResize.bind(this);
    this.loadReady = this.loadReady.bind(this);
    this.onClickSave = this.onClickSave.bind(this);

    this.strokeParams = {
      strokeLength: 100,
      colors: ['#5ef559', '#f15119']
    };

    this.state = {
      vesselPoolSize: 0,
      vesselsInMapRange: 0,
      movingVessels: 0,
      movedVessels: 0,
      currentStep: 0
    };

    this.GeoBounds = {
      minLong: 9.7538,
      maxLong: 10.0948,
      minLat: 53.5743,
      maxLat: 53.4605
    };

    // this.mapRange = {
    //   minLong: 9.9165,
    //   maxLong: 9.9755,
    //   minLat: 53.5503,
    //   maxLat: 53.5148
    // };

    this.mapRange = {
      minLong: 9.9174	,
      maxLong: 9.9761,
      minLat: 53.5497,
      maxLat: 53.5150
    };

    this.mapData = {
      size: {
        width: 1920,
        height: 1077
      }
    };

    this.timerData = {
      timeStep: 60,
      currentStep: 0
    }

  }

  onClickSave() {
    this.vtc.saveData();
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

  plotGeoRect() {

    // let display = new PIXI.Text(_vesselData['mmsi'], {fontFamily: 'Segoe UI', fontSize: 10, fill: 0xcc660000, align: 'center'});

    let topLeft = this.cartesianFromLatLong(this.mapRange.minLat, this.mapRange.minLong);
    let topRight = this.cartesianFromLatLong(this.mapRange.minLat, this.mapRange.maxLong);
    let bottomRight = this.cartesianFromLatLong(this.mapRange.maxLat, this.mapRange.maxLong);
    let bottomLeft = this.cartesianFromLatLong(this.mapRange.maxLat, this.mapRange.minLong);

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

  loadReady() {
    this.initStage();

    let sprite = new PIXI.Sprite(PIXI.loader.resources[vesselTrackerRange].texture);
    this.app.stage.addChild(sprite);

    this.pathGraphics = new PIXI.Container();
    this.app.stage.addChild(this.pathGraphics);

    this.pointGraphics = new PIXI.Container();
    this.app.stage.addChild(this.pointGraphics);

    this.vesselGraphics = new PIXI.Container();
    this.app.stage.addChild(this.vesselGraphics);

    this.plotGeoRect();


    this.show();

    this.vtc.load();

    this.startTimer();

  }


  resetStroke() {
    TweenMax.killTweensOf(['#circle', this.strokeParams]);
    this.strokeParams.strokeLength = 100;
    TweenMax.set('#circle', {strokeDasharray: '0 100', stroke: this.strokeParams.colors[0]});

    TweenMax.to('#circle', this.timerData.timeStep, {stroke: this.strokeParams.colors[1]});
    TweenMax.to(this.strokeParams, this.timerData.timeStep, {
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


  startTimer() {
    TweenMax.delayedCall(this.timerData.timeStep, this.stepTimer, null, this);

    this.resetStroke()
  }

  stepTimer() {
    console.log('vtc-reqest');
    this.timerData.currentStep++;
    this.setState({currentStep: this.timerData.currentStep});
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
      case 'static':
        color = 0xffa200;
        break;
      case 'lost':
        color = 0x2ad2f6;
        break;
    }
    return color;
  }


  plotVesselPath(pathArray, vesselData) {

    // console.log(pathArray, vesselData)

    let path = new PIXI.Graphics();
    this.pathGraphics.addChild(path);

    let points = new PIXI.Graphics();
    this.pointGraphics.addChild(points);

    for (let i = 0; i < pathArray.length; i++) {
      if (i == 0) {
        const pos = this.cartesianFromLatLong(pathArray[0].lat, pathArray[0].lon);
        path.moveTo(pos[0], pos[1]);
      } else {
        const pos = this.cartesianFromLatLong(pathArray[i].lat, pathArray[i].lon);
        path.lineStyle(1, 0x47f62a, vesselData.inMapRange ? 1 : .25);
        path.lineTo(pos[0], pos[1]);
      }
    }

    for (let j = 0; j < pathArray.length - 1; j++) {
      const pos = this.cartesianFromLatLong(pathArray[j].lat, pathArray[j].lon);
      points.beginFill(0x125e0a, vesselData.inMapRange ? 1 : .25);
      points.drawCircle(pos[0], pos[1], 1);
      points.endFill();
    }


  }

  plotVessel(vesselData) {

    // initial => show all / next step only moving vessels ...
    if (this.timerData.currentStep > 0) {
      if (!vesselData.hasMoved) return;
    }

    let vessel = new PIXI.Graphics();
    vessel.mmsi = vesselData['mmsi']
    vessel.interactive = true;
    vessel.cursor = 'pointer';
    vessel.on('click', (event) => {
      let vesselData = this.vtc.getVesselByMMSI(event.target.mmsi);
      console.log(event.target.mmsi, vesselData)
    });
    vessel.beginFill(this.getColorByStatus(vesselData.status), vesselData.inMapRange ? 1 : .25);
    vessel.drawPolygon([0, -5, 4, 5, -4, 5]);
    vessel.endFill();
    let pos = this.cartesianFromLatLong(vesselData.aisPosition.lat, vesselData.aisPosition.lon);
    vessel.x = pos[0];
    vessel.y = pos[1];
    vessel.rotation = vesselData.aisPosition.cog * 0.0174533; // rad to deg

    this.vesselGraphics.addChild(vessel);
  }

  onUpdateTrackerData(vesselPool) {


    for (let i = 0; i < this.vesselGraphics.children.length; i++) {
      this.vesselGraphics.children[i].destroy();
    }
    this.vesselGraphics.removeChildren(0, this.vesselGraphics.children.length);
    this.pathGraphics.removeChildren(0, this.pathGraphics.children.length);
    this.pointGraphics.removeChildren(0, this.pointGraphics.children.length);

    let movingVessels = 0;
    let movedVessels = 0;
    let vesselsInMapRange = 0;

    for (let i = 0; i < vesselPool.length; i++) {
      this.plotVessel(vesselPool[i]);

      if (vesselPool[i]['inMapRange'] === true) {
        vesselsInMapRange++
      }

      if (vesselPool[i]['hasMoved'] === true) {
        movedVessels++
      }

      if (vesselPool[i]['status'] === 'moving') {
        this.plotVesselPath(vesselPool[i]['trackData'], vesselPool[i])
        movingVessels++;
      }
    }

    // update Debug
    this.setState({vesselPoolSize: vesselPool.length});
    this.setState({vesselsInMapRange: vesselsInMapRange});
    this.setState({movingVessels: movingVessels});
    this.setState({movedVessels: movedVessels});


  }

  cartesianFromLatLong(lat, long) {
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
    let indicatorMarkup =
      <div style={{position: 'absolute', right: '5px', top: '5px'}}>
        <svg
          viewBox="0 0 36 36" className="circular-chart">
          <path className={'circle'} id={'circle'} strokeDasharray="50, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
        </svg>
      </div>;

    return (
      <div style={{position: 'absolute', width: '100%', height: '100%', overflow: 'hidden'}}>
        <div className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}></div>
        <div className={'debug'}>
          {indicatorMarkup}
          <div style={{position: 'absolute', top: '45px', right: '5px', width: '185px'}}>{'currentStep: ' + this.state.currentStep}</div>
          <div style={{position: 'absolute', top: '65px', right: '5px', width: '185px'}}>{'vesselPoolSize: ' + this.state.vesselPoolSize}</div>
          <div style={{position: 'absolute', top: '85px', right: '5px', width: '185px'}}>{'vesselsInRange: ' + this.state.vesselsInMapRange}</div>
          <div style={{position: 'absolute', top: '105px', right: '5px', width: '185px'}}>{'movingVessels: ' + this.state.movingVessels}</div>
          <div style={{position: 'absolute', top: '125px', right: '5px', width: '185px'}}>{'movedVessels: ' + this.state.movedVessels}</div>
          <div style={{position: 'absolute', top: '155px', right: '5px', width: '185px'}}>
            <Button onClick={() => this.onClickSave()} color="success">Save Data</Button>
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

export default connect(mapStateToProps, {})(HafenMap);

