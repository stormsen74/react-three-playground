import axios from 'axios';
import saveAs from 'file-saver';
import {Vector2} from "../../../utils/vector2";

const FileSaver = require('file-saver');

class VesselTrackerConnector {

  constructor(_map) {

    this.mapReferenz = _map;
    this.vesselPool = [];

    this.trackLength = 0;


    this.load = this.load.bind(this);


  }

  load() {
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


  getFixed(float) {
    return Number.parseFloat(float.toFixed(6))
  }


  checkDistance(trackPoint_1, trackPoint_2) {
    // console.log(trackPoint_1, trackPoint_2)
    const v1 = new Vector2(trackPoint_1['lat'], trackPoint_1['lon']);
    const v2 = new Vector2(trackPoint_2['lat'], trackPoint_2['lon']);
    console.log('distance => ', Vector2.getDistance(v1, v2))
  }

  getDistance(trackPoint_1, trackPoint_2) {
    const v1 = new Vector2(trackPoint_1['lat'], trackPoint_1['lon']);
    const v2 = new Vector2(trackPoint_2['lat'], trackPoint_2['lon']);
    return Vector2.getDistance(v1, v2);
  }


  hasMoved(trackData, mmsi) {
    let distance = 0;

    if (trackData.length > 4) {
      // 3min - 1m moved
      const pathArrayLength = trackData.length;
      distance = this.getDistance(trackData[pathArrayLength - 1], trackData[pathArrayLength - 4]);
      console.log(mmsi, ' 5min distance = ', distance)
    }

    // 0.00005 ~ 5m
    return distance > .00005 ? true : false;
  }

  createVesselData(vesselData) {
    return {
      mmsi: vesselData['aisStatic']['mmsi'],
      status: vesselData['geoDetails']['status'],
      valid: true,
      inBounds: false, //'check for Bounds'
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
        cog: vesselData['aisPosition']['cog']
      },
      trackData: [
        {
          status: vesselData['geoDetails']['status'],
          lat: this.getFixed(vesselData['aisPosition']['lat']),
          lon: this.getFixed(vesselData['aisPosition']['lon']),
          sog: vesselData['aisPosition']['sog'],
          cog: vesselData['aisPosition']['cog']
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

    console.log(this.vesselPool);
    this.mapReferenz.onUpdateTrackerData(this.vesselPool);
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

      // if vessel already in pool update ...
      if (result[0]) {
        vesselPool[i]['status'] = result[0]['geoDetails']['status'];
        vesselPool[i]['aisPosition']['lat'] = this.getFixed(result[0]['aisPosition']['lat']);
        vesselPool[i]['aisPosition']['lon'] = this.getFixed(result[0]['aisPosition']['lon']);
        vesselPool[i]['aisPosition']['sog'] = result[0]['aisPosition']['sog'];
        vesselPool[i]['aisPosition']['cog'] = result[0]['aisPosition']['cog'];

        vesselPool[i]['trackData'].push(
          {
            status: result[0]['geoDetails']['status'],
            lat: this.getFixed(result[0]['aisPosition']['lat']),
            lon: this.getFixed(result[0]['aisPosition']['lon']),
            sog: result[0]['aisPosition']['sog'],
            cog: result[0]['aisPosition']['cog']
          }
        );

        // check movement
        // this.traveledDistance(vesselPool[i]['trackData'], vesselPool[i]['mmsi']);
        if (!vesselPool[i]['hasMoved'] && result[0]['geoDetails']['status'] == 'moving' && this.hasMoved(vesselPool[i]['trackData'], vesselPool[i]['mmsi'])) vesselPool[i]['hasMoved'] = true;

        // check for large distance jumps (unvalid data!)
        // if (vesselPool[i]['valid']) {
        //   if (vesselPool[i]['trackData'].length >= 1) {
        //     const pathArrayLength = vesselPool[i]['trackData'].length;
        //     this.checkDistance(vesselPool[i]['trackData'][pathArrayLength - 1], vesselPool[i]['trackData'][pathArrayLength - 2])
        //   }
        // }


      } else {
        // vessel left pool ...
        console.log('vessel left Pool', vesselPool[i]);
        vesselPool[i]['status'] = 'lost';
        vesselPool[i]['trackData'].push(
          {
            status: 'lost',
            lat: 0,
            lon: 0,
            sog: 0,
            cog: 0
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
              cog: newVessel['aisPosition']['cog']
            }
          )
        }

        vesselPool.push(newVessel);


      }

    }

    console.log(vesselPool)

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

    this.mapReferenz.onUpdateTrackerData(this.vesselPool);


  }


  saveData() {

    let data = {
      meta: 'meta info => timestamp, numVessels, etc.',
      vesselPool: this.vesselPool
    };

    let blob = new Blob([JSON.stringify(data)], {type: "application/json"});
    saveAs(blob, "blob.json");

  }
}


export default VesselTrackerConnector



