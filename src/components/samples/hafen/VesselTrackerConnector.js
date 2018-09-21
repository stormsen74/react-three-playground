import axios from 'axios';

class VesselTrackerConnector {

  constructor() {
    console.log('init::VesselTrackerConnector')

    this.loadData();

  }

  loadData() {
    const url = 'https://api.vesseltracker.com/api/v1/vessels/userpolygon';
    axios.get(url, {
      responseType: 'json',
      headers: {
        'accept': 'application/json',
        'Authorization': 'f780dfde-e181-4c1d-a246-fe9fbd80274c'
      },
    }).then(function (response) {
      // handle success
      console.log(response.data);
    }).catch(function (error) {
      // handle error
      console.log(error);
    }).then(function () {
      // always executed
    });


  }

}


export default VesselTrackerConnector



