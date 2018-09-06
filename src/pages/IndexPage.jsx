import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {resize, initTouchDetection} from 'actions/uiActions';
import HowToComponent from 'components/howToComponent/HowToComponent';
import PreviewIcon from "../components/previewIconComponent/PreviewIconComponent";
import {samples} from "../components/samples/config";

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

    const sampleList = samples.map((item, index) =>
      <PreviewIcon title={item.title} route={item.route} key={index}/>
    );

    return (
      <section>
        <div>
          <h2 style={{margin: '5px'}}>Playground</h2>
          {sampleList}
        </div>
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

