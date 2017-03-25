/* @flow */

/* eslint-disable no-mixed-operators */

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

uniform sampler2D tilemap;
uniform sampler2D image;
uniform sampler2D palette;

uniform vec2 tileSize;
uniform vec2 sheetSize;
uniform vec2 mapSize;

bool flag_set(float lhs, float bit) {
    return int(mod(floor(lhs / exp2(bit)), 2.0)) == 1;
}

void main() {
    vec2 sizeInTiles = sheetSize / tileSize;

    vec4 currentTile = floor(texture2D(tilemap, textureCoords) * 256.0);
    vec2 tileCoord = currentTile.st;
    vec2 flip = vec2(1.0, 1.0);

    // Horizontal flip
    if (flag_set(currentTile.z, 0.0)) {
        tileCoord += vec2(1.0, 0.0);
        flip *= vec2(-1.0, 1.0);
    }

    // Vertical flip
    if (flag_set(currentTile.z, 1.0)) {
        tileCoord += vec2(0.0, 1.0);
        flip *= vec2(1.0, -1.0);
    }

    // Palette selection
    float paletteShift = 16.0 * currentTile.w;

    // Apply tilemap
    vec2 tilesetCoord = tileCoord / sizeInTiles
        + fract(textureCoords * mapSize) / sizeInTiles * flip;

    // Index image
    float index = texture2D(image, tilesetCoord).a * 256.0 + paletteShift;

    vec4 color = texture2D(palette, vec2((index + 0.5) / 256.0, 0.5));

    if (color.a <= 0.0) {
        discard;
    }

    gl_FragColor = color;
}
`;

const TILESET_WIDTH = 128;

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

export default class GBATilemap extends React.PureComponent {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;

  static propTypes = {
    tileWidth: React.PropTypes.number,
    tileHeight: React.PropTypes.number,
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    x: React.PropTypes.number,
    y: React.PropTypes.number,
    // Convert to image object ( width: number, height: number, data: Array<number> }
    // to avoid relying on a fixed tileset stride
    tiles: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
    palette: React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.number)).isRequired,
    tilemap: React.PropTypes.arrayOf(React.PropTypes.shape({
      index: React.PropTypes.number.isRequired,
      hflip: React.PropTypes.bool.isRequired,
      vflip: React.PropTypes.bool.isRequired,
      palette: React.PropTypes.number.isRequired,
    })).isRequired,
    order: React.PropTypes.number,
    transparent: React.PropTypes.bool,
    name: React.PropTypes.string,
  };

  static defaultProps = {
    x: 0,
    y: 0,
    order: 0,
    tileWidth: 8,
    tileHeight: 8,
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
    const { tiles, tilemap, tileWidth, width, height } = this.props;
    const tilesetWidthInTiles = TILESET_WIDTH / tileWidth;

    const tilemapData = new Uint8Array([].concat(...tilemap.map(
      ({ index, vflip, hflip, palette }) => [
        index % tilesetWidthInTiles,
        Math.floor(index / tilesetWidthInTiles),
        hflip | (vflip << 1), // eslint-disable-line no-bitwise
        palette,
      ])),
    );

    uploadDataToTexture.call(
      this.tilemapTexture,
      tilemapData,
      width,
      height,
      THREE.RGBAFormat,
      false,
    );

    uploadDataToTexture.call(
      this.tilesetTexture,
      new Uint8Array(this.props.tiles),
      TILESET_WIDTH,
      Math.ceil(tiles.length / TILESET_WIDTH),
      THREE.AlphaFormat,
      false,
    );

    const paletteData = new Uint8Array(256 * 4);
    paletteData.set([].concat(...this.props.palette));

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
    const {
      width,
      height,
      tileWidth,
      tileHeight,
      x,
      y,
      order,
      tiles,
      transparent,
      name,
    } = this.props;

    const { container } = this.context;
    const rect = container.calculateRectangle(width * tileWidth, height * tileHeight, x, y);

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
              <uniform name="palette" type="t">
                <textureResource resourceId="paletteTexture" />
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
                value={new THREE.Vector2(TILESET_WIDTH, Math.ceil(tiles.length / TILESET_WIDTH))}
              />
              <uniform
                type="v2"
                name="mapSize"
                value={new THREE.Vector2(width, height)}
              />
            </uniforms>
          </shaderMaterial>
        </mesh>
      </object3D>
    );
  }
}
