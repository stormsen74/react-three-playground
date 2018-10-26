import React from 'react';
import connect from "react-redux/es/connect/connect";
import 'gsap/TweenMax';
import 'gsap/TimelineMax';
import 'react-dat-gui/build/react-dat-gui.css';
import DatGui, {DatBoolean, DatButton, DatNumber} from 'react-dat-gui';
import * as PIXI from 'pixi.js'
import CloseIcon from 'core/icons/close.inline.svg';
import '../Scene.scss'
import {Vector2} from "../../../utils/vector2";


import vesselTrackerRange from 'components/samples/hafen/images/ProtoRangeOrigin.png';
import VTPlayerUtils from "./utils/VTPlayerUtils";

const trackData = require("./trackData/10_26_16_49_l20_vesselData.json");
const infoTrack = require("./trackData/10_26_16_49_l20_infoTrack.json");


const DEVELOPMENT = process.env.NODE_ENV === 'development';

class VTPlayer extends React.Component {

  state = {
    data: {
      package: 'react-dat-gui',
      progress: 0,
      showPath: true,
      showBounds: true,
      showStatic: true,
      showInfo: false,
      feelsLike: '#2FA1D6'
    }
  };

  update = data => this.updateData(data);

  constructor(props) {
    super(props);

    this.loadReady = this.loadReady.bind(this);
    this.playTimeline = this.playTimeline.bind(this);
    this.pauseTimeline = this.pauseTimeline.bind(this);

    this.trackLength = 20;
    console.log(infoTrack)

  }

  componentDidMount() {
    this.initialLoad();
  }

  initialLoad() {
    PIXI.loader.add(vesselTrackerRange).load(this.loadReady);
  }

