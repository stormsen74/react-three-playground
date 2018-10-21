import axios from 'axios';
import saveAs from 'file-saver';
import {Vector2} from "../../../utils/vector2";
import VTRecorderUtils from "./VTRecorderUtils";

class VTRecorder {

  constructor(_map) {

    this.mapReferenz = _map;

    this.timerData = {
      timeStep: 30,
      currentStep: 0
    };

    this.vesselPool = [];
    this.trackLength = 0;

    this.load = this.load.bind(this);

  }


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

    this.mapReferenz.resetTimerDisplay();
    this.mapReferenz.onUpdateTrackerData(this.filterVesselPool(this.vesselPool));
  }


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

  createVesselData(vesselData) {
    return {
      mmsi: vesselData['aisStatic']['mmsi'],
      status: vesselData['geoDetails']['status'],
      valid: true,
      inMapRange: this.inMapRange(this.getFixed(vesselData['aisPosition']['lat']), this.getFixed(vesselData['aisPosition']['lon'])), //'check for Bounds'
      // hasMoved: vesselData['geoDetails']['status'] === 'moving' ? true : false,
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

    this.mapReferenz.onUpdateTrackerData(this.vesselPool);

    console.log(this.vesselPool);
  }


  updatePool(vesselPool, newData) {

    this.trackLength++;

    let udatedVessels = newData['vessels'];

    // update poolData
    for (let i = 0; i < vesselPool.length; i++) {
      const _mmsi = vesselPool[i]['mmsi'];
      let result = udatedVessels.filter(o => {
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

        // if movement < (.00002) => set status 'moored' => fill position with last position
        // maybe check for ['sog']?!
        if (vesselPool[i]['trackData'].length >= 1) {
          const pathArrayLength = vesselPool[i]['trackData'].length;
          const traveledDistance = this.getDistance(vesselPool[i]['trackData'][pathArrayLength - 1], vesselPool[i]['trackData'][pathArrayLength - 2]);
          if (traveledDistance < .00005 || result[0]['aisPosition']['sog'] <= .3) {
            // console.log(result[0]['geoDetails']['status'], traveledDistance);
            vesselPool[i]['status'] = 'static';
            let lastTrackData = vesselPool[i]['trackData'][pathArrayLength - 2];
            vesselPool[i]['trackData'][vesselPool[i]['trackData'].length - 1] =
              {
                status: 'static',
                lat: lastTrackData['lat'],
                lon: lastTrackData['lon'],
                sog: result[0]['aisPosition']['sog'],
                cog: result[0]['aisPosition']['cog'],
                hdg: result[0]['aisPosition']['hdg']
              }
          }
        }

        // check => in mapRange
        if (!vesselPool[i]['inMapRange'] && this.inMapRange(vesselPool[i]['aisPosition']['lat'], vesselPool[i]['aisPosition']['lon'])) vesselPool[i]['inMapRange'] = true;

        // check movement
        if (!vesselPool[i]['hasMoved'] && result[0]['geoDetails']['status'] == 'moving' && this.hasMoved(vesselPool[i]['trackData'])) vesselPool[i]['hasMoved'] = true;


        // check for large distance jumps (unvalid data!)
        if (vesselPool[i]['valid']) {
          if (vesselPool[i]['trackData'].length >= 1) {
            const pathArrayLength = vesselPool[i]['trackData'].length;
            if (this.getDistance(vesselPool[i]['trackData'][pathArrayLength - 1], vesselPool[i]['trackData'][pathArrayLength - 2]) > .02) vesselPool[i]['valid'] = false;
          }
        }


      } else {
        // vessel left pool ...
        let lastTrackData = vesselPool[i]['trackData'][vesselPool[i]['trackData'].length - 1];
        console.log('vessel left Pool =>', vesselPool[i], lastTrackData);
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
    for (let i = 0; i < udatedVessels.length; i++) {
      let newVessel = null;
      const _mmsi = udatedVessels[i]['aisStatic']['mmsi'];
      let result = vesselPool.filter(o => {
        newVessel = this.createVesselData(udatedVessels[i]);
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

    // console.log(vesselPool)
    const _filteredVesselPool = this.filterVesselPool(this.vesselPool);
    this.getVesselTypes(_filteredVesselPool)


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

    console.log(vessel_types)
  }

  updateData(data) {
    // console.log('timeCreated', data['timeCreated'])
    // console.log('numVessels', data['numVessels'])
    // console.log(data['vessels'][0])
    // console.log(data['vessels'][0]['aisStatic'])
    // console.log(data['vessels'][0]['aisPosition']['lon'])


    let numVessels = data['numVessels'];

    console.log('=> ', this.vesselPool.length, numVessels);


    this.updatePool(this.vesselPool, data);

    this.timerData.currentStep++;
    this.mapReferenz.onUpdateTrackerData(this.filterVesselPool(this.vesselPool), this.vesselPool.length);


  }


  filterVesselPool(vesselPool) {
    let filteredPool = [];
    for (let i = 0; i < vesselPool.length; i++) {
      const inMapRange = vesselPool[i]['inMapRange'];
      const validData = vesselPool[i]['valid'];
      if (inMapRange && validData) filteredPool.push(vesselPool[i]);
    }
    return filteredPool;
  }


  optimizePool(vesselPool) {
    for (let i = 0; i < vesselPool.length; i++) {
      const hasMoved = vesselPool[i]['hasMoved'];
      if (hasMoved) this.optimizeTrackData(vesselPool[i]);
    }
  }


  optimizeTrackData(_vesselData) {
    console.log('check bounding', _vesselData['mmsi'])

    let intersected = [];
    for (let i = 0; i < _vesselData['trackData'].length; i++) {

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
        // const pos1 = VTRecorderUtils.cartesianFromLatLong(_vesselData['trackData'][io.index].lat, _vesselData['trackData'][io.index].lon);
        // const pos2 = VTRecorderUtils.cartesianFromLatLong(_vesselData['trackData'][io.index + 1].lat, _vesselData['trackData'][io.index + 1].lon);
        // const v1 = new Vector2(pos1[0], pos1[1]);
        // const v2 = new Vector2(pos2[0], pos2[1]);
        const v1 = VTRecorderUtils.getVectorFromGeoPoint(_vesselData['trackData'][io.index].lat, _vesselData['trackData'][io.index].lon);
        const v2 = VTRecorderUtils.getVectorFromGeoPoint(_vesselData['trackData'][io.index + 1].lat, _vesselData['trackData'][io.index + 1].lon);
        const collision_dir = Vector2.subtract(io.bounds.collisionLineStart, io.bounds.collisionLineEnd).normalize();
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


  saveData(asRawData = false) {

    // const _vesselDataCopy = [...this.vesselPool];
    const _filteredVesselPool = this.filterVesselPool(this.vesselPool);
    if (!asRawData) this.optimizePool(_filteredVesselPool);

    console.log('filteredPoolLength: ', _filteredVesselPool.length);

    let data = {
      // meta: 'meta info => timestamp, numVessels, etc.',
      meta: {
        numVessels: _filteredVesselPool.length
      },
      // vesselPool: this.vesselPool
      vesselPool: _filteredVesselPool
    };

    let blob = new Blob([JSON.stringify(data)], {type: "application/json"});
    saveAs(blob, "blob.json");
  }
}


export default VTRecorder



