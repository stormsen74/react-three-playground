import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {resize, initTouchDetection} from 'actions/uiActions';
import HowToComponent from 'components/howToComponent/HowToComponent';

class IndexPage extends React.Component {
  constructor(props) {
    super(props);
    this.resizeTimeout = null;
    this.onResize = this.onResize.bind(this);
    const body = document.getElementsByTagName('body')[0];
    body.classList.add('index');
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize);
    this.props.resize();
    this.props.initTouchDetection();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  onResize() {
    window.clearTimeout(this.resizeTimeout);
    this.resizeTimeout = window.setTimeout(() => {
      this.props.resize();
    }, 100);
  }

  render() {
    const {width, height, humanTouch} = this.props;

    return (
      <section>
        <h1>IndexPage</h1>
        <p>Current browser size in pixel: {width}/{height}</p>
        {humanTouch
          ? <p>Human touch has been detected</p>
          : <p>No human touch has been detected.</p>}
        <HowToComponent/>
        <div><a href='/test'>click me hard</a></div>
      </section>
    );
  }
}

IndexPage.propTypes = {
  resize: PropTypes.func.isRequired,
  initTouchDetection: PropTypes.func.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  humanTouch: PropTypes.bool.isRequired,
};

function mapStateToProps(state) {
  return {
    width: state.ui.width,
    height: state.ui.height,
    humanTouch: state.ui.humanTouch,
  };
}

export default connect(mapStateToProps, {
  resize,
  initTouchDetection,
})(IndexPage);

