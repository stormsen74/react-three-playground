import React from 'react';
import connect from "react-redux/es/connect/connect";
import axios from 'axios';
import * as PIXI from 'pixi.js'
import DatGui, {DatBoolean, DatButton, DatNumber} from 'react-dat-gui';
import 'gsap/TweenMax';
import 'gsap/TimelineMax';
import 'react-dat-gui/build/react-dat-gui.css';
import CloseIcon from 'core/icons/close.inline.svg';
import '../Scene.scss'
import {Vector2} from "../../../utils/vector2";
import Mousetrap from 'mousetrap';


import mapImage from 'components/samples/hafen/images/FinalMap.png';
import mapImageLarge from 'components/samples/hafen/images/FinalMapLarge.png';
import VTPlayerFinalUtils from "./utils/final/VTPlayerFinalUtils";

const DEVELOPMENT = process.env.NODE_ENV === 'development';

class VTPlayerFinal extends React.Component {

  state = {
    data: {
      package: 'react-dat-gui',
      t: 0,
      frame: 0,
      showPath: false,
      showBounds: true,
      feelsLike: '#2FA1D6'
    }
  };

  update = data => this.updateData(data);

  constructor(props) {
    super(props);

    this.showLargeMap = true;
    if (!this.showLargeMap) {
      this.mapImage = mapImage;
    } else {
      this.mapImage = mapImageLarge;
      VTPlayerFinalUtils.mapData.size.width = 3500;
      VTPlayerFinalUtils.mapData.size.height = 1530;
    }

    this.loadReady = this.loadReady.bind(this);

    this.stepForward = this.stepForward.bind(this);
    this.stepBack = this.stepBack.bind(this);

    this.shiftdown = this.shiftdown.bind(this);
    this.shiftup = this.shiftup.bind(this);

    this.shiftIsDown = false;
    Mousetrap.bind('6', this.stepForward);
    Mousetrap.bind('4', this.stepBack);
    Mousetrap.bind('shift', this.shiftdown, 'keydown');
    Mousetrap.bind('shift', this.shiftup, 'keyup');


  }

  shiftdown() {
    this.shiftIsDown = true;
  }

  shiftup() {
    this.shiftIsDown = false;
  }

  stepForward() {

    if (this.progress < 1) {
      this.progress += this.timeStep;
      this.currentFrame = Math.round(this.progress * this.trackLength);
      this.updateDebug();
    }
  }

  stepBack() {
    if (this.progress >= this.timeStep) {
      this.progress -= this.timeStep;
      this.currentFrame = Math.round(this.progress * this.trackLength);
      this.updateDebug();
    }
  }

  updateDebug() {


    for (let i = 0; i < this.vesselLayer.children.length; i++) {

      // console.log(i, this.progress, this.vesselLayer.children[i].data.trackData[0].t);
      // let vessel = this.vesselLayer.children[i];
      // let parsedTrack = vessel.parsedTrack;

      // for (let j = 0; j < parsedTrack.length; j++) {
      //   if (this.progress >= parsedTrack[j].t) {
      //     vessel.x = vessel.parsedTrack[j].x;
      //     vessel.y = vessel.parsedTrack[j].y;
      //     vessel.children[1].rotation = vessel.parsedTrack[j].r * 0.0174533;
      //   }
      // }
      if (this.vesselLayer.children[i].parsedTrack[this.currentFrame] != null) {
        const data = this.vesselLayer.children[i].parsedTrack[this.currentFrame];
        this.vesselLayer.children[i].x = data.x;
        this.vesselLayer.children[i].y = data.y;
        this.vesselLayer.children[i].children[1].rotation = data.r * 0.0174533;

        // this.vesselLayer.children[i].children[2].visible = data.status == 'static' ? true : false;
        // this.vesselLayer.children[i].children[3].visible = data.status == 'moored' ? true : false;
        // this.vesselLayer.children[i].children[4].visible = data.status === 'waiting' ? true : false;
      }
    }

    this.setState({
      data: {
        ...this.state.data,
        frame: this.currentFrame,
        t: this.progress
      }
    });

  }

  componentDidMount() {
    this.initialLoad();
  }

  initialLoad() {
    PIXI.loader.add(this.mapImage).load(this.loadReady);
  }

