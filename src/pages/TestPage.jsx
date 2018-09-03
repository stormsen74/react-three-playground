import React from 'react';

class TestPage extends React.Component {
  constructor(props) {
    super(props);
    const body = document.getElementsByTagName('body')[0];
    body.classList.add('test');
  }

  render() {
    return (
      <section>
        <h1>TestPage</h1>
      </section>
    );
  }
}

export default TestPage;

