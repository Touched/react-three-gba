/* @flow */

import React from 'react';
import * as THREE from 'three';
import { ContainerBase } from './container';

export default class Grid extends React.Component {
  static propTypes = {
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    order: React.PropTypes.number,
    gridSize: React.PropTypes.number,
    position: React.PropTypes.instanceOf(THREE.Vector2),
  };

  static defaultProps = {
    order: Infinity,
    gridSize: 16,
    position: new THREE.Vector2(0, 0),
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
    const { width, height, position, gridSize } = this.props;

    const { container } = this.context;
    const rect = container.calculateRectangle(width, height, 0, 0);

    const geometry = new THREE.Geometry();

    const gridWidth = 400;
    const stepWidth = rect.width / (width / gridSize);
    const gridHeight = 400;
    const stepHeight = rect.height / (height / gridSize);

    for (let i = -gridHeight + position.y; i <= gridHeight; i += stepHeight) {
      geometry.vertices.push(new THREE.Vector3(-gridWidth, 0, i));
      geometry.vertices.push(new THREE.Vector3(gridWidth, 0, i));
    }

    for (let i = -gridWidth - position.x; i <= gridWidth; i += stepWidth) {
      geometry.vertices.push(new THREE.Vector3(i, 0, -gridHeight));
      geometry.vertices.push(new THREE.Vector3(i, 0, gridHeight));
    }

    this.lines.geometry = geometry;
  }

  render() {
    const { order, position } = this.props;

    return (
      <lineSegments
        rotation={new THREE.Euler(Math.PI / 2, 0, 0)}
        position={new THREE.Vector3(position.x, position.y, 0)}
        renderOrder={order}
        ref={(ref) => { this.lines = ref; }}
      >
        <lineBasicMaterial color={0} transparent />
      </lineSegments>
    );
  }
}