  loadReady() {
    this.initStage();

    this.mapLayer = new PIXI.Container();
    this.mapLayer.interactive = true;
    this.boundsLayer = new PIXI.Container();
    this.pathLayer = new PIXI.Container();
    this.pathLayer.blendMode = PIXI.BLEND_MODES.ADD;
    this.vesselLayer = new PIXI.Container();
    this.staticVesselLayer = new PIXI.Container();


    let sprite = new PIXI.Sprite(PIXI.loader.resources[this.mapImage].texture);
    this.mapLayer.addChild(sprite);
    this.mapLayer.on('click', (e) => {
      if (this.shiftIsDown) {
        const point = this.app.renderer.plugins.interaction.mouse.global;
        console.log(VTPlayerFinalUtils.geoFromCartesian(point.x, point.y))
      }
    });

    this.mapLayer.cacheAsBitmap = true;
    this.pathLayer.cacheAsBitmap = true;

    this.app.stage.addChild(this.mapLayer);
    this.app.stage.addChild(this.boundsLayer);
    this.app.stage.addChild(this.pathLayer);
    this.app.stage.addChild(this.staticVesselLayer);
    this.app.stage.addChild(this.vesselLayer);

    this.plotBounds();

    this.loadDataFromAPI(this);

  }


  plotBounds() {
    for (let i = 0; i < VTPlayerFinalUtils.collisionBounds.length; i++) {
      VTPlayerFinalUtils.plotCollisionBounds(VTPlayerFinalUtils.collisionBounds[i], this.boundsLayer);
    }
  }

  // ——————————————————————————————————————————————————
  // api - handling
  // ——————————————————————————————————————————————————


  loadDataFromAPI(_this) {
    const url = 'http://db.dumont.dmdr.io/v1/appdata/?day=0';
    axios.get(url, {
      responseType: 'json',
      headers: {
        'accept': 'application/json',
      },
    }).then(function (response) {
      _this.init(response.data);
    }).catch(function (error) {
      // handle error
      console.log(error);
    }).then(function () {
      // if error debug!
    });
  }

  init(appdata) {
    console.log('appdata: ', appdata.meta);

    this.range = {
      start: 0,
      end: appdata.vesselPool.length,
      // start: 0,
      // end: 1,
      _count: 0
    };

    this.progress = 0;
    this.currentFrame = 0;
    this.trackLength = 1440;
    this.timeStep = 1 / this.trackLength;

    this.parseTrackData(appdata);

    this.show();
  }


  show() {
    TweenMax.to(this.canvasWrapper, .5, {delay: .25, opacity: 1, ease: Cubic.easeIn});
  }


  initStage() {
    this.app = new PIXI.Application({
        width: VTPlayerFinalUtils.mapData.size.width,
        height: VTPlayerFinalUtils.mapData.size.height,
        antialias: true,    // default: false
        transparent: false, // default: false
        resolution: 1       // default: 1
      }
    );

    this.app.view.id = 'pixi-app-view';
    this.canvasWrapper.appendChild(this.app.view);

  }


  parseTrackData(_data) {
    let validCounter = 0;
    console.log('_data:', _data.vesselPool);

    for (let i = 0; i < _data.vesselPool.length; i++) {

      if (validCounter >= this.range.start) {
        if (validCounter < this.range.end) {

          // ——————————————————————————————————————————————————
          // debug optimizations ...
          // ——————————————————————————————————————————————————
          // this.optimizeTrackData(_data.vesselPool[i]);
          // this.correctRotationTrackData(_data.vesselPool[i]);

          this.initVessel(_data.vesselPool[i], validCounter, this.range._count);
          this.range._count++;

        }
      }

      validCounter++;
    }

    // save Debug
    // let data = new Blob([JSON.stringify(trackData)], {type: "application/json"});
    // saveAs(data, "vesselData.json");

    this.updateDebug();

  }

