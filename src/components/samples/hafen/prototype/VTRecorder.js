import axios from 'axios';
import saveAs from 'file-saver';
import {Vector2} from "../../../../utils/vector2";
import VTRecorderUtils from "../utils/prototype/VTRecorderUtils";
import date from 'date-and-time';

class VTRecorder {

  constructor(_map) {

    this.mapReferenz = _map;

    this.timerData = {
      timeStep: 60,
      currentStep: 0,
      recordLength: 60,
    };

    this.vesselPool = [];
    this.infoTrack = [];
    this.trackLength = 0;

    this.load = this.load.bind(this);

  }


  // ——————————————————————————————————————————————————
  // api - handling
  // ——————————————————————————————————————————————————

  load() {
    this.mapReferenz.restartTimerDisplay();
    this.loadData(this);
  }

  loadData(_this) {
    const url = 'https://api.vesseltracker.com/api/v1/vessels/userpolygon';
    axios.get(url, {
      responseType: 'json',
      headers: {
        'accept': 'application/json',
        'Authorization': 'f780dfde-e181-4c1d-a246-fe9fbd80274c'
      },
    }).then(function (response) {
      _this.vesselPool.length === 0 ? _this.createPool(response.data) : _this.updateData(response.data)
    }).catch(function (error) {
      // handle error
      console.log(error);
    }).then(function () {
      // if error debug!
    });
  }

  // ——————————————————————————————————————————————————
  // record - controls
  // ——————————————————————————————————————————————————

  startRecord() {
    if (!this.recordStep) {
      this.load();
      this.recordStep = window.setInterval(this.load, this.timerData.timeStep * 1000);
    }
  }

  stopRecord() {
    clearInterval(this.recordStep);
    this.recordStep = null;
    this.timerData.currentStep = 0;
    this.vesselPool = [];
    this.infoTrack = [];

    this.mapReferenz.resetTimerDisplay();
    this.mapReferenz.onUpdateTrackerData(this.getValidVessels(this.vesselPool));
  }

  // ——————————————————————————————————————————————————
  // validating methods
  // ——————————————————————————————————————————————————

  getFixed(float) {
    return Number.parseFloat(float.toFixed(6))
  }

  getDistance(trackPoint_1, trackPoint_2) {
    const v1 = new Vector2(trackPoint_1['lat'], trackPoint_1['lon']);
    const v2 = new Vector2(trackPoint_2['lat'], trackPoint_2['lon']);
    return Vector2.getDistance(v1, v2);
  }

  hasMoved(trackData) {
    let distance = 0;

    if (trackData.length > 4) {
      const pathArrayLength = trackData.length;
      // 3 steps => a' 1min
      distance = this.getDistance(trackData[pathArrayLength - 1], trackData[pathArrayLength - 4]);
      // console.log(mmsi, ' 3min distance = ', distance > .00005)
    }

    // 0.00005 ~ 5m
    return distance > .00005;
  }

  inMapRange(lat, lon) {
    return lat < VTRecorderUtils.mapRange.minLat && lat > VTRecorderUtils.mapRange.maxLat && lon > VTRecorderUtils.mapRange.minLong && lon < VTRecorderUtils.mapRange.maxLong;
  }

  getRotation(aisPosition) {
    let rotation = 0;
    if (aisPosition['hdg'] !== 511) {
      rotation = aisPosition['hdg']
    } else {
      if (aisPosition['cog'] === 0 || aisPosition['cog'] === 360) {
        rotation = 360;
      } else {
        rotation = aisPosition['cog'];
      }
    }
    return rotation
  }

  getRotationStatic(trackData) {
    let rotation = 360;
    if (trackData['hdg'] !== 511) {
      rotation = trackData['hdg']
    } else {
      if (trackData['cog'] === 0 || trackData['cog'] === 360) {
        rotation = 360;
      } else {
        rotation = trackData['cog'];
      }
    }
    return rotation
  }

