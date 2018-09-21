import axios from 'axios';

class VesselTrackerConnector {

  constructor(_map) {

    this.mapReferenz = _map;


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
      // handle success
      _this.parseData(response.data);

    }).catch(function (error) {
      // handle error
      console.log(error);
    }).then(function () {
      // if error debug!
    });
  }


  parseData(data) {
    console.log('timeCreated', data['timeCreated'])
    console.log('numVessels', data['numVessels'])
    console.log(data['vessels'][0])
    console.log(data['vessels'][0]['aisStatic'])
    // console.log(data['vessels'][0]['aisPosition']['lon'])

    this.mapReferenz.onUpdateTrackerData([
      data['vessels'][0]['aisPosition']['lat'],
      data['vessels'][0]['aisPosition']['lon']
    ]);

  }

}


export default VesselTrackerConnector