  initVessel(_vesselData, _count, _index) {
    // console.log(_count, _index)

    let vessel = new PIXI.Container();

    const vesselType = _vesselData['aisStatic']['type'];
    const vesselColor = this.getColorByType(vesselType);
    // if (_vesselData['mmsi'] == 211437270) vesselColor = 0xf3d611;

    let vesselGraphics = new PIXI.Graphics();
    vesselGraphics.beginFill(vesselColor);
    vesselGraphics.drawCircle(0, 0, 4);
    vesselGraphics.endFill();
    vessel.addChild(vesselGraphics);

    // VTPlayerFinalUtils.plotLine(vessel, new Vector2(0, 0), new Vector2(0, -25), 0xff0000, 1); // cog
    // VTPlayerFinalUtils.plotLine(vessel, new Vector2(0, 0), new Vector2(0, -25), 0x00ff00, 1); // hdg
    VTPlayerFinalUtils.plotLine(vessel, new Vector2(0, 0), new Vector2(0, -15), 0x0000ff, 1); // rot
    VTPlayerFinalUtils.plotPoint(vessel, new Vector2(0, 0), 0xf3b611, 2);
    VTPlayerFinalUtils.plotPoint(vessel, new Vector2(0, 0), 0xff0000, 2);
    VTPlayerFinalUtils.plotPoint(vessel, new Vector2(0, 0), 0x0000ff, 2);

    this.vesselLayer.addChild(vessel);

    vessel.data = _vesselData;
    vessel.count = _count;
    vessel.interactive = true;
    vessel.cursor = 'pointer';
    vessel.on('click', (event) => {
      console.log(event.target.data);
      console.log(event.target.count)
    });

    // parse Track
    let parsedTrack = [];
    for (let c = 0; c < this.trackLength; c++) {
      parsedTrack[c] = null;
    }

    if (_vesselData['trackData'].length > 1) {

      for (let i = 0; i < _vesselData['trackData'].length; i++) {
        let currentTrackPoint = _vesselData['trackData'][i];
        let currentPosition = VTPlayerFinalUtils.cartesianFromLatLong(currentTrackPoint.x, currentTrackPoint.y);
        let frame = parseInt(_vesselData['trackData'][i].t * this.trackLength)
        parsedTrack[frame] = {x: currentPosition[0], y: currentPosition[1], r: currentTrackPoint.r, t: currentTrackPoint.t};

        if (i === _vesselData['trackData'].length-1) {
          console.log(currentTrackPoint.t)
        }

        if (i === 0) {
          vessel.x = parsedTrack[frame].x;
          vessel.y = parsedTrack[frame].y;
        }

      }

    } else {
      let currentTrackPoint = _vesselData['trackData'][0];
      let currentPosition = VTPlayerFinalUtils.cartesianFromLatLong(currentTrackPoint.x, currentTrackPoint.y);
      vessel.x = currentPosition[0];
      vessel.y = currentPosition[1];
    }


    vessel.parsedTrack = parsedTrack;


  }

  getColorByType(type) {
    let color = 0x000000;
    switch (type) {
      case 'pleasure_crafts':
        color = 0x971fae;
        break;
      case 'tankships':
        color = 0x6636B8;
        break;
      case 'cargo_ships':
        color = 0x444EB4;
        break;
      case 'passenger_ships':
        color = 0x3B95F2;
        break;
      case 'sailing_vessels':
        color = 0x3DA8F2;
        break;
      case 'tugboats':
        color = 0x42BCD5;
        break;
      case 'dredgers':
        color = 0x329788;
        break;
      case 'pilot_vessels':
        color = 0x59B154;
        break;
      case 'ekranoplans':
        color = 0x91C74F;
        break;
      case 'towing_vessels':
        color = 0xCEDE40;
        break;
      case 'rescue_vessels':
        color = 0xFBEC42;
        break;
      case 'coast_guard_ships':
        color = 0xF8C132;
        break;
      case 'high-speed_crafts':
        color = 0xF59828;
        break;
      case 'others':
        color = 0xF4551E;
        break;
    }
    return color;
  }


  updateData(data) {
    this.progress = data.t;
    this.currentFrame = Math.round(this.progress * this.trackLength);
    this.setState({data});
    this.updateDebug();
  }