  loadReady() {
    this.initStage();

    this.mapLayer = new PIXI.Container();
    this.mapLayer.interactive = true;
    this.boundsLayer = new PIXI.Container();
    this.pathLayer = new PIXI.Container();
    this.vesselLayer = new PIXI.Container();
    this.staticVesselLayer = new PIXI.Container();
    this.statsLayer = new PIXI.Container();
    this.statsLayer.y = 1080 - 220;
    this.statsLinesLayer = new PIXI.Container();
    this.statsLinesLayer.y = this.statsLayer.y + 13;

    if (this.statsLayer && this.statsLinesLayer) {
      this.statsLayer.visible = this.statsLinesLayer.visible = this.state.data.showInfo
    }


    let sprite = new PIXI.Sprite(PIXI.loader.resources[vesselTrackerRange].texture);
    this.mapLayer.addChild(sprite);
    this.mapLayer.on('click', (e) => {
      // its not really accurate for drawing polygons
      // https://www.scribblemaps.com/
      const point = this.app.renderer.plugins.interaction.mouse.global;
      console.log(VTPlayerUtils.geoFromCartesian(point.x, point.y))
    });

    this.mapLayer.cacheAsBitmap = true;
    this.pathLayer.cacheAsBitmap = true;

    this.app.stage.addChild(this.mapLayer);
    this.app.stage.addChild(this.boundsLayer);
    this.app.stage.addChild(this.pathLayer);
    this.app.stage.addChild(this.staticVesselLayer);
    this.app.stage.addChild(this.vesselLayer);
    this.app.stage.addChild(this.statsLayer);
    this.app.stage.addChild(this.statsLinesLayer);


    this.collisionBounds = [
      {
        index: 0,
        minLong: 9.949696544325088,
        maxLong: 9.953972099880643,
        minLat: 53.54292959464058,
        maxLat: 53.53781868981334,
        collisionLineStart: VTPlayerUtils.getVectorFromGeoPoint(53.540694, 9.951064),
        collisionLineEnd: VTPlayerUtils.getVectorFromGeoPoint(53.540894, 9.954155)
      },
      {
        index: 1,
        minLong: 9.951390,
        maxLong: 9.955178025806568,
        minLat: 53.539734,
        maxLat: 53.53755770742224,
        collisionLineStart: VTPlayerUtils.getVectorFromGeoPoint(53.538943, 9.952549),
        collisionLineEnd: VTPlayerUtils.getVectorFromGeoPoint(53.538745, 9.954598)
      },
      {
        index: 2,
        minLong: 9.932996296296295,
        maxLong: 9.938879753644025,
        minLat: 53.54105922150139,
        maxLat: 53.53781868981334,
        collisionLineStart: VTPlayerUtils.getVectorFromGeoPoint(53.53964556655106, 9.934604198088469),
        collisionLineEnd: VTPlayerUtils.getVectorFromGeoPoint(53.539254092964406, 9.937783457347729)
      },
      {
        index: 3,
        minLong: 9.966835310872396,
        maxLong: 9.9716590145761,
        minLat: 53.5259657392189,
        maxLat: 53.52300793812268,
        collisionLineStart: VTPlayerUtils.getVectorFromGeoPoint(53.524965306055954, 9.970416544325087),
        collisionLineEnd: VTPlayerUtils.getVectorFromGeoPoint(53.52376913809082, 9.968077777777777)
      },
      {
        index: 4,
        minLong: 9.955506914695457,
        maxLong: 9.961207655436198,
        minLat: 53.52716190917516,
        maxLat: 53.52398662208932,
        collisionLineStart: VTPlayerUtils.getVectorFromGeoPoint(53.526096230414446, 9.95748024802879),
        collisionLineEnd: VTPlayerUtils.getVectorFromGeoPoint(53.52466082726338, 9.957516792353877)
      },
      {
        index: 5,
        minLong: 9.96731037037037,
        maxLong: 9.97059925925926,
        minLat: 53.54338631382501,
        maxLat: 53.54064599871843,
        collisionLineStart: VTPlayerUtils.getVectorFromGeoPoint(53.54203790546803, 9.96880864420573),
        collisionLineEnd: VTPlayerUtils.getVectorFromGeoPoint(53.54079823911029, 9.969247162724248)
      },
      {
        index: 6,
        minLong: 9.953277777777778,
        maxLong: 9.958064940502025,
        minLat: 53.53288177258312,
        maxLat: 53.5291410243136,
        collisionLineStart: VTPlayerUtils.getVectorFromGeoPoint(53.53179434661724, 9.955214570131655),
        collisionLineEnd: VTPlayerUtils.getVectorFromGeoPoint(53.53061992585727, 9.957991851851851)
      },
      {
        index: 7,
        minLong: 9.952912347909432,
        maxLong: 9.958868888888889,
        minLat: 53.53629629286376,
        maxLat: 53.53242505339869,
        collisionLineStart: VTPlayerUtils.getVectorFromGeoPoint(53.53425193013641, 9.955324199761284),
        collisionLineEnd: VTPlayerUtils.getVectorFromGeoPoint(53.53401269694161, 9.957626421983507)
      }
    ];


    VTPlayerUtils.plotCollisionBounds(this.collisionBounds[0], this.boundsLayer);
    VTPlayerUtils.plotCollisionBounds(this.collisionBounds[1], this.boundsLayer);
    VTPlayerUtils.plotCollisionBounds(this.collisionBounds[2], this.boundsLayer);
    VTPlayerUtils.plotCollisionBounds(this.collisionBounds[3], this.boundsLayer);
    VTPlayerUtils.plotCollisionBounds(this.collisionBounds[4], this.boundsLayer);
    VTPlayerUtils.plotCollisionBounds(this.collisionBounds[5], this.boundsLayer);
    VTPlayerUtils.plotCollisionBounds(this.collisionBounds[6], this.boundsLayer);
    VTPlayerUtils.plotCollisionBounds(this.collisionBounds[7], this.boundsLayer);

    this.initTimeline();
    this.parseTrackData(trackData);
    this.parseStaticData(trackData);

    this.show();
  }


  show() {
    TweenMax.to(this.canvasWrapper, .5, {delay: .25, opacity: 1, ease: Cubic.easeIn});
  }

