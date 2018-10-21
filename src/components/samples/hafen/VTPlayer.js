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


import vesselTrackerRange from 'components/samples/hafen/images/ProtoRangeOrigin.png';
import VTPlayerUtils from "./utils/VTPlayerUtils";

const trackData = require("./trackData/blob240.json");


const DEVELOPMENT = process.env.NODE_ENV === 'development';

class VTPlayer extends React.Component {

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
    this.playTimeline = this.playTimeline.bind(this);
    this.pauseTimeline = this.pauseTimeline.bind(this);

    this.trackLength = 65;

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
    this.app.stage.addChild(this.vesselLayer);


    this.collisionBounds = [
      {
        index: 0,
        minLong: 9.94979,
        maxLong: 9.95385,
        minLat: 53.54188,
        maxLat: 53.53949,
        collisionLineStart: VTPlayerUtils.getVectorFromGeoPoint(53.540694, 9.951064),
        collisionLineEnd: VTPlayerUtils.getVectorFromGeoPoint(53.540894, 9.954155)
      },
      {
        index: 1,
        minLong: 9.951390,
        maxLong: 9.953890,
        minLat: 53.539734,
        maxLat: 53.537987,
        collisionLineStart: VTPlayerUtils.getVectorFromGeoPoint(53.538943, 9.952549),
        collisionLineEnd: VTPlayerUtils.getVectorFromGeoPoint(53.538745, 9.954598)
      }
    ];


    VTPlayerUtils.plotCollisionBounds(this.collisionBounds[0], this.boundsLayer);
    VTPlayerUtils.plotCollisionBounds(this.collisionBounds[1], this.boundsLayer);

    this.initTimeline();
    this.parseTrackData(trackData);


    this.show();
  }


  show() {
    TweenMax.to(this.canvasWrapper, .5, {delay: .25, opacity: 1, ease: Cubic.easeIn});
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

  initTimeline() {
    this.vesselTimeline = new TimelineMax({
      onUpdate: () => {
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


  optimizeTrackData(_vesselData) {
    // console.log('optimize', _vesselData['mmsi'])

    let intersected = [];
    for (let i = 0; i < _vesselData['trackData'].length; i++) {

      const currentTrackPoint = _vesselData['trackData'][i];
      const nextTrackPoint = _vesselData['trackData'][i + 1];

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
        const pos1 = VTPlayerUtils.cartesianFromLatLong(_vesselData['trackData'][io.index].lat, _vesselData['trackData'][io.index].lon);
        const pos2 = VTPlayerUtils.cartesianFromLatLong(_vesselData['trackData'][io.index + 1].lat, _vesselData['trackData'][io.index + 1].lon);
        const v1 = new Vector2(pos1[0], pos1[1]);
        const v2 = new Vector2(pos2[0], pos2[1]);
        const collision_dir = Vector2.subtract(io.bounds.collisionLineStart, io.bounds.collisionLineEnd).normalize();
        const v1_new = v1.add(collision_dir.multiplyScalar(io.crossDistance + minDistance));
        const v2_new = v2.add(collision_dir.normalize().multiplyScalar(io.crossDistance + minDistance));

        // VTPlayerUtils.plotPoint(this.pathLayer, pos1, 0xff0000);
        // VTPlayerUtils.plotPoint(this.pathLayer, pos2, 0xff0000);

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
      end: 95,
      _count: 0
    };

    for (let i = 0; i < _data.vesselPool.length; i++) {

      let hasMoved = _data.vesselPool[i]['hasMoved'];
      let inMapRange = _data.vesselPool[i]['inMapRange'];
      let validData = _data.vesselPool[i]['valid'];
      validData = true;

      if (hasMoved && inMapRange && validData) {
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


  initVessel(_vesselData, _count) {

    let vessel = new PIXI.Container();
    let display = new PIXI.Text(_vesselData['mmsi'], {fontFamily: 'Segoe UI', fontSize: 10, fill: 0xff0000, align: 'center'});
    let vesselGraphics = new PIXI.Graphics();
    vesselGraphics.beginFill(0x1f164f);
    vesselGraphics.drawCircle(0, 0, 2);
    // vesselGraphics.drawPolygon([0, -5, 4, 5, -4, 5]);
    vesselGraphics.endFill();

    vessel.addChild(vesselGraphics);
    if (!_vesselData['valid']) {
      vessel.addChild(display);
    }
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
      let pointColor = 0xff0000;
      let currentTrackPoint = _vesselData['trackData'][i];
      let nextTrackPoint = _vesselData['trackData'][i + 1];
      let currentPosition = VTPlayerUtils.cartesianFromLatLong(currentTrackPoint.lat, currentTrackPoint.lon);
      parsedTrack[i] = {x: currentPosition[0], y: currentPosition[1], status: _vesselData['trackData'].status};

      // plot points
      VTPlayerUtils.plotPoint(this.pathLayer, new Vector2(currentPosition[0], currentPosition[1]), pointColor);

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


  // getColorByStatus(status) {
  //   let color = 0x000000;
  //   switch (status) {
  //     case 'moored':
  //       color = 0xff0000;
  //       break;
  //     case 'waiting':
  //       color = 0x0000ff;
  //       break;
  //     case 'moving':
  //       color = 0x00ff00;
  //       break;
  //     case 'lost':
  //       color = 0x2ad2f6;
  //       break;
  //   }
  //   return color;
  // }


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

export default connect(mapStateToProps, {})(VTPlayer);