  render() {
    const {data} = this.state;
    if (this.pathLayer) this.pathLayer.visible = data.showPath;
    if (this.boundsLayer) this.boundsLayer.visible = data.showBounds;

    return (
      <div className={'wrapper'}>
        <div className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}></div>
        <DatGui data={data} onUpdate={this.update}>
          <DatNumber path='t' label='t' min={0} max={1} step={0.01}/>
          <DatNumber path='frame' label='frame'/>
          <DatBoolean path='showPath' label='showPath'/>
          <DatBoolean path='showBounds' label='showBounds'/>
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

export default connect(mapStateToProps, {})(VTPlayerFinal);

// ——————————————————————————————————————————————————
// test optimize ...
// ——————————————————————————————————————————————————

// getRotation(aisPosition) {
//   let rotation = 0;
//   if (aisPosition['hdg'] !== 511) {
//     rotation = aisPosition['hdg']
//   } else {
//     if (aisPosition['cog'] === 0 || aisPosition['cog'] === 360) {
//       rotation = 360;
//     } else {
//       rotation = aisPosition['cog'];
//     }
//   }
//   return rotation
// }
//
// getDistance(trackPoint_1, trackPoint_2) {
//   const v1 = new Vector2(trackPoint_1['lat'], trackPoint_1['lon']);
//   const v2 = new Vector2(trackPoint_2['lat'], trackPoint_2['lon']);
//   return Vector2.getDistance(v1, v2);
// }
//
// optimizeTrackData(_vesselData) {
//   // console.log('optimize', _vesselData['mmsi'])
//
//   let intersected = [];
//   for (let i = 0; i < _vesselData['trackData'].length - 1; i++) {
//
//     const currentTrackPoint = _vesselData['trackData'][i];
//     const nextTrackPoint = _vesselData['trackData'][i + 1];
//
//     // debug!
//     // console.log(this.getDistance(currentTrackPoint, nextTrackPoint) > 0.01, i)
//
//     // check for intersections
//     for (let b = 0; b < this.collisionBounds.length; b++) {
//       if (VTPlayerFinalUtils.isInBounds(currentTrackPoint, this.collisionBounds[b])) {
//         const collisionBounds = this.collisionBounds[b];
//         const line_start = VTPlayerFinalUtils.getVectorFromGeoPoint(currentTrackPoint.lat, currentTrackPoint.lon);
//         const line_end = VTPlayerFinalUtils.getVectorFromGeoPoint(nextTrackPoint.lat, nextTrackPoint.lon);
//         const intersecting = VTPlayerFinalUtils.lineIntersecting(collisionBounds.collisionLineStart, collisionBounds.collisionLineEnd, line_start, line_end);
//         if (intersecting) {
//           // console.log('intersected', _vesselData['mmsi'], Vector2.getDistance(collisionBounds.collisionLineStart, intersecting));
//           intersected.push({
//             index: i,
//             intersecting: intersecting,
//             type: collisionBounds.type || 1,
//             bounds: collisionBounds,
//             crossDistance: Vector2.getDistance(collisionBounds.collisionLineStart, intersecting)
//           });
//         }
//       }
//     }
//
//   }
//
//   // handle intersected
//   // maybe offset points parallel to intersecting trackLine ...
//   let minDistance = 5; // = 15m (4K projected 1m = .333px)
//   if (intersected.length > 0) {
//     let io = {};
//     for (let j = 0; j < intersected.length; j++) {
//       io = intersected[j];
//       const v1 = VTPlayerFinalUtils.getVectorFromGeoPoint(_vesselData['trackData'][io.index].lat, _vesselData['trackData'][io.index].lon);
//       const v2 = VTPlayerFinalUtils.getVectorFromGeoPoint(_vesselData['trackData'][io.index + 1].lat, _vesselData['trackData'][io.index + 1].lon);
//       VTPlayerFinalUtils.plotPoint(this.boundsLayer, v1, 0xffffff);
//       VTPlayerFinalUtils.plotPoint(this.boundsLayer, v2, 0xffffff);
//
//
//       // console.log('=>', io);
//       const lineIntersectStart = Vector2.subtract(io.bounds.collisionLineStart, io.intersecting)
//       let collision_dir = new Vector2();
//
//       // ——————————————————————————————————————————————————
//       // offset points 90° =>  to origin line
//       // ——————————————————————————————————————————————————
//
//       if (io.type === 1) {
//         collision_dir = lineIntersectStart.normalize();
//       }
//
//       // ——————————————————————————————————————————————————
//       // offset points => cross line direction
//       // ——————————————————————————————————————————————————
//
//       // if (io.type === 2) {
//       //   collision_dir = Vector2.subtract(io.bounds.collisionLineStart, io.bounds.collisionLineEnd).normalize();
//       // }
//       //
//       // if (io.type === 3) {
//       //   const line_dir = Vector2.subtract(v1, v2).normalize();
//       //   // cross-product
//       //   collision_dir = new Vector2(-line_dir.y, line_dir.x);
//       //   if (Vector2.getAngleRAD(line_dir) < 0) collision_dir.negate();
//       // }
//
//       // ——————————————————————————————————————————————————
//       // do nothing!
//       // ——————————————————————————————————————————————————
//
//       if (io.type === 0) {
//         console.log('spdm')
//         return
//       }
//
//
//       const v1_new = v1.add(collision_dir.multiplyScalar(io.crossDistance + minDistance));
//       const v2_new = v2.add(collision_dir.normalize().multiplyScalar(io.crossDistance + minDistance));
//
//       VTPlayerFinalUtils.plotPoint(this.boundsLayer, v1_new, 0x00ff00);
//       VTPlayerFinalUtils.plotPoint(this.boundsLayer, v2_new, 0x00ff00);
//
//       // convert back from cartesian to lat/long
//       const newGeoPoint1 = VTPlayerFinalUtils.geoFromCartesian(v1_new.x, v1_new.y);
//       const newGeoPoint2 = VTPlayerFinalUtils.geoFromCartesian(v2_new.x, v2_new.y);
//
//       // overwrite old geo-coordinates
//       _vesselData['trackData'][io.index].lat = newGeoPoint1[0];
//       _vesselData['trackData'][io.index].lon = newGeoPoint1[1];
//       _vesselData['trackData'][io.index + 1].lat = newGeoPoint2[0];
//       _vesselData['trackData'][io.index + 1].lon = newGeoPoint2[1];
//     }
//   }
// }
//
// correctRotationTrackData(_vesselData) {
//
//   // console.log('=== correctRotationTrackData ===', _vesselData['mmsi']);
//
//   let startReplace = 0;
//   let endReplace = 0;
//   let setAtStart = false;
//   let lastValidRotation = 0;
//   let _tempRotationBeforeMoored = 0;
//
//   for (let i = 0; i < _vesselData['trackData'].length; i++) {
//
//     const currentTrackPoint = _vesselData['trackData'][i];
//     const currentRotation = this.getRotation(currentTrackPoint);
//     const nextTrackPoint = (i < _vesselData['trackData'].length - 1) ? _vesselData['trackData'][i + 1] : null;
//     const nextRotation = nextTrackPoint != null ? this.getRotation(nextTrackPoint) : null;
//
//     if (currentRotation !== 360) {
//       lastValidRotation = currentRotation;
//     }
//     _vesselData['trackData'][i]['rot'] = lastValidRotation;
//
//
//     if (nextRotation != null) {
//
//       // if rotation at start == zero => fill with next valid value
//       if (currentRotation === 360 && nextRotation === 360 && !setAtStart && i === 0) {
//         setAtStart = true;
//         startReplace = i;
//       }
//
//       if (nextRotation !== 360 && setAtStart) {
//         endReplace = i;
//         for (let j = startReplace; j < endReplace + 1; j++) {
//           _vesselData['trackData'][j]['rot'] = nextRotation;
//         }
//         setAtStart = false;
//       }
//
//       // if next zero => replace with latest valid
//       if (nextRotation === 360) _vesselData['trackData'][i + 1]['rot'] = lastValidRotation;
//
//
//       if (currentTrackPoint['status'] !== 'moored' && nextTrackPoint['status'] === 'moored') {
//         _tempRotationBeforeMoored = currentRotation;
//       }
//
//       if (currentTrackPoint['status'] === 'moored' && nextTrackPoint['status'] === 'moored') {
//         if (_tempRotationBeforeMoored !== 0) _vesselData['trackData'][i]['rot'] = _tempRotationBeforeMoored;
//
//       }
//
//       if (currentTrackPoint['status'] === 'moored' && nextTrackPoint['status'] !== 'moored') {
//         _tempRotationBeforeMoored = 0;
//         _vesselData['trackData'][i]['rot'] = currentRotation;
//       }
//
//     }
//
//
//   }
//
// }
