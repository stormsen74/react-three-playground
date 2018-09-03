import React from 'react';

class TestPage2 extends React.Component {
  constructor(props) {
    super(props);
    const body = document.getElementsByTagName('body')[0];
    body.classList.add('test2');
  }

  render() {
    return (
      <section>
        <h1>TestPage2</h1>
      </section>
    );
  }
}

export default TestPage2;

