/* eslint-disable import/no-extraneous-dependencies, no-plusplus, no-alert */

import React from 'react';
import ReactDOM from 'react-dom';
import Container from '../src/container';
import Box from '../src/box';
import GBABackdrop from '../src/gba/backdrop';
import GBATilemap from '../src/gba/tilemap';
import GBASprite from '../src/gba/sprite';
import Interactable from '../src/interactable';
import Group from '../src/group';
import Tilemap from '../src/tilemap';
import garyOw from './gary';
import blocksets from './blockset.json';
import mapData from './data.json';
import permissionsUrl from './permissions.png';

type Block = { block: number, collision: number, height: number };
type Tile = { tile: number, palette: number, flipX: boolean, flipY: boolean };

function translate({ tile, palette, flipX, flipY }) {
  return {
    index: tile,
    hflip: !!flipX,
    vflip: !!flipY,
    palette,
  };
}

function buildLayersForMap(map: Array<Array<Block>>, blocks: Array<Array<Tile>>) {
  // Assume array is not jagged
  const height = map.length;
  const width = map[0].length;

  const layers = [...Array(3)].map(() => Array(width * height * 4));
  const stride = width * 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const { block } = map[y][x];
      const index = (y * stride * 2) + (x * 2);

      const blockData = blocks[block];

      layers[0][index] = translate(blockData[0]);
      layers[0][index + 1] = translate(blockData[1]);
      layers[0][index + stride] = translate(blockData[2]);
      layers[0][index + stride + 1] = translate(blockData[3]);

      layers[1][index] = translate(blockData[4]);
      layers[1][index + 1] = translate(blockData[5]);
      layers[1][index + stride] = translate(blockData[6]);
      layers[1][index + stride + 1] = translate(blockData[7]);
    }
  }

  return layers;
}

class Demo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      layers: {
        grid: {
          name: 'Grid',
          enabled: false,
        },
        permissions: {
          name: 'Permissions',
          enabled: false,
        },
        box: {
          name: 'Box',
          enabled: false,
        },
      },
    };
  }

  handleChanged(layer, { target: { checked } }) {
    this.setState(state => ({
      layers: {
        ...state.layers,
        [layer]: {
          ...state.layers[layer],
          enabled: checked,
        },
      },
    }));
  }

  render() {
    const { data: map, width, height } = mapData;

    const combinedBlockset = blocksets[0].blocks.concat(blocksets[1].blocks);
    const combinedTileset = blocksets[0].tiles.concat(blocksets[1].tiles);

    // FIXME: rename v/hflip => flipX/fliYp
    const tilemapData = buildLayersForMap(map, combinedBlockset);

    const combinedPalette = blocksets[0].palette.slice(0, 7).concat(
      blocksets[1].palette.slice(7, 16),
    );

    const palette = [].concat(...combinedPalette);
    /*
       const permissionsUrl = 'https://raw.githubusercontent.com/' +
       'Diegoisawesome/AwesomeMapEditor/master/resources/images/PermGL.png'; */
    const permissionMap = [...Array(width * height)].map(() => ({
      x: 0,
      y: 0,
    }));

    const { layers } = this.state;
    const style = {
      background: 'linear-gradient(45deg, #0e1519 0%, #394044 100%)',
      height: '70vh',
    };

    return (
      <div>{
        Object.keys(layers).map((key) => {
          const { name, enabled } = layers[key];
          return (
            <div key={key}>
              <input
                checked={enabled}
                type="checkbox"
                onChange={event => this.handleChanged(key, event)}
              /> {name}
            </div>
          );
        })}
        <div style={style}>
          <Container grid={layers.grid.enabled} focus="main">
            <GBABackdrop
              width={width * 16}
              height={height * 16}
              color={palette[0].slice(0, 3)}
              transparent
            />
            <GBATilemap
              width={width * 2}
              height={height * 2}
              tiles={combinedTileset}
              palette={palette}
              tilemap={tilemapData[0]}
              transparent
            />
            <GBATilemap
              width={width * 2}
              height={height * 2}
              tiles={combinedTileset}
              palette={palette}
              tilemap={tilemapData[1]}
              name="main"
              transparent
            />
            {layers.box.enabled ? <Box order={3} width={16 * 8} height={10 * 8} /> : null}
            {layers.permissions.enabled ? <Tilemap
              width={width}
              height={height}
              url={permissionsUrl}
              tilemap={permissionMap}
              opacity={0.5}
              transparent
            /> : null}
            <Group x={32} y={32}>
              <Interactable
                width={16}
                height={32}
                onClick={() => window.alert('Clicked!')}
              />
              <GBASprite
                width={16}
                height={32}
                data={garyOw.data}
                palette={garyOw.palette}
                transparent
              />
            </Group>
          </Container>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Demo />, document.querySelector('#app'));
