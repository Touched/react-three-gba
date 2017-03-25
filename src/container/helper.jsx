/* @flow */

import React from 'react';
import ContainerBase from './containerBase';

// This is a helper to prevent a bug where context was not being passed down
// through the React3 component. This simply passes the props down as context
// to the child components.
export default class ContextHelper extends React.Component {
  static propTypes = {
    container: React.PropTypes.instanceOf(ContainerBase).isRequired,
    children: React.PropTypes.oneOfType([
      React.PropTypes.arrayOf(React.PropTypes.node),
      React.PropTypes.node,
    ]).isRequired,
  };

  static childContextTypes = {
    container: React.PropTypes.instanceOf(ContainerBase),
  };

  getChildContext() {
    return {
      container: this.props.container,
    };
  }

  render() {
    return <group>{this.props.children}</group>;
  }
}