  // ——————————————————————————————————————————————————
  // vesselPool / handling
  // ——————————————————————————————————————————————————

  createVesselData(vesselData) {
    return {
      mmsi: vesselData['aisStatic']['mmsi'],
      status: vesselData['geoDetails']['status'],
      valid: true,
      inMapRange: this.inMapRange(this.getFixed(vesselData['aisPosition']['lat']), this.getFixed(vesselData['aisPosition']['lon'])),
      passedMapRange: this.inMapRange(this.getFixed(vesselData['aisPosition']['lat']), this.getFixed(vesselData['aisPosition']['lon'])),
      hasMoved: false, // => check for delta / in stepRange[5]?

      aisStatic: {
        name: vesselData['aisStatic']['name'],
        flag: vesselData['aisStatic']['flag'],
        type: vesselData['aisStatic']['aisShiptype'],
        length: vesselData['aisStatic']['length'],
        width: vesselData['aisStatic']['width']
      },
      aisPosition: {
        lat: this.getFixed(vesselData['aisPosition']['lat']),
        lon: this.getFixed(vesselData['aisPosition']['lon']),
        sog: vesselData['aisPosition']['sog'],
        cog: vesselData['aisPosition']['cog'],
        hdg: vesselData['aisPosition']['hdg']
      },
      trackData: [
        {
          status: vesselData['geoDetails']['status'],
          lat: this.getFixed(vesselData['aisPosition']['lat']),
          lon: this.getFixed(vesselData['aisPosition']['lon']),
          sog: vesselData['aisPosition']['sog'],
          cog: vesselData['aisPosition']['cog'],
          hdg: vesselData['aisPosition']['hdg']
        }
      ]
    }
  }

  createPool(data) {

    this.trackLength = 1;

    console.log('createPool', data['vessels'][0]);

    for (let i = 0; i < data['numVessels']; i++) {
      this.vesselPool[i] = this.createVesselData(data['vessels'][i])
    }

    this.updateInfoTrack(this.getValidVessels(this.vesselPool));
    this.mapReferenz.onUpdateTrackerData(this.vesselPool, this.vesselPool.length, this.infoTrack);

    console.log(this.vesselPool);
  }

