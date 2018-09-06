import React from 'react';
import {connect} from 'react-redux';

import './PrieviewIconComponent.scss';

class PreviewIcon extends React.Component {

  constructor(props) {
    super(props);
  }


  render() {
    const {title, route} = this.props;


    let pop = (
      <div className={'pop'}>
        <a href={route}>
          <div className={'title'}>{title}</div>
        </a>
      </div>
    )


    return (
      <React.Fragment>
        {pop}
      </React.Fragment>
    );
  }

}

function mapStateToProps(state) {
  return {}
}

export default connect(mapStateToProps, {})(PreviewIcon);
