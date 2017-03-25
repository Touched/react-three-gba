/* @flow */

import React from 'react';
import React3 from 'react-three-renderer';
import * as THREE from 'three';
import { ContainerBase } from './container';

const EVENTS = {
  click: 'onClick',
  mousedown: 'onMouseDown',
  mousemove: 'onMouseMove',
  mouseup: 'onMouseUp',
};

/**
 * An invisble area (hit region) that can receive events. It is intended to be
 * used within a <group> or <object3D> component to create interactive components.
 */
export default class Interactable extends React.PureComponent {
  static propTypes = {
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    x: React.PropTypes.number,
    y: React.PropTypes.number,
    order: React.PropTypes.number,
    name: React.PropTypes.string,
    ...Object.values(EVENTS).reduce((result, prop) => ({
      ...result,
      [prop]: React.PropTypes.func,
    }), {}),
  }

  static defaultProps = {
    x: 0,
    y: 0,
    order: Infinity,
    name: '',
    ...Object.values(EVENTS).reduce((result, prop) => ({
      ...result,
      [prop]: () => {},
    }), {}),
  };

  static contextTypes = {
    container: React.PropTypes.instanceOf(ContainerBase),
  };

  componentDidMount() {
    const object = React3.findTHREEObject(this);
    Object.keys(EVENTS).forEach(
      type => object.addEventListener(type, this.dispatchEvent.bind(this, type)),
    );
  }

  componentWillUnmount() {
    const object = React3.findTHREEObject(this);
    Object.keys(EVENTS).forEach(
      type => object.removeEventListener(type, this.dispatchEvent.bind(this, type)),
    );
  }

  dispatchEvent(type, event) {
    this.props[EVENTS[type]](event);
  }

  render() {
    const { order, width, height, x, y } = this.props;

    const { container } = this.context;
    const rect = container.calculateRectangle(width, height, x, y);

    return (
      <mesh renderOrder={order} position={new THREE.Vector3(rect.left, rect.top, 0)}>
        <planeGeometry width={rect.width} height={rect.height} />
        <meshBasicMaterial visible={false} />
      </mesh>
    );
  }
}