  updatePool(vesselPool, newData) {

    this.trackLength++;

    let updatedVessels = newData['vessels'];

    // update poolData
    for (let i = 0; i < vesselPool.length; i++) {
      const _mmsi = vesselPool[i]['mmsi'];
      let result = updatedVessels.filter(o => {
        return o['aisStatic']['mmsi'] === _mmsi;
      });

      if (result[0]) {
        vesselPool[i]['status'] = result[0]['geoDetails']['status'];
        vesselPool[i]['aisPosition']['lat'] = this.getFixed(result[0]['aisPosition']['lat']);
        vesselPool[i]['aisPosition']['lon'] = this.getFixed(result[0]['aisPosition']['lon']);
        vesselPool[i]['aisPosition']['sog'] = result[0]['aisPosition']['sog'];
        vesselPool[i]['aisPosition']['cog'] = result[0]['aisPosition']['cog'];
        vesselPool[i]['aisPosition']['hdg'] = result[0]['aisPosition']['hdg'];

        vesselPool[i]['trackData'].push(
          {
            status: result[0]['geoDetails']['status'],
            lat: this.getFixed(result[0]['aisPosition']['lat']),
            lon: this.getFixed(result[0]['aisPosition']['lon']),
            sog: result[0]['aisPosition']['sog'],
            cog: result[0]['aisPosition']['cog'],
            hdg: result[0]['aisPosition']['hdg']
          }
        );

        // if movement < (.00003) => set status 'static' => fill position with last position
        // if (vesselPool[i]['trackData'].length >= 1) {
        //   const pathArrayLength = vesselPool[i]['trackData'].length;
        //   const traveledDistance = this.getDistance(vesselPool[i]['trackData'][pathArrayLength - 1], vesselPool[i]['trackData'][pathArrayLength - 2]);
        // if (traveledDistance < .00005 && result[0]['aisPosition']['sog'] <= .3) {
        // if (traveledDistance < .00003) {
        //   vesselPool[i]['status'] = 'static';
        // let lastTrackData = vesselPool[i]['trackData'][pathArrayLength - 2];
        // vesselPool[i]['trackData'][vesselPool[i]['trackData'].length - 1] =
        //   {
        //     status: 'static',
        //     lat: lastTrackData['lat'],
        //     lon: lastTrackData['lon'],
        //     sog: result[0]['aisPosition']['sog'],
        //     cog: result[0]['aisPosition']['cog'],
        //     hdg: result[0]['aisPosition']['hdg']
        //   }
        // }
        // }

        // check => in mapRange
        if (!vesselPool[i]['passedMapRange'] && this.inMapRange(vesselPool[i]['aisPosition']['lat'], vesselPool[i]['aisPosition']['lon'])) vesselPool[i]['passedMapRange'] = true;

        if (this.inMapRange(vesselPool[i]['aisPosition']['lat'], vesselPool[i]['aisPosition']['lon'])) {
          vesselPool[i]['inMapRange'] = true;
        } else {
          vesselPool[i]['inMapRange'] = false;
        }

        // check movement
        if (!vesselPool[i]['hasMoved'] && result[0]['geoDetails']['status'] === 'moving' && this.hasMoved(vesselPool[i]['trackData'])) vesselPool[i]['hasMoved'] = true;


        // check for large distance jumps (unvalid data! => 0.13 ~ 800m)
        if (vesselPool[i]['valid']) {
          if (vesselPool[i]['trackData'].length >= 1) {
            const pathArrayLength = vesselPool[i]['trackData'].length;
            if (this.getDistance(vesselPool[i]['trackData'][pathArrayLength - 1], vesselPool[i]['trackData'][pathArrayLength - 2]) > .01) vesselPool[i]['valid'] = false;
          }
        }


      } else {
        // vessel left pool ...
        let lastTrackData = vesselPool[i]['trackData'][vesselPool[i]['trackData'].length - 1];
        // console.log('vessel left Pool =>', vesselPool[i], lastTrackData);
        vesselPool[i]['status'] = 'lost';
        vesselPool[i]['trackData'].push(
          {
            status: 'lost',
            lat: lastTrackData['lat'],
            lon: lastTrackData['lon'],
            sog: 0,
            cog: lastTrackData['cog'],
            hdg: lastTrackData['hdg']
          }
        );
      }

    }

    // check for new vessels and add
    for (let i = 0; i < updatedVessels.length; i++) {
      let newVessel = null;
      const _mmsi = updatedVessels[i]['aisStatic']['mmsi'];
      let result = vesselPool.filter(o => {
        newVessel = this.createVesselData(updatedVessels[i]);
        return o['mmsi'] === _mmsi;
      });

      if (!result[0]) {
        console.log('addVesselToPool', i, _mmsi, newVessel);
        // fill Trackdata ...
        for (let j = 0; j < this.trackLength - 1; j++) {
          newVessel['trackData'].unshift(
            {
              status: 'filled',
              lat: this.getFixed(newVessel['aisPosition']['lat']),
              lon: this.getFixed(newVessel['aisPosition']['lon']),
              sog: newVessel['aisPosition']['sog'],
              cog: newVessel['aisPosition']['cog'],
              hdg: newVessel['aisPosition']['hdg']
            }
          )
        }

        vesselPool.push(newVessel);

      }

    }

  }

