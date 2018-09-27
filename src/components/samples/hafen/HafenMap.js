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
      movingVessels: 0,
      movedVessels: 0,
      currentStep: 0
    }

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

    // let pos = this.getXY(53.544448333333335, 9.985446666666666);
    // point.x = pos[0];
    // point.y = pos[1];


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
      case 'lost':
        color = 0x2ad2f6;
        break;
    }
    return color;
  }


  plotVesselPath(pathArray, vesselData) {

    console.log(pathArray, vesselData)

    // if (vesselData.mmsi === 211513200) return

    let path = new PIXI.Graphics();
    this.pathGraphics.addChild(path);

    let points = new PIXI.Graphics();
    this.pointGraphics.addChild(points);

    // let posStart = this.getXY(pathArray[0].lat, pathArray[0].lon);
    // path.moveTo(posStart[0], posStart[1]);


    for (let i = 0; i < pathArray.length; i++) {
      if (i == 0) {
        const pos = this.getXY(pathArray[0].lat, pathArray[0].lon);
        path.moveTo(pos[0], pos[1]);
      } else {
        const pos = this.getXY(pathArray[i].lat, pathArray[i].lon);
        path.lineStyle(1, 0x47f62a, 1);
        path.lineTo(pos[0], pos[1]);
      }
    }


    for (let j = 0; j < pathArray.length - 1; j++) {
      const pos = this.getXY(pathArray[j].lat, pathArray[j].lon);
      points.beginFill(0x125e0a);
      points.drawCircle(pos[0], pos[1], 2);
      points.endFill();
    }


  }

  plotVessel(vesselData) {

    if (!vesselData.hasMoved) return;

    let vessel = new PIXI.Graphics();
    vessel.beginFill(this.getColorByStatus(vesselData.status));
    // point.drawCircle(0, 0, 3);
    vessel.drawPolygon([0, -5, 4, 5, -4, 5]);
    vessel.endFill();
    let pos = this.getXY(vesselData.aisPosition.lat, vesselData.aisPosition.lon);
    vessel.x = pos[0];
    vessel.y = pos[1];
    vessel.rotation = vesselData.aisPosition.cog * 0.0174533; // rad to deg

    this.vesselGraphics.addChild(vessel);
  }

  onUpdateTrackerData(vesselPool) {

    // update Debug
    this.setState({vesselPoolSize: vesselPool.length});

    this.vesselGraphics.removeChildren(0, this.vesselGraphics.children.length);
    this.pathGraphics.removeChildren(0, this.pathGraphics.children.length);
    this.pointGraphics.removeChildren(0, this.pointGraphics.children.length);

    let movingVessels = 0;
    let movedVessels = 0;

    for (let i = 0; i < vesselPool.length; i++) {
      this.plotVessel(vesselPool[i]);

      if (vesselPool[i]['hasMoved'] === true) {
        movedVessels++
      }

      if (vesselPool[i]['status'] === 'moving') {
        this.plotVesselPath(vesselPool[i]['trackData'], vesselPool[i])
        movingVessels++;
      }
    }

    this.setState({movingVessels: movingVessels});
    this.setState({movedVessels: movedVessels});


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
          <div style={{position: 'absolute', top: '85px', right: '5px', width: '185px'}}>{'movingVessels: ' + this.state.movingVessels}</div>
          <div style={{position: 'absolute', top: '105px', right: '5px', width: '185px'}}>{'movedVessels: ' + this.state.movedVessels}</div>
          <div style={{position: 'absolute', top: '140px', right: '5px', width: '185px'}}>
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

