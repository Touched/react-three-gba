/* @flow */

import React from 'react';
import * as THREE from 'three';
import { ContainerBase } from './container';

export default class Box extends React.Component {
  static propTypes = {
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    x: React.PropTypes.number,
    y: React.PropTypes.number,
    order: React.PropTypes.number,
    name: React.PropTypes.string,
  };

  static defaultProps = {
    x: 0,
    y: 0,
    order: 0,
    name: '',
  };

  static contextTypes = {
    container: React.PropTypes.instanceOf(ContainerBase),
  };

  componentDidMount() {
    this.update();
  }

  componentDidUpdate() {
    this.update();
  }

  update() {
    const { width, height, x, y } = this.props;
    const { container } = this.context;
    const rect = container.calculateRectangle(width, height, x, y);

    const geometry = new THREE.PlaneGeometry(rect.width, rect.height);
    const edges = new THREE.EdgesGeometry(geometry);

    this.lines.geometry = edges;
  }

  render() {
    const { order, width, height, x, y, name } = this.props;

    const { container } = this.context;
    const rect = container.calculateRectangle(width, height, x, y);

    return (
      <group position={new THREE.Vector3(rect.left, rect.top, 0)} name={name}>
        <mesh renderOrder={order}>
          <planeGeometry width={rect.width} height={rect.height} />
          <meshBasicMaterial color={0xff0000} opacity={0.5} transparent />
        </mesh>
        <lineSegments renderOrder={order} ref={(ref) => { this.lines = ref; }}>
          <lineBasicMaterial color={0xff0000} opacity={0.5} transparent />
        </lineSegments>
      </group>
    );
  }
}