  updateData(data) {

    const numVessels = data['numVessels'];
    console.log('=> ', this.vesselPool.length, numVessels);

    this.updatePool(this.vesselPool, data);


    this.timerData.currentStep++;
    this.mapReferenz.onUpdateTrackerData(this.getValidVessels(this.vesselPool), this.vesselPool.length, this.infoTrack);
    this.updateInfoTrack(this.getValidVessels(this.vesselPool));

    if (this.timerData.currentStep === this.timerData.recordLength - 1) {
      this.saveData();
      this.stopRecord();
    }

  }

  // ——————————————————————————————————————————————————
  // info - track
  // ——————————————————————————————————————————————————

  getLongestVessel(vesselPool) {
    let maxLength = 0;
    let vessel = {mmsi: 0, length: 0};
    for (let i = 0; i < vesselPool.length; i++) {
      const vesselLength = vesselPool[i]['aisStatic']['length'];
      const mmsi = vesselPool[i]['mmsi'];
      if (this.inMapRange(vesselPool[i]['aisPosition']['lat'], vesselPool[i]['aisPosition']['lon']) && vesselLength > maxLength) {
        maxLength = vesselLength;
        vessel.mmsi = mmsi;
        vessel.length = maxLength;
      }
    }
    return vessel
  }

  getFastestVessel(vesselPool) {
    const maxAllowedSpeed = 15;
    let maxSpeed = 0;
    let vessel = {mmsi: 0, speed: 0};
    for (let i = 0; i < vesselPool.length; i++) {
      const vesselSpeed = vesselPool[i]['aisPosition']['sog'];
      const mmsi = vesselPool[i]['mmsi'];
      if (this.inMapRange(vesselPool[i]['aisPosition']['lat'], vesselPool[i]['aisPosition']['lon']) && vesselSpeed < maxAllowedSpeed && vesselSpeed > maxSpeed) {
        maxSpeed = vesselSpeed;
        vessel.mmsi = mmsi;
        vessel.speed = maxSpeed;
      }
    }
    return vessel
  }

  getVesselTypes(vesselPool) {

    let vessel_types = [
      {type: 'pleasure_crafts', count: 0},
      {type: 'tankships', count: 0},
      {type: 'cargo_ships', count: 0},
      {type: 'passenger_ships', count: 0},
      {type: 'sailing_vessels', count: 0},
      {type: 'tugboats', count: 0},
      {type: 'dredgers', count: 0},
      {type: 'pilot_vessels', count: 0},
      {type: 'ekranoplans', count: 0},
      {type: 'towing_vessels', count: 0},
      {type: 'rescue_vessels', count: 0},
      {type: 'coast_guard_ships', count: 0},
      {type: 'high-speed_crafts', count: 0},
      {type: 'others', count: 0}
    ];

    for (let i = 0; i < vesselPool.length; i++) {
      const _type = vesselPool[i]['aisStatic']['type'];

      // for Debug-types take out later ...
      if (
        _type === vessel_types[0].type ||
        _type === vessel_types[1].type ||
        _type === vessel_types[2].type ||
        _type === vessel_types[3].type ||
        _type === vessel_types[4].type ||
        _type === vessel_types[5].type ||
        _type === vessel_types[6].type ||
        _type === vessel_types[7].type ||
        _type === vessel_types[8].type ||
        _type === vessel_types[9].type ||
        _type === vessel_types[10].type ||
        _type === vessel_types[11].type ||
        _type === vessel_types[12].type ||
        _type === vessel_types[13].type) {
      } else {
        console.log('missing type: ', _type)
      }

      for (let j = 0; j < vessel_types.length; j++) {
        if (_type === vessel_types[j].type) {
          vessel_types[j].count++;
        }
      }

    }

    let vesselStatistics = [];
    for (let i = 0; i < vessel_types.length; i++) {
      vesselStatistics[i] = vessel_types[i]['count'];
    }

    // return vessel_types
    return vesselStatistics
  }

  updateInfoTrack(_filteredVesselPool) {
    const vesselTypes = this.getVesselTypes(_filteredVesselPool);
    const longestVessel = this.getLongestVessel(_filteredVesselPool);
    const fastestVessel = this.getFastestVessel(_filteredVesselPool);
    this.infoTrack.push(
      {vesselTypes, longestVessel, fastestVessel}
    );
  }

