import axios from 'axios';

class VesselTrackerConnector {

  constructor(_map) {

    this.mapReferenz = _map;
    this.vesselPool = [];


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

  createVesselData(vesselData) {
    return {
      mmsi: vesselData['aisStatic']['mmsi'],
      name: vesselData['aisStatic']['name'],
      status: vesselData['geoDetails']['status'],
      aisPosition: {
        lat: vesselData['aisPosition']['lat'],
        lon: vesselData['aisPosition']['lon'],
        // velocity
        sog: vesselData['aisPosition']['sog'],
        // direction
        hdg: vesselData['aisPosition']['hdg'],
        // kurs
        cog: vesselData['aisPosition']['cog']
      },
      trackData: [
        {
          lat: vesselData['aisPosition']['lat'],
          lon: vesselData['aisPosition']['lon'],
          cog: vesselData['aisPosition']['cog']
        }
      ]
    }
  }

  createPool(data) {

    console.log('createPool', data['vessels'][0]);

    for (let i = 0; i < data['numVessels']; i++) {
      this.vesselPool[i] = this.createVesselData(data['vessels'][i])
    }
    console.log(this.vesselPool);
    this.mapReferenz.onUpdateTrackerData(this.vesselPool);
  }


  updatePool(vesselPool, newData) {

    let newVessels = newData['vessels'];

    // update poolData
    for (let i = 0; i < vesselPool.length; i++) {
      const _mmsi = vesselPool[i]['mmsi'];
      let result = newVessels.filter(o => {
        return o['aisStatic']['mmsi'] === _mmsi;
      });

      if (result[0]) {
        if (result[0]['geoDetails']['status'] === 'moving') {
          vesselPool[i]['trackData'].push(
            {
              lat: result[0]['aisPosition']['lat'],
              lon: result[0]['aisPosition']['lon'],
              cog: result[0]['aisPosition']['cog']
            }
          );
        } else {
          vesselPool[i]['trackData'].push(
            {
              lat: '=> noChange',
              lon: '=> noChange',
              cog: '=> noChange'
            }
          );
        }
        // console.log('succsesfully update')
      } else {
        console.log('failed update');
        vesselPool[i]['trackData'].push(
          {
            lat: '=> lostTrack',
            lon: '=> lostTrack',
            cog: '=> lostTrack'
          }
        );
      }

    }

    // check for new vessels and add
    for (let i = 0; i < newVessels.length; i++) {
      let newVessel = null;
      const _mmsi = newVessels[i]['aisStatic']['mmsi'];
      let result = vesselPool.filter(o => {
        newVessel = this.createVesselData(newVessels[i]);
        return o['mmsi'] === _mmsi;
      });

      if (!result[0]) {
        console.log('addVesselToPool', i, _mmsi, newVessel);
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


    this.dataVessel = [];
    for (let i = 0; i < numVessels; i++) {
      this.dataVessel[i] = this.createVesselData(data['vessels'][i]);
    }

    this.mapReferenz.onUpdateTrackerData(this.dataVessel);


  }

}


export default VesselTrackerConnector


