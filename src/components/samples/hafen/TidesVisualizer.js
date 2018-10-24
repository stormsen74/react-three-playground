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
import moment from 'moment';
import tidesReferenz from 'components/samples/hafen/images/tides_23_24_25.png';


import vesselTrackerRange from 'components/samples/hafen/images/ProtoRangeOrigin.png';
import VTPlayerUtils from "./utils/VTPlayerUtils";
import VTRecorderUtils from "./VTRecorderUtils";
import CatmullSpline from "./CatmullSpline";
import mathUtils from "../../../utils/mathUtils";


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

    this.loadReady = this.loadReady.bind(this);


    const data = [[0.0, 0.0], [1.5, 1.0], [2.4, 0.0]];
    const result = regression.polynomial(data, {order: 2, precision: 3});
    // console.log(result)

    this.vstart = new Vector2(0, 300);

    let now = moment().format('X');
    console.log(now)

    this.tides = {
      timeStart: 1539561600,
      timeRange: 3 * 24 * 3600,
      timeStartDay: 1539648000,
      timeEndDay: 1539648000 + (24 * 3600)
    }

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
        // console.log(Vector2.getAngleDEG(tangent))
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

  plotGrid() {
    VTPlayerUtils.plotLine(this.gridLayer, this.vstart, new Vector2(this.vstart.x + 1500, this.vstart.y), 0xccccff, 1)
    VTPlayerUtils.plotLine(this.gridLayer, new Vector2(this.vstart.x + 500, 0), new Vector2(this.vstart.x + 500, this.vstart.y + 600), 0xccccff, 1)
    VTPlayerUtils.plotLine(this.gridLayer, new Vector2(this.vstart.x + 500 + 125, 0), new Vector2(this.vstart.x + 500 + 125, this.vstart.y + 600), 0x00ff00, .5)
    VTPlayerUtils.plotLine(this.gridLayer, new Vector2(this.vstart.x + 500 + 250, 0), new Vector2(this.vstart.x + 500 + 250, this.vstart.y + 600), 0x00ff00, .5)
    VTPlayerUtils.plotLine(this.gridLayer, new Vector2(this.vstart.x + 500 + 375, 0), new Vector2(this.vstart.x + 500 + 375, this.vstart.y + 600), 0x00ff00, .5)
    VTPlayerUtils.plotLine(this.gridLayer, new Vector2(this.vstart.x + 1000, 0), new Vector2(this.vstart.x + 1000, this.vstart.y + 600), 0xccccff, 1)
  }

  testSpline() {
    // https://codepen.io/ahung89/pen/XMdvxM

    let extremes = [
      {
        "dt": 1539575013,
        "date": "2018-10-15T03:43+0000",
        "height": 2.237,
        "type": "High"
      },
      {
        "dt": 1539600414,
        "date": "2018-10-15T10:46+0000",
        "height": -1.894,
        "type": "Low"
      },
      {
        "dt": 1539619666,
        "date": "2018-10-15T16:07+0000",
        "height": 2.016,
        "type": "High"
      },
      {
        "dt": 1539644717,
        "date": "2018-10-15T23:05+0000",
        "height": -1.604,
        "type": "Low"
      },
      {
        "dt": 1539664038,
        "date": "2018-10-16T04:27+0000",
        "height": 1.926,
        "type": "High"
      },
      {
        "dt": 1539689341,
        "date": "2018-10-16T11:29+0000",
        "height": -1.611,
        "type": "Low"
      },
      {
        "dt": 1539708854,
        "date": "2018-10-16T16:54+0000",
        "height": 1.634,
        "type": "High"
      },
      {
        "dt": 1539733632,
        "date": "2018-10-16T23:47+0000",
        "height": -1.328,
        "type": "Low"
      },
      {
        "dt": 1539753382,
        "date": "2018-10-17T05:16+0000",
        "height": 1.605,
        "type": "High"
      },
      {
        "dt": 1539778649,
        "date": "2018-10-17T12:17+0000",
        "height": -1.354,
        "type": "Low"
      },
      {
        "dt": 1539798518,
        "date": "2018-10-17T17:48+0000",
        "height": 1.29,
        "type": "High"
      }
    ];


    this.ctrlPoints = [];
    for (let i = 0; i < extremes.length; i++) {
      let x = this.vstart.x + ((extremes[i].dt - this.tides.timeStart) / this.tides.timeRange) * 1500;
      let y = this.vstart.y + (extremes[i].height * 50);
      this.ctrlPoints.push([x, y]);
      console.log((extremes[i].dt - this.tides.timeStart) / this.tides.timeRange);
    }

    // [previousDay][currentDay][nextDay]
    this.spline = new CatmullSpline(this.ctrlPoints);

    this.plotGrid();
    this.renderSpline();
    this.renderControlPoints();
  }

  componentDidMount() {

    this.initialLoad();


  }

  initialLoad() {
    PIXI.loader.add(tidesReferenz).load(this.loadReady);
  }


  show() {
    TweenMax.to(this.canvasWrapper, .5, {delay: .25, opacity: 1, ease: Cubic.easeIn});
  }

  loadReady() {
    this.initStage();
    this.testSpline();
    this.show();
  }

  initStage() {
    this.app = new PIXI.Application({
        width: 1500,
        height: 600,
        antialias: true,    // default: false
        transparent: false, // default: false
        resolution: 1       // default: 1
      }
    );

    this.app.view.id = 'pixi-app-view';
    this.canvasWrapper.appendChild(this.app.view);


    let sprite = new PIXI.Sprite(PIXI.loader.resources[tidesReferenz].texture);
    sprite.y = 101;
    sprite.alpha = .5;
    // this.app.stage.addChild(sprite);

    this.gfx = new PIXI.Container();
    this.controlLayer = new PIXI.Container();
    this.gridLayer = new PIXI.Container();
    this.pointerLayer = new PIXI.Container();
    this.app.stage.addChild(this.gridLayer);
    this.app.stage.addChild(this.gfx);
    this.app.stage.addChild(this.controlLayer);
    this.app.stage.addChild(this.pointerLayer);

    this.timeDisplay = new PIXI.Text('0', {fontFamily: 'Arial', fontSize: 15, fill: 0xffffff, align: 'center'});
    this.timeDisplay.x = 510;
    this.timeDisplay.y = 10;
    this.gridLayer.addChild(this.timeDisplay)


    this.pointer = new PIXI.Graphics();
    this.pointer.beginFill(0x00ff00);
    this.pointer.drawCircle(0, 0, 3);
    this.pointer.endFill();
    this.pointer.x = 0;
    this.pointer.y = 0;
    this.pointerLayer.addChild(this.pointer);
  }

  plotTime(value) {
    const progress = value * (this.ctrlPoints.length - 3);
    const mappedProgress = mathUtils.convertToRange(progress, [0, this.ctrlPoints.length - 3], [2.152, 6.032]);
    const pos = this.spline.evaluate(mappedProgress);
    const currentPosition = new Vector2(pos[0], pos[1]);
    this.pointer.x = currentPosition.x;
    this.pointer.y = currentPosition.y;

    // 24.10 => 1540339200
    // 25.10 => 1540425600
    const time = Math.round(mathUtils.convertToRange(value, [0, 1], [this.tides.timeStartDay, this.tides.timeEndDay])) - this.tides.timeStartDay;
    const minutes = time / 60;
    const hours = Math.floor(time / 3600);
    this.timeDisplay.text = hours + ' : ' + Math.round(minutes % 60);
  }

  updateData(data) {
    this.setState({data});
    this.plotTime(data.progress);
  }


  render() {
    const {data} = this.state;
    if (this.pathLayer) this.pathLayer.visible = data.showPath;
    if (this.boundsLayer) this.boundsLayer.visible = data.showBounds;

    return (
      <div className={'wrapper'}>
        <div className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}></div>
        <DatGui data={data} onUpdate={this.update}>
          <DatNumber path='progress' label='progress' min={0} max={1} step={0.001}/>
          {/*<DatButton label="Play" onClick={this.playTimeline}/>*/}
          {/*<DatButton label="Pause" onClick={this.pauseTimeline}/>*/}
          {/*<DatBoolean path='showPath' label='showPath'/>*/}
          {/*<DatBoolean path='showBounds' label='showBounds'/>*/}
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