  // ——————————————————————————————————————————————————
  // filtering / optimizing
  // ——————————————————————————————————————————————————

  getValidVessels(vesselPool) {
    let filteredPool = [];
    for (let i = 0; i < vesselPool.length; i++) {
      const passedMapRange = vesselPool[i]['passedMapRange'];
      const validData = vesselPool[i]['valid'];
      if (passedMapRange && validData) filteredPool.push(vesselPool[i]);
    }
    return filteredPool;
  }

  getMovingVessels(vessels) {
    let movingVessels = [];
    for (let i = 0; i < vessels.length; i++) {
      const hasMoved = vessels[i]['hasMoved'];
      if (hasMoved) {
        const vesselCopy = Object.assign({}, vessels[i]);
        movingVessels.push(vesselCopy);
      }
    }
    return movingVessels;
  }

  getReducedStatic(_vesselData) {
    console.log('reduceStatic', _vesselData['mmsi']);

    let validRotation = 360;
    for (let i = 0; i < _vesselData['trackData'].length; i++) {
      const rot = this.getRotationStatic(_vesselData['trackData'][i])
      if (validRotation === 360 && rot !== 360) {
        validRotation = rot;
        console.log('validRotation', validRotation);
      }
    }

    let vessel = {
      mmsi: _vesselData['mmsi'],
      aisStatic: {
        name: _vesselData['aisStatic']['name'],
        flag: _vesselData['aisStatic']['flag'],
        type: _vesselData['aisStatic']['type'],
        length: _vesselData['aisStatic']['length'],
        width: _vesselData['aisStatic']['width']
      },
      aisPosition: {
        lat: _vesselData['aisPosition']['lat'],
        lon: _vesselData['aisPosition']['lon'],
        rot: validRotation
      },
    };

    return vessel
  }

  getStaticVessels(vessels) {
    let staticVessels = [];
    for (let i = 0; i < vessels.length; i++) {
      const hasMoved = vessels[i]['hasMoved'];
      if (!hasMoved) {
        const vesselCopy = Object.assign({}, vessels[i]);
        const reducedStaticData = this.getReducedStatic(vesselCopy);
        // filter static with invalid 'rot' here ...
        if (reducedStaticData['aisPosition']['rot'] !== 360) staticVessels.push(reducedStaticData);
      }
    }
    return staticVessels;
  }

  optimizePool(vesselPool) {
    for (let i = 0; i < vesselPool.length; i++) {
      const hasMoved = vesselPool[i]['hasMoved'];
      if (hasMoved) this.optimizeTrackData(vesselPool[i]);
      this.correctRotationTrackData(vesselPool[i])
    }
  }

