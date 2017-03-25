import React from 'react';
import * as THREE from 'three';
import { ContainerBase } from './container';

type GroupProps = { x?: number, y?: number, children: Array<ReactElement> | ReactElement };

export default function Group({ x, y, children }: GroupProps, context) {
  const rect = context.container.calculateRectangle(0, 0, x, y);

  return (
    <group position={new THREE.Vector3(rect.left, rect.top, 0)}>{children}</group>
  );
}

Group.defaultProps = {
  x: 0,
  y: 0,
};

Group.contextTypes = {
  container: React.PropTypes.instanceOf(ContainerBase),
};