  initInfo() {
    let shape = new PIXI.Graphics();
    shape.beginFill(0x000000, .85);
    // shape.lineStyle(.5, 0x000000);
    shape.drawRect(0, 0, 230, 220);
    shape.endFill();
    this.statsLayer.addChild(shape);

    for (let i = 0; i < VTPlayerUtils.vesselTypes.length; i++) {
      let display = new PIXI.Text(VTPlayerUtils.vesselTypes[i], {fontFamily: 'Tahoma', fontSize: 12, fill: this.getColorByType(VTPlayerUtils.vesselTypes[i]), align: 'center'});
      display.x = 10;
      display.y = 5 + i * 15;
      this.statsLayer.addChild(display);
    }

    this.getInfoFrame(0);
  }

  initStage() {
    this.app = new PIXI.Application({
        width: VTPlayerUtils.mapData.size.width,
        height: VTPlayerUtils.mapData.size.height,
        antialias: true,    // default: false
        transparent: false, // default: false
        resolution: 1       // default: 1
      }
    );

    this.app.view.id = 'pixi-app-view';
    this.canvasWrapper.appendChild(this.app.view);

  }

  getInfoFrame(frame) {
    // console.log(infoTrack[frame]['vesselTypes'])

    if (!this.state.data.showInfo) return;

    for (let i = 0; i < this.statsLinesLayer.children.length; i++) {
      this.statsLinesLayer.children[i].destroy();
    }
    this.statsLinesLayer.removeChildren(0, this.statsLinesLayer.children.length);

    for (let i = 0; i < VTPlayerUtils.vesselTypes.length; i++) {
      const count = infoTrack[frame]['vesselTypes'][i];
      VTPlayerUtils.plotLine(this.statsLinesLayer, new Vector2(120, i * 15), new Vector2(120 + count * 2, i * 15), this.getColorByType(VTPlayerUtils.vesselTypes[i]), 5)
    }
  }

  initTimeline() {
    this.vesselTimeline = new TimelineMax({
      onUpdate: () => {
        const currentFrame = Math.round(this.vesselTimeline.progress() * (this.trackLength - 1));
        this.getInfoFrame(currentFrame);
        this.setState({
          data: {
            ...this.state.data,
            progress: this.vesselTimeline.progress()
          }
        })
      },
      onUpdateScope: this,
      onComplete: () => {
      },
      onCompleteScope: this,
      paused: true
    });
  }


  getDistance(trackPoint_1, trackPoint_2) {
    const v1 = new Vector2(trackPoint_1['lat'], trackPoint_1['lon']);
    const v2 = new Vector2(trackPoint_2['lat'], trackPoint_2['lon']);
    return Vector2.getDistance(v1, v2);
  }


