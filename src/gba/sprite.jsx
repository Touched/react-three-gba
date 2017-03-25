/* @flow */

import React from 'react';
import * as THREE from 'three';
import { ContainerBase } from '../container';

const vertexShader = `
varying vec2 textureCoords;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  textureCoords = vec2(uv.x, 1.0 - uv.y);
}
`;

const fragmentShader = `
varying vec2 textureCoords;

uniform sampler2D image;
uniform sampler2D palette;

uniform vec2 sheetSize;

void main() {
    float index = texture2D(image, textureCoords).a * 256.0;
    gl_FragColor = texture2D(palette, vec2((index + 0.5) / 256.0, 0.5));
}
`;

// TODO: Create util function
function uploadDataToTexture(data, width, height, format, flipY) {
  this.image = { data, width, height };
  this.magFilter = THREE.NearestFilter;
  this.minFilter = THREE.NearestFilter;
  this.url = null;
  this.format = format;
  this.generateMipmaps = false;
  this.isDataTexture = true;
  this.unpackAlignment = 1;
  this.flipY = flipY;
  this.needsUpdate = true;
}

export default class GBASprite extends React.PureComponent {
  static propTypes = {
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    x: React.PropTypes.number,
    y: React.PropTypes.number,
    data: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
    palette: React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.number)).isRequired,
    order: React.PropTypes.number,
    transparent: React.PropTypes.bool,
    name: React.PropTypes.string,
  };

  static defaultProps = {
    x: 0,
    y: 0,
    order: 0,
    transparent: false,
    name: '',
  };

  static contextTypes = {
    container: React.PropTypes.instanceOf(ContainerBase),
  };

  componentDidMount() {
    this.updateData();
  }

  componentDidUpdate() {
    this.updateData();
  }

  updateData() {
    const { data, palette, width, height } = this.props;

    uploadDataToTexture.call(
      this.tilesetTexture,
      new Uint8Array(data),
      width,
      height,
      THREE.AlphaFormat,
      false,
    );

    const paletteData = new Uint8Array(256 * 4);
    paletteData.set([].concat(...palette));

    uploadDataToTexture.call(
      this.paletteTexture,
      paletteData,
      256,
      1,
      THREE.RGBAFormat,
      false,
    );
  }

  render() {
    const { width, height, x, y, order, transparent, name } = this.props;

    const { container } = this.context;
    const rect = container.calculateRectangle(width, height, x, y);

    return (
      <object3D position={new THREE.Vector3(rect.left, rect.top, 0)} name={name}>
        <resources>
          <texture
            url=""
            wrapS={THREE.ClampToEdgeWrapping}
            wrapT={THREE.ClampToEdgeWrapping}
            magFilter={THREE.NearestFilter}
            minFilter={THREE.NearestFilter}
            resourceId="tilesetTexture"
            ref={(ref) => { this.tilesetTexture = ref; }}
          />
          <texture
            url=""
            wrapS={THREE.ClampToEdgeWrapping}
            wrapT={THREE.ClampToEdgeWrapping}
            magFilter={THREE.NearestFilter}
            minFilter={THREE.NearestFilter}
            resourceId="paletteTexture"
            ref={(ref) => { this.paletteTexture = ref; }}
          />
        </resources>
        <mesh renderOrder={order}>
          <planeGeometry width={rect.width} height={rect.height} />
          <shaderMaterial
            fragmentShader={fragmentShader}
            vertexShader={vertexShader}
            transparent={transparent}
          >
            <uniforms>
              <uniform name="image" type="t">
                <textureResource resourceId="tilesetTexture" />
              </uniform>
              <uniform name="palette" type="t">
                <textureResource resourceId="paletteTexture" />
              </uniform>
              <uniform
                type="v2"
                name="sheetSize"
                value={new THREE.Vector2(width, height)}
              />
            </uniforms>
          </shaderMaterial>
        </mesh>
      </object3D>
    );
  }
}
