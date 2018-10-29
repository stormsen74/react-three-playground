import React from 'react';
import connect from "react-redux/es/connect/connect";
import 'gsap/TweenMax';
import 'gsap/TimelineMax';
import 'react-dat-gui/build/react-dat-gui.css';
import DatGui, {DatButton, DatNumber} from 'react-dat-gui';
import * as PIXI from 'pixi.js'
import CloseIcon from 'core/icons/close.inline.svg';
import '../Scene.scss'
import {Vector2} from "../../../utils/vector2";
import moment from 'moment';


import VTPlayerUtils from "./utils/VTPlayerUtils";
import CatmullSpline from "./CatmullSpline";
import mathUtils from "../../../utils/mathUtils";
import axios from "axios";


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

    // this.loadReady = this.loadReady.bind(this);
    this.getTides = this.getTides.bind(this);
    this.playTides = this.playTides.bind(this);
    this.stopTides = this.stopTides.bind(this);


    // const data = [[0.0, 0.0], [1.5, 1.0], [2.4, 0.0]];
    // const result = regression.polynomial(data, {order: 2, precision: 3});
    // console.log(result)


    this.plotSize = {
      width: 1500,
      height: 600
    };

    // ——————————————————————————————————————————————————
    // TRY THIS!
    // ——————————————————————————————————————————————————
    // https://www.pegelonline.wsv.de/webservice/ueberblick


    this.vstart = new Vector2(0, this.plotSize.height * .5);

    // let yesterday = moment({hour: 0}).add(1, 'hours').add(10, 'day').subtract(1, 'day').format('X');
    // let today = moment({hour: 0}).add(1, 'hours').add(10, 'day').format('X');

    // let now = moment().format('X');
    // summertime - 2! wintertime-3?
    let yesterday = moment({hour: 0}).add(3, 'hours').subtract(1, 'day').format('X');
    let today = moment({hour: 0}).add(3, 'hours').format('X');
    this.tides = {
      extremes: [],
      timeStart: yesterday,
      timeRange: 3 * 24 * 3600,
      timeStartDay: parseInt(today),
      timeEndDay: parseInt(today) + (24 * 3600),
      range: []
    };
    // [previousDay][currentDay][nextDay]

    this.previousPlotPosition = new Vector2();
    this.time = {t: 0}

    console.log(this.tides);

  }

  componentDidMount() {

    this.initStage();
    this.getTides(this);
    this.show();

  }

  initStage() {
    this.app = new PIXI.Application({
        width: this.plotSize.width + 100,
        height: this.plotSize.height,
        antialias: true,    // default: false
        transparent: false, // default: false
        resolution: 1       // default: 1
      }
    );

    this.app.view.id = 'pixi-app-view';
    this.canvasWrapper.appendChild(this.app.view);

    this.gfx = new PIXI.Container();
    this.controlLayer = new PIXI.Container();
    this.gridLayer = new PIXI.Container();
    this.pointerLayer = new PIXI.Container();
    this.waterLayer = new PIXI.Container();
    this.flowLayer = new PIXI.Container();
    this.app.stage.addChild(this.gridLayer);
    this.app.stage.addChild(this.gfx);
    this.app.stage.addChild(this.controlLayer);
    this.app.stage.addChild(this.pointerLayer);
    this.app.stage.addChild(this.waterLayer);
    this.app.stage.addChild(this.flowLayer);

    this.timeDisplay = new PIXI.Text('0', {fontFamily: 'Arial', fontSize: 15, fill: 0xffffff, align: 'center'});
    this.timeDisplay.x = 510;
    this.timeDisplay.y = 10;
    this.gridLayer.addChild(this.timeDisplay);

    this.levelDisplay = new PIXI.Text('0 m', {fontFamily: 'Arial', fontSize: 15, fill: 0xffffff, align: 'center'});
    this.levelDisplay.x = 1500 - 50;
    this.levelDisplay.y = this.vstart.y + 30;
    this.gridLayer.addChild(this.levelDisplay);

    this.pointer = new PIXI.Graphics();
    this.pointer.beginFill(0x00ff00);
    this.pointer.drawCircle(0, 0, 3);
    this.pointer.endFill();
    this.pointer.x = 0;
    this.pointer.y = 0;
    this.pointerLayer.addChild(this.pointer);
  }

  show() {
    TweenMax.to(this.canvasWrapper, .5, {delay: .25, opacity: 1, ease: Cubic.easeIn});
  }

  getTides(_this) {
    let responseData =
      {
        "status": 200,
        "callCount": 1,
        "copyright": "Tidal data retrieved from www.worldtide.info. Copyright (c) 2014-2017 Brainware LLC. Licensed for use of individual spatial coordinates on behalf of\/by an end-user. Copyright (c) 2010-2016 Oregon State University. Licensed for individual spatial coordinates via ModEM-Geophysics Inc. NO GUARANTEES ARE MADE ABOUT THE CORRECTNESS OF THIS DATA. You may not use it if anyone or anything could come to harm as a result of using it (e.g. for navigational purposes).",
        "requestLat": 53.544382,
        "requestLon": 9.966491,
        "responseLat": 53.8333,
        "responseLon": 9,
        "atlas": "TPXO_8_v1",
        "extremes": [{"dt": 1540426093, "date": "2018-10-25T00:08+0000", "height": 2.303, "type": "High"}, {"dt": 1540451529, "date": "2018-10-25T07:12+0000", "height": -2.171, "type": "Low"}, {"dt": 1540470341, "date": "2018-10-25T12:25+0000", "height": 2.578, "type": "High"}, {"dt": 1540496115, "date": "2018-10-25T19:35+0000", "height": -2.347, "type": "Low"}, {"dt": 1540514743, "date": "2018-10-26T00:45+0000", "height": 2.55, "type": "High"}, {"dt": 1540540365, "date": "2018-10-26T07:52+0000", "height": -2.338, "type": "Low"}, {"dt": 1540559064, "date": "2018-10-26T13:04+0000", "height": 2.771, "type": "High"}, {"dt": 1540584928, "date": "2018-10-26T20:15+0000", "height": -2.423, "type": "Low"}, {"dt": 1540603449, "date": "2018-10-27T01:24+0000", "height": 2.726, "type": "High"}, {"dt": 1540629224, "date": "2018-10-27T08:33+0000", "height": -2.424, "type": "Low"}, {"dt": 1540647860, "date": "2018-10-27T13:44+0000", "height": 2.869, "type": "High"}, {
          "dt": 1540673787,
          "date": "2018-10-27T20:56+0000",
          "height": -2.408,
          "type": "Low"
        }]
      }
    _this.initCurve(responseData);
    return

    // 3 credits per request
    const url = 'https://www.worldtides.info/api?extremes&lat=53.544382&lon=9.966491&start=' + _this.tides.timeStart + '&length=259200&key=39457c2e-7d8d-43e1-af1c-655ac83991d3';
    axios.get(url, {
      responseType: 'json',
      headers: {
        'accept': 'application/json',
        // 'Authorization': 'f780dfde-e181-4c1d-a246-fe9fbd80274c'
      },
    }).then(function (response) {
      console.log(response.data);
      _this.initCurve(response.data);
    }).catch(function (error) {
      // handle error
      console.log(error);
    }).then(function () {
      // if error debug!
    });
  }

  initCurve(data) {
    this.tides.extremes = data.extremes;

    this.ctrlPoints = [];
    for (let i = 0; i < this.tides.extremes.length; i++) {
      let x = this.vstart.x + ((this.tides.extremes[i].dt - this.tides.timeStart) / this.tides.timeRange) * this.plotSize.width;
      let y = this.vstart.y + (this.tides.extremes[i].height * 50);
      this.ctrlPoints.push([x, y]);
    }

    this.spline = new CatmullSpline(this.ctrlPoints);

    this.plotGrid();
    this.renderSpline();
    this.renderControlPoints();
    this.tides.range = this.getRange()
  }

  plotGrid() {
    VTPlayerUtils.plotLine(this.gridLayer, this.vstart, new Vector2(this.vstart.x + this.plotSize, this.vstart.y), 0xccccff, 1)
    VTPlayerUtils.plotLine(this.gridLayer, new Vector2(this.vstart.x + 500, 0), new Vector2(this.vstart.x + 500, this.vstart.y + 600), 0xccccff, 1)
    VTPlayerUtils.plotLine(this.gridLayer, new Vector2(this.vstart.x + 500 + 125, 0), new Vector2(this.vstart.x + 500 + 125, this.vstart.y + 600), 0x00ff00, .5)
    VTPlayerUtils.plotLine(this.gridLayer, new Vector2(this.vstart.x + 500 + 250, 0), new Vector2(this.vstart.x + 500 + 250, this.vstart.y + 600), 0x00ff00, .5)
    VTPlayerUtils.plotLine(this.gridLayer, new Vector2(this.vstart.x + 500 + 375, 0), new Vector2(this.vstart.x + 500 + 375, this.vstart.y + 600), 0x00ff00, .5)
    VTPlayerUtils.plotLine(this.gridLayer, new Vector2(this.vstart.x + 1000, 0), new Vector2(this.vstart.x + 1000, this.vstart.y + 600), 0xccccff, 1)
    VTPlayerUtils.plotLine(this.gridLayer, new Vector2(this.vstart.x, this.vstart.y), new Vector2(this.vstart.x + 1500, this.vstart.y), 0x36ceed, .5)
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

  getRange() {
    let t = 0;
    let progress = 0;
    let pos = [];
    let range = [];
    while (t < 1) {
      t += .001;
      progress = t * (this.ctrlPoints.length - 3);
      pos = this.spline.evaluate(progress);
      if (Math.floor(pos[0]) == 500) range[0] = progress;
      if (Math.floor(pos[0]) == 1000) range[1] = progress;
    }
    return range;
  }


  playTides() {
    this.time.t = 0;

    TweenMax.to(this.time, 60, {
      t: 1,
      ease: Linear.easeNone,
      onUpdate: () => {
        this.plotTime(this.time.t);
        this.setState({
          data: {
            ...this.state.data,
            progress: this.time.t
          }
        })
      },
      onUpdateScope: this,
      onComplete: () => {
        this.previousPlotPosition = new Vector2();
        this.playTides();
      },
      onCompleteScope: this
    })
  }

  stopTides() {
    TweenMax.killTweensOf(this.time);
  }


  plotTime(value) {
    const progress = value * (this.ctrlPoints.length - 3);
    const mappedProgress = mathUtils.convertToRange(progress, [0, this.ctrlPoints.length - 3], [this.tides.range[0], this.tides.range[1]]);
    const pos = this.spline.evaluate(mappedProgress);
    const currentPosition = new Vector2(pos[0], pos[1]);
    if (this.previousPlotPosition.length() > 0) {
      const tangent = Vector2.subtract(currentPosition, this.previousPlotPosition).normalize();
      const tangentRAD = Vector2.getAngleRAD(tangent);

      if (this.flowLayer.children.length > 0) this.flowLayer.removeChildAt(0);
      const start = new Vector2(750, 500);
      const end = start.clone();
      end.add(new Vector2(tangentRAD * 100, 0))

      VTPlayerUtils.plotLine(this.flowLayer, start, end, tangentRAD > 0 ? 0xea2323 : 0x36ceed, 5 * Math.abs(tangentRAD))
    }
    this.previousPlotPosition = currentPosition.clone();

    this.pointer.x = currentPosition.x;
    this.pointer.y = currentPosition.y;

    if (this.waterLayer.children.length > 0) this.waterLayer.removeChildAt(0);
    const waterLevel = 2.5 - (.9 * (this.pointer.y - this.vstart.y) / 50);
    this.levelDisplay.text = waterLevel.toFixed(2) + ' m';
    let level = new PIXI.Graphics();
    level.beginFill(0x3578ea);
    level.drawRect(0, 0, 50, -waterLevel * 50);
    level.endFill();
    level.x = 1500 - 50;
    level.y = this.vstart.y;
    this.waterLayer.addChild(level);


    const time = Math.round(mathUtils.convertToRange(value, [0, 1], [this.tides.timeStartDay, this.tides.timeEndDay])) - this.tides.timeStartDay;
    const minutes = time / 60;
    const hours = Math.floor(time / 3600);
    this.timeDisplay.text = hours + ' : ' + Math.round(minutes % 60);
  }

  updateData(data) {
    this.stopTides();
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
          <DatButton label="Play" onClick={this.playTides}/>
          <DatButton label="Stop" onClick={this.stopTides}/>
          {/*<DatButton label="Pause" onClick={this.pauseTimeline}/>*/}
          {/*<DatBoolean path='showPath' label='showPath'/>*/}
          {/*<DatBoolean path='showBounds' label='showBounds'/>*/}
        </DatGui>
        <a href={'/'}>
          <CloseIcon fill={'#ffffff'} className="close-icon"/>
        </a>
      </div>

    );
  }
}

function mapStateToProps(state) {
  return {};
}

export default connect(mapStateToProps, {})(TidesVisualizer);