  correctRotationTrackData(_vesselData) {

    // console.log('=== start parse ===', _vesselData['mmsi'], _vesselData['trackData']);

    let startReplace = 0;
    let endReplace = 0;
    let setAtStart = false;
    let _lastValidRotation = 0;
    let _tempRotationBeforeMoored = 0;

    for (let i = 0; i < _vesselData['trackData'].length; i++) {

      const currentTrackPoint = _vesselData['trackData'][i];
      const currentRotation = this.getRotation(currentTrackPoint);
      const nextTrackPoint = (i < _vesselData['trackData'].length - 1) ? _vesselData['trackData'][i + 1] : null;
      const nextRotation = nextTrackPoint != null ? this.getRotation(nextTrackPoint) : null;

      if (currentRotation !== 360) {
        _lastValidRotation = currentRotation;
      }
      _vesselData['trackData'][i]['rot'] = _lastValidRotation;


      if (nextRotation != null) {

        // if rotation at start == zero => fill with next valid value
        if (currentRotation === 360 && nextRotation === 360 && !setAtStart && i === 0) {
          setAtStart = true;
          startReplace = i;
        }

        if (nextRotation !== 360 && setAtStart) {
          endReplace = i;
          for (let j = startReplace; j < endReplace + 1; j++) {
            _vesselData['trackData'][j]['rot'] = nextRotation;
          }
          setAtStart = false;
        }

        // if next zero => replace with latest valid
        if (nextRotation === 360) _vesselData['trackData'][i + 1]['rot'] = _lastValidRotation;


        if (currentTrackPoint['status'] !== 'moored' && nextTrackPoint['status'] === 'moored') {
          _tempRotationBeforeMoored = currentRotation;
        }

        if (currentTrackPoint['status'] === 'moored' && nextTrackPoint['status'] === 'moored') {
          if (_tempRotationBeforeMoored !== 0) _vesselData['trackData'][i]['rot'] = _tempRotationBeforeMoored;

        }

        if (currentTrackPoint['status'] === 'moored' && nextTrackPoint['status'] !== 'moored') {
          _tempRotationBeforeMoored = 0;
          _vesselData['trackData'][i]['rot'] = currentRotation;
        }

      }


    }

  }

