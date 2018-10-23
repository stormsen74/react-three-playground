import React from 'react';
import connect from "react-redux/es/connect/connect";
import 'gsap/TweenMax';
import 'gsap/TimelineMax';
import 'react-dat-gui/build/react-dat-gui.css';
import DatGui, {DatBoolean, DatButton, DatColor, DatNumber, DatString} from 'react-dat-gui';
import * as PIXI from 'pixi.js'
import CloseIcon from 'core/icons/close.inline.svg';
import '../Scene.scss'
import {Vector2} from "../../../utils/vector2";
import regression from 'regression';


import vesselTrackerRange from 'components/samples/hafen/images/ProtoRangeOrigin.png';
import VTPlayerUtils from "./utils/VTPlayerUtils";
import VTRecorderUtils from "./VTRecorderUtils";
import CatmullSpline from "./CatmullSpline";


const DEVELOPMENT = process.env.NODE_ENV === 'development';

class TidesVisualizer extends React.Component {

  state = {
    data: {
      package: 'react-dat-gui',
      progress: 0,
      showPath: true,
      showBounds: true,
      feelsLike: '#2FA1D6'
    }
  };

  update = data => this.updateData(data);

  constructor(props) {
    super(props);


    const data = [[0.0, 0.0], [1.5, 1.0], [2.4, 0.0]];
    const result = regression.polynomial(data, {order: 2, precision: 3});
    console.log(result)

    this.vstart = new Vector2(0, 250);


  }


  renderSpline() {
    let t = 0;
    let previousPosition = new Vector2();
    while (t < this.ctrlPoints.length - 3) {
      let splinePoint = this.spline.evaluate(t);
      if (previousPosition.length() > 0) {
        const currentPosition = new Vector2(splinePoint[0], splinePoint[1]);
        VTPlayerUtils.plotLine(this.gfx, previousPosition, currentPosition, 0xffffff, 1);
        const tangent = Vector2.subtract(currentPosition, previousPosition).normalize();
        console.log(Vector2.getAngleDEG(tangent))
      }
      previousPosition = new Vector2(splinePoint[0], splinePoint[1]);
      t += .01;
    }
  }

  renderControlPoints() {
    for (let i = 0; i < this.ctrlPoints.length; i++) {
      VTPlayerUtils.plotPoint(this.controlLayer, new Vector2(this.ctrlPoints[i][0], this.ctrlPoints[i][1]), 0xff0000, 3)
    }
  }

  testSpline() {
    // https://codepen.io/ahung89/pen/XMdvxM

    // [previousDay][currentDay][nextDay]
    this.ctrlPoints = [[-100, this.vstart.y + 0], [0, this.vstart.y + 0], [150, this.vstart.y + 100], /*[200, this.vzero.y + 0],*/ [300, this.vstart.y + -100], /*[400, this.vstart.y + 0], */[500, this.vstart.y + 100], [600, this.vstart.y + 0]];
    this.spline = new CatmullSpline(this.ctrlPoints);

    this.renderSpline();
    this.renderControlPoints();
  }

  componentDidMount() {
    this.initStage();
    this.testSpline();
    this.show();
  }


  show() {
    TweenMax.to(this.canvasWrapper, .5, {delay: .25, opacity: 1, ease: Cubic.easeIn});
  }

  initStage() {
    this.app = new PIXI.Application({
        width: 1000,
        height: 600,
        antialias: true,    // default: false
        transparent: false, // default: false
        resolution: 1       // default: 1
      }
    );

    this.app.view.id = 'pixi-app-view';
    this.canvasWrapper.appendChild(this.app.view);

    this.gfx = new PIXI.Container();
    this.controlLayer = new PIXI.Container();
    this.app.stage.addChild(this.gfx);
    this.app.stage.addChild(this.controlLayer);

  }


  render() {
    const {data} = this.state;
    if (this.pathLayer) this.pathLayer.visible = data.showPath;
    if (this.boundsLayer) this.boundsLayer.visible = data.showBounds;

    return (
      <div className={'wrapper'}>
        <div className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}></div>
        <DatGui data={data} onUpdate={this.update}>
          <DatNumber path='progress' label='progress' min={0} max={1} step={0.01}/>
          <DatButton label="Play" onClick={this.playTimeline}/>
          <DatButton label="Pause" onClick={this.pauseTimeline}/>
          <DatBoolean path='showPath' label='showPath'/>
          <DatBoolean path='showBounds' label='showBounds'/>
          {/*<DatColor path='feelsLike' label='Feels Like'/>*/}
        </DatGui>
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

export default connect(mapStateToProps, {})(TidesVisualizer);