  optimizeTrackData(_vesselData) {
    // console.log('optimize', _vesselData['mmsi'])

    let intersected = [];
    for (let i = 0; i < _vesselData['trackData'].length - 1; i++) {

      const currentTrackPoint = _vesselData['trackData'][i];
      const nextTrackPoint = _vesselData['trackData'][i + 1];

      // debug!
      // console.log(this.getDistance(currentTrackPoint, nextTrackPoint) > 0.01, i)

      // check for intersections
      for (let b = 0; b < this.collisionBounds.length; b++) {
        if (VTPlayerUtils.isInBounds(currentTrackPoint, this.collisionBounds[b])) {
          const collisionBounds = this.collisionBounds[b];
          const line_start = VTPlayerUtils.getVectorFromGeoPoint(currentTrackPoint.lat, currentTrackPoint.lon);
          const line_end = VTPlayerUtils.getVectorFromGeoPoint(nextTrackPoint.lat, nextTrackPoint.lon);
          const intersecting = VTPlayerUtils.lineIntersecting(collisionBounds.collisionLineStart, collisionBounds.collisionLineEnd, line_start, line_end);
          if (intersecting) {
            console.log('intersected', _vesselData['mmsi'], Vector2.getDistance(collisionBounds.collisionLineStart, intersecting))
            intersected.push({
              index: i,
              bounds: collisionBounds,
              crossDistance: Vector2.getDistance(collisionBounds.collisionLineStart, intersecting)
            });
          }
        }
      }

    }

    // handle intersected
    // maybe offset points parallel to intersecting trackLine ...
    let minDistance = 5; // = 15m (4K projected 1m = .333px)
    if (intersected.length > 0) {
      let io = {};
      for (let j = 0; j < intersected.length; j++) {
        io = intersected[j];
        const v1 = VTPlayerUtils.getVectorFromGeoPoint(_vesselData['trackData'][io.index].lat, _vesselData['trackData'][io.index].lon);
        const v2 = VTPlayerUtils.getVectorFromGeoPoint(_vesselData['trackData'][io.index + 1].lat, _vesselData['trackData'][io.index + 1].lon);
        VTPlayerUtils.plotPoint(this.boundsLayer, v1, 0xffffff);
        VTPlayerUtils.plotPoint(this.boundsLayer, v2, 0xffffff);

        // ——————————————————————————————————————————————————
        // offset points 90° =>  to origin line
        // ——————————————————————————————————————————————————
        const line_dir = Vector2.subtract(v1, v2).normalize();
        const collision_dir = new Vector2(-line_dir.y, line_dir.x);
        // console.log(Vector2.getAngleRAD(line_dir))
        if (Vector2.getAngleRAD(line_dir) < 0) collision_dir.negate();

        // ——————————————————————————————————————————————————
        // offset points => cross line direction
        // ——————————————————————————————————————————————————
        // const collision_dir = Vector2.subtract(io.bounds.collisionLineStart, io.bounds.collisionLineEnd).normalize();

        const v1_new = v1.add(collision_dir.multiplyScalar(io.crossDistance + minDistance));
        const v2_new = v2.add(collision_dir.normalize().multiplyScalar(io.crossDistance + minDistance));

        VTPlayerUtils.plotPoint(this.boundsLayer, v1_new, 0x00ff00);
        VTPlayerUtils.plotPoint(this.boundsLayer, v2_new, 0x00ff00);

        // convert back from cartesian to lat/long
        const newGeoPoint1 = VTPlayerUtils.geoFromCartesian(v1_new.x, v1_new.y);
        const newGeoPoint2 = VTPlayerUtils.geoFromCartesian(v2_new.x, v2_new.y);

        // overwrite old geo-coordinates
        _vesselData['trackData'][io.index].lat = newGeoPoint1[0];
        _vesselData['trackData'][io.index].lon = newGeoPoint1[1];
        _vesselData['trackData'][io.index + 1].lat = newGeoPoint2[0];
        _vesselData['trackData'][io.index + 1].lon = newGeoPoint2[1];
      }
    }
  }

  parseTrackData(_data) {
    let validCounter = 0;
    let range = {
      start: 0,
      end: 60,
      _count: 0
    };

    // TODO => SAVE ONLY MOVED VESSELS TO POOL!
    console.log(_data.vesselPool.length)

    for (let i = 0; i < _data.vesselPool.length; i++) {

      let hasMoved = _data.vesselPool[i]['hasMoved'];

      if (hasMoved) {
        if (validCounter >= range.start) {
          if (validCounter < range.end) {
            this.optimizeTrackData(_data.vesselPool[i]);
            this.initVessel(_data.vesselPool[i], validCounter);
            range._count++;
          }
        }
        validCounter++;
      }
    }

    console.log('valid vessels: ', validCounter);
  }


  plotStaticVessel(_vesselData) {
    let vessel = new PIXI.Container();
    let vesselGraphics = new PIXI.Graphics();
    const vesselType = _vesselData['aisStatic']['type'];
    const vesselColor = this.getColorByType(vesselType);
    vesselGraphics.beginFill(vesselColor);
    vesselGraphics.drawCircle(0, 0, 2);
    vesselGraphics.endFill();
    vessel.addChild(vesselGraphics);

    let position = VTPlayerUtils.cartesianFromLatLong(_vesselData['aisPosition'].lat, _vesselData['aisPosition'].lon);
    vessel.x = position[0];
    vessel.y = position[1];
    this.staticVesselLayer.addChild(vessel);

    vessel.data = _vesselData;
    vessel.interactive = true;
    vessel.cursor = 'pointer';
    vessel.on('click', (event) => {
      console.log(event.target.data);
    });
  }