  optimizeTrackData(_vesselData) {
    console.log('check bounding', _vesselData['mmsi']);

    let intersected = [];
    for (let i = 0; i < _vesselData['trackData'].length - 1; i++) {

      const currentTrackPoint = _vesselData['trackData'][i];
      const nextTrackPoint = _vesselData['trackData'][i + 1];

      // check for intersections
      for (let b = 0; b < VTRecorderUtils.collisionBounds.length; b++) {
        if (VTRecorderUtils.isInBounds(currentTrackPoint, VTRecorderUtils.collisionBounds[b])) {
          const collisionBounds = VTRecorderUtils.collisionBounds[b];
          const line_start = VTRecorderUtils.getVectorFromGeoPoint(currentTrackPoint.lat, currentTrackPoint.lon);
          const line_end = VTRecorderUtils.getVectorFromGeoPoint(nextTrackPoint.lat, nextTrackPoint.lon);
          const intersecting = VTRecorderUtils.lineIntersecting(collisionBounds.collisionLineStart, collisionBounds.collisionLineEnd, line_start, line_end);
          if (intersecting) {
            console.log('intersected', _vesselData['mmsi'], Vector2.getDistance(collisionBounds.collisionLineStart, intersecting));
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
    let minDistance = 5; // = 15m (4K projected 1m = .333px)
    if (intersected.length > 0) {
      let io = {};
      for (let j = 0; j < intersected.length; j++) {
        io = intersected[j];

        const v1 = VTRecorderUtils.getVectorFromGeoPoint(_vesselData['trackData'][io.index].lat, _vesselData['trackData'][io.index].lon);
        const v2 = VTRecorderUtils.getVectorFromGeoPoint(_vesselData['trackData'][io.index + 1].lat, _vesselData['trackData'][io.index + 1].lon);

        // ——————————————————————————————————————————————————
        // offset points 90° =>  to origin line
        // ——————————————————————————————————————————————————
        const line_dir = Vector2.subtract(v1, v2).normalize();
        const collision_dir = new Vector2(-line_dir.y, line_dir.x);
        if (Vector2.getAngleRAD(line_dir) < 0) collision_dir.negate();

        // ——————————————————————————————————————————————————
        // offset points => cross line direction
        // ——————————————————————————————————————————————————
        // const collision_dir = Vector2.subtract(io.bounds.collisionLineStart, io.bounds.collisionLineEnd).normalize();

        const v1_new = v1.add(collision_dir.multiplyScalar(io.crossDistance + minDistance));
        const v2_new = v2.add(collision_dir.normalize().multiplyScalar(io.crossDistance + minDistance));

        // convert back from cartesian to lat/long
        const newGeoPoint1 = VTRecorderUtils.geoFromCartesian(v1_new.x, v1_new.y);
        const newGeoPoint2 = VTRecorderUtils.geoFromCartesian(v2_new.x, v2_new.y);

        // overwrite old geo-coordinates
        _vesselData['trackData'][io.index].lat = newGeoPoint1[0];
        _vesselData['trackData'][io.index].lon = newGeoPoint1[1];
        _vesselData['trackData'][io.index + 1].lat = newGeoPoint2[0];
        _vesselData['trackData'][io.index + 1].lon = newGeoPoint2[1];
      }
    }
  }

  getReduced(_vesselData) {
    // console.log('reduce', _vesselData)

    let vessel = {
      mmsi: _vesselData['mmsi'],
      // status: _vesselData['status'],
      // valid: _vesselData['valid'],
      // inMapRange: _vesselData['inMapRange'],
      // passedMapRange: _vesselData['passedMapRange'],
      // hasMoved: _vesselData['hasMoved'],

      aisStatic: {
        name: _vesselData['aisStatic']['name'],
        flag: _vesselData['aisStatic']['flag'],
        type: _vesselData['aisStatic']['type'],
        length: _vesselData['aisStatic']['length'],
        width: _vesselData['aisStatic']['width']
      },
      trackData: []
    };


    for (let i = 0; i < _vesselData['trackData'].length; i++) {
      vessel['trackData'][i] = {
        status: _vesselData['trackData'][i]['status'],
        lat: _vesselData['trackData'][i]['lat'],
        lon: _vesselData['trackData'][i]['lon'],
        rot: _vesselData['trackData'][i]['rot'],
        // cog: _vesselData['trackData'][i]['cog'],
        // hdg: _vesselData['trackData'][i]['hdg'],
        // sog: _vesselData['trackData'][i]['sog'],
      }
    }

    return vessel
  }

  reduceTrackData(vessels) {
    let reducedVessels = [];
    for (let i = 0; i < vessels.length; i++) {
      const vesselCopy = Object.assign({}, vessels[i]);
      const reducedData = this.getReduced(vesselCopy);
      reducedVessels.push(reducedData);
    }

    return reducedVessels;
  }

  // ——————————————————————————————————————————————————
  // public methods
  // ——————————————————————————————————————————————————

  getVesselByMMSI(_mmsi) {
    let vessel = null;
    for (let i = 0; i < this.vesselPool.length; i++) {
      if (_mmsi == this.vesselPool[i]['mmsi']) {
        vessel = this.vesselPool[i];
      }
    }
    return vessel;
  }

  // ——————————————————————————————————————————————————
  // save data
  // ——————————————————————————————————————————————————

  saveData(asRawData = false) {

    // const _vesselDataCopy = [...this.vesselPool];
    const _validVessels = this.getValidVessels(this.vesselPool);
    const _movingVessels = this.getMovingVessels(_validVessels);
    const _staticVessels = this.getStaticVessels(_validVessels);
    this.optimizePool(_validVessels);
    const _movingVesselsReduced = this.reduceTrackData(_movingVessels);
    // if (!asRawData) {}

    console.log('filteredPoolLength: ', _validVessels.length);

    let data = {
      meta: {
        timeRange: this.infoTrack.length,
        numVessels: _validVessels.length,
        numStaticVessels: _staticVessels.length,
        numMovingVessels: _validVessels.length - _staticVessels.length,
        staticVessels: _staticVessels,
        infoTrack: this.infoTrack
      },
      // vesselPool: this.vesselPool
      // vesselPool: _movingVessels
      vesselPool: _movingVesselsReduced
    };

    let now = new Date();
    const dateString = date.format(now, 'MM_DD_HH_mm');
    const trackLength = this.infoTrack.length;

    let vesselData = new Blob([JSON.stringify(data)], {type: "application/json"});
    saveAs(vesselData, dateString + "_l" + trackLength + "_vesselData.json");
  }
}


export default VTRecorder



