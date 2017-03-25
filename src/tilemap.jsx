/* @flow */

/* eslint-disable no-mixed-operators */

import React from 'react';
import * as THREE from 'three';
import { ContainerBase } from './container';

const vertexShader = `
varying vec2 textureCoords;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    textureCoords = uv;
}
`;

const fragmentShader = `
varying vec2 textureCoords;

uniform sampler2D tilemap;
uniform sampler2D image;
uniform sampler2D palette;

uniform vec2 tileSize;
uniform vec2 sheetSize;
uniform vec2 mapSize;
uniform float opacity;

void main() {
    vec2 sizeInTiles = sheetSize / (tileSize - 0.5);

    vec4 currentTile = floor(texture2D(tilemap, textureCoords) * 256.0);
    vec2 tileCoord = currentTile.xy;

    // Apply tilemap
    vec2 tilesetCoord = tileCoord / sizeInTiles + fract(textureCoords * mapSize) / sizeInTiles;
    vec4 color = texture2D(image, vec2(tilesetCoord.x, tilesetCoord.y));

    gl_FragColor = vec4(color.rgb, color.a * opacity);
}
`;

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

export default class Tilemap extends React.Component {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;

  static propTypes = {
    tileWidth: React.PropTypes.number,
    tileHeight: React.PropTypes.number,
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    x: React.PropTypes.number,
    y: React.PropTypes.number,
    url: React.PropTypes.string.isRequired,
    tilemap: React.PropTypes.arrayOf(React.PropTypes.shape({
      x: React.PropTypes.number.isRequired,
      y: React.PropTypes.number.isRequired,
    })).isRequired,
    order: React.PropTypes.number,
    opacity: React.PropTypes.number,
    transparent: React.PropTypes.bool,
  };

  static defaultProps = {
    x: 0,
    y: 0,
    order: 0,
    tileWidth: 16,
    tileHeight: 16,
    opacity: 1,
    transparent: false,
  };

  static contextTypes = {
    container: React.PropTypes.instanceOf(ContainerBase),
  };

  constructor(props) {
    super(props);
    this.state = {
      tilesetDimensions: {
        width: 0,
        height: 0,
      },
    };
  }

  componentDidMount() {
    this.updateData();
  }

  componentDidUpdate() {
    this.updateData();
  }

  onTilesetLoaded = this.handleTilesetLoaded.bind(this);
  handleTilesetLoaded(texture) {
    const { image: { width, height } } = texture;
    const t = texture;

    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearFilter;
    t.flipY = false;

    this.setState({
      tilesetDimensions: {
        width,
        height,
      },
    });
  }

  updateData() {
    const { tilemap, width, height } = this.props;
    const tilemapData = new Uint8Array([].concat(...tilemap.map(({ x, y }) => [x, y, 0, 0])));

    uploadDataToTexture.call(
      this.tilemapTexture,
      tilemapData,
      width,
      height,
      THREE.RGBAFormat,
      false,
    );
  }

  render() {
    const {
      width,
      height,
      x,
      y,
      tileWidth,
      tileHeight,
      order,
      url,
      opacity,
      transparent,
    } = this.props;


    const { container } = this.context;
    const rect = container.calculateRectangle(width * tileWidth, height * tileHeight, x, y);

    const { tilesetDimensions } = this.state;

    return (
      <object3D position={new THREE.Vector3(rect.left, rect.top, 0)}>
        <resources>
          <texture
            url={url}
            wrapS={THREE.ClampToEdgeWrapping}
            wrapT={THREE.ClampToEdgeWrapping}
            magFilter={THREE.NearestFilter}
            minFilter={THREE.NearestFilter}
            resourceId="tilesetTexture"
            onLoad={this.onTilesetLoaded}
          />
          <texture
            url=""
            wrapS={THREE.ClampToEdgeWrapping}
            wrapT={THREE.ClampToEdgeWrapping}
            magFilter={THREE.NearestFilter}
            minFilter={THREE.NearestFilter}
            resourceId="tilemapTexture"
            ref={(ref) => { this.tilemapTexture = ref; }}
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
              <uniform name="tilemap" type="t">
                <textureResource resourceId="tilemapTexture" />
              </uniform>
              <uniform
                type="v2"
                name="tileSize"
                value={new THREE.Vector2(tileWidth, tileHeight)}
              />
              <uniform
                type="v2"
                name="sheetSize"
                value={new THREE.Vector2(tilesetDimensions.width, tilesetDimensions.height)}
              />
              <uniform
                type="v2"
                name="mapSize"
                value={new THREE.Vector2(width, height)}
              />
              <uniform
                type="f"
                name="opacity"
                value={opacity}
              />
            </uniforms>
          </shaderMaterial>
        </mesh>
      </object3D>
    );
  }
}