  parseStaticData(_data) {
    const staticVessels = _data['meta']['staticVessels'];
    for (let i = 0; i < staticVessels.length; i++) {
      this.plotStaticVessel(staticVessels[i])
    }
  }


  initVessel(_vesselData, _count) {

    let vessel = new PIXI.Container();
    let vesselGraphics = new PIXI.Graphics();
    const vesselType = _vesselData['aisStatic']['type'];
    const vesselColor = this.getColorByType(vesselType);
    // if (_vesselData['mmsi'] == 211437270) vesselColor = 0xf3d611;
    vesselGraphics.beginFill(vesselColor);
    vesselGraphics.drawCircle(0, 0, 3);
    vesselGraphics.endFill();
    vessel.addChild(vesselGraphics);
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
    for (let i = 0; i < _vesselData['trackData'].length - 1; i++) {
      let pointColor = 0x000000;
      let currentTrackPoint = _vesselData['trackData'][i];
      let nextTrackPoint = _vesselData['trackData'][i + 1];
      let currentPosition = VTPlayerUtils.cartesianFromLatLong(currentTrackPoint.lat, currentTrackPoint.lon);
      parsedTrack[i] = {x: currentPosition[0], y: currentPosition[1], status: _vesselData['trackData'].status};

      // plot points
      VTPlayerUtils.plotPoint(this.pathLayer, new Vector2(currentPosition[0], currentPosition[1]), pointColor, 1);

      // plot path
      VTPlayerUtils.plotLine(this.pathLayer,
        VTPlayerUtils.getVectorFromGeoPoint(currentTrackPoint.lat, currentTrackPoint.lon),
        VTPlayerUtils.getVectorFromGeoPoint(nextTrackPoint.lat, nextTrackPoint.lon),
        0x136c0e
      );

    }

    vessel.x = parsedTrack[0].x;
    vessel.y = parsedTrack[0].y;

    let trackTween = TweenMax.to(vessel, this.trackLength, {
      bezier: {
        curviness: 1,
        type: 'thru',
        values: parsedTrack,
        autoRotate: false
      },
      ease: Power0.easeNone
    });


    this.vesselTimeline.add(trackTween, '0')
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


  playTimeline() {
    this.vesselTimeline.play();
  }

  pauseTimeline() {
    this.vesselTimeline.pause();
  }

  updateData(data) {
    this.vesselTimeline.progress(data.progress);
    this.setState({data})
  }

  render() {
    const {data} = this.state;
    if (this.pathLayer) this.pathLayer.visible = data.showPath;
    if (this.boundsLayer) this.boundsLayer.visible = data.showBounds;
    if (this.staticVesselLayer) this.staticVesselLayer.visible = data.showStatic;
    if (this.statsLayer && this.statsLinesLayer) this.statsLayer.visible = this.statsLinesLayer.visible = data.showInfo;
    if (data.showInfo && this.statsLayer.children.length == 0) this.initInfo();

    return (
      <div className={'wrapper'}>
        <div className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}></div>
        <DatGui data={data} onUpdate={this.update}>
          <DatNumber path='progress' label='progress' min={0} max={1} step={0.01}/>
          <DatButton label="Play" onClick={this.playTimeline}/>
          <DatButton label="Pause" onClick={this.pauseTimeline}/>
          <DatBoolean path='showPath' label='showPath'/>
          <DatBoolean path='showBounds' label='showBounds'/>
          <DatBoolean path='showStatic' label='showStatic'/>
          <DatBoolean path='showInfo' label='showInfo'/>
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

export default connect(mapStateToProps, {})(VTPlayer);

