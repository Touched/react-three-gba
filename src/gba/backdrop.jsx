/* @flow */

import React from 'react';
import * as THREE from 'three';
import { ContainerBase } from '../container';

export default function GBABackdrop(props, context) {
  const {
    order,
    width,
    height,
    x,
    y,
    color,
    transparent,
    name,
  } = props;

  const rect = context.container.calculateRectangle(width, height, x, y);

  return (
    <mesh renderOrder={order} position={new THREE.Vector3(rect.left, rect.top, 0)} name={name}>
      <planeGeometry width={rect.width} height={rect.height} />
      <meshBasicMaterial color={new THREE.Color(...color)} transparent={transparent} />
    </mesh>
  );
}

GBABackdrop.contextTypes = {
  container: React.PropTypes.instanceOf(ContainerBase),
};

GBABackdrop.propTypes = {
  width: React.PropTypes.number.isRequired,
  height: React.PropTypes.number.isRequired,
  x: React.PropTypes.number,
  y: React.PropTypes.number,
  color: React.PropTypes.arrayOf(React.PropTypes.number),
  order: React.PropTypes.number,
  transparent: React.PropTypes.bool,
  name: React.PropTypes.string,
};

GBABackdrop.defaultProps = {
  x: 0,
  y: 0,
  order: 0,
  color: [0, 0, 0],
  transparent: false,
  name: '',
};
