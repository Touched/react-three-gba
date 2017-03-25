/* @flow */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import React from 'react';
import React3 from 'react-three-renderer';
import dimensions from 'react-dimensions';
import { Motion, spring } from 'react-motion';
import * as THREE from 'three';
import ContainerBase from './containerBase';
import ContextHelper from './helper';
import Grid from '../grid';

const FOV = 90;
const FOV_RADIANS = FOV * (Math.PI / 180);
const DISTANCE = 1;
const PAN_SPEED = 1;

type DefaultZoomControlProps = {
  min: number,
  max: number,
  value: number,
  onChange: (event: Event) => void,
};

function DefaultZoomControl({ min, max, value, onChange }: DefaultZoomControlProps) {
  return (
    <input
      style={{ WebkitAppearance: 'slider-vertical', display: 'block' }}
      type="range"
      min={min}
      max={max}
      value={value}
      step={min / 2}
      onChange={onChange}
    />
  );
}

type DefaultRecenterControlProps = {
  onClick: (event: Event) => void,
};

function DefaultRecenterControl({ onClick }: DefaultRecenterControlProps) {
  return (
    <div><button onClick={onClick}>Recentre</button></div>
  );
}

class Container extends ContainerBase {
  static propTypes = {
    containerWidth: React.PropTypes.number.isRequired,
    containerHeight: React.PropTypes.number.isRequired,
    children: React.PropTypes.oneOfType([
      React.PropTypes.arrayOf(React.PropTypes.node),
      React.PropTypes.node,
    ]).isRequired,
    grid: React.PropTypes.bool,
    focus: React.PropTypes.string,
  };

  static defaultProps = {
    grid: true,
    focus: null,
  };

  constructor(props) {
    super(props);
    this.state = {
      position: new THREE.Vector3(0, 0, 1),
      pan: {
        active: false,
        start: new THREE.Vector2(0, 0),
      },
    };
  }

  componentDidMount() {
    this.raycaster = new THREE.Raycaster();

    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);

    this.recenter();
  }

  componentWillUmont() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  }

  calculateRectangle(width, height, x, y) {
    const { containerWidth, containerHeight } = this.props;

    const aspect = containerWidth / containerHeight;

    const verticalFraction = 2 * Math.tan(FOV_RADIANS / 2) * DISTANCE;
    const horizontalFraction = verticalFraction * aspect;

    return {
      width: (width * horizontalFraction) / containerWidth,
      height: (height * verticalFraction) / containerHeight,
      top: (-(y + (height / 2)) * verticalFraction) / containerHeight,
      left: ((x + (width / 2)) * horizontalFraction) / containerWidth,
    };
  }

  onWheel = this.handleWheel.bind(this);
  onMouseDown = this.handleMouseDown.bind(this);
  onMouseMove = this.handleMouseMove.bind(this);
  onMouseUp = this.handleMouseUp.bind(this);

  handleWheel({ deltaY, nativeEvent: { offsetX, offsetY } }) {
    const { containerWidth: width, containerHeight: height } = this.props;

    const x = ((offsetX / width) * 2) - 1;
    const y = -((offsetY / height) * 2) + 1;

    const vector = new THREE.Vector3(x, y, 1);

    vector.unproject(this.camera);
    vector.sub(this.state.position);

    if (deltaY < 0) {
      vector.addVectors(this.state.position, vector.setLength(0.25));
    } else {
      vector.subVectors(this.state.position, vector.setLength(0.25));
    }

    if (vector.z > this.camera.near && vector.z < this.camera.far) {
      this.setState({
        position: vector,
      });
    }
  }

  handleMouseDown(event) {
    this.redispatchEvent(event);

    if (!event.defaultPrevented) {
      const { pageX, pageY } = event;

      this.setState({
        pan: {
          active: true,
          start: new THREE.Vector2(pageX, pageY),
        },
      });
    }
  }

  handleMouseMove(event) {
    this.redispatchEvent(event);

    if (!event.defaultPrevented) {
      const { pageX, pageY } = event;
      const { containerWidth: width, containerHeight: height } = this.props;

      if (!this.state.pan.active) {
        return;
      }

      const panStart = this.state.pan.start;

      const a = new THREE.Vector2(pageX / width, -pageY / height);
      const b = new THREE.Vector2(panStart.x / width, -panStart.y / height);
      const mouseChange = new THREE.Vector2().subVectors(a, b);
      const eye = new THREE.Vector3(0, 0, 0).sub(this.camera.position);

      mouseChange.multiplyScalar(eye.length() * PAN_SPEED);

      const pan = new THREE.Vector3();
      pan.copy(eye).cross(this.camera.up).setLength(mouseChange.x);
      pan.add(this.camera.up.clone().setLength(mouseChange.y));

      this.setState({
        position: pan.setZ(0).add(this.state.position),
        pan: {
          start: new THREE.Vector2(pageX, pageY),
          active: true,
        },
      });
    }
  }

  handleMouseUp() {
    this.redispatchEvent(event);

    if (!event.defaultPrevented) {
      this.setState({
        pan: {
          active: false,
        },
      });
    }
  }

  redispatchEvent(event) {
    const { offsetX, offsetY } = event.nativeEvent || event;
    const { containerWidth: width, containerHeight: height } = this.props;

    const x = offsetX / width;
    const y = offsetY / height;
    const coords = new THREE.Vector2((x * 2) - 1, -(y * 2) + 1);

    this.raycaster.setFromCamera(coords, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    // Re-dispatch the event to the intersected Three.js objects with added meta
    // data from the raycaster
    intersects.every(({ object, ...meta }) => {
      // Persist React synthetic events
      if (event.persist) {
        event.persist();
      }

      const newEvent = Object.assign(event, meta);

      // Three.js writes to the event.target property, so it must be writable
      Object.defineProperty(newEvent, 'target', {
        ...Object.getOwnPropertyDescriptor(newEvent, 'target'),
        writable: true,
      });

      object.dispatchEvent(newEvent);
      return event.isPropagationStopped && !event.isPropagationStopped();
    });
  }

  onMouseClick = this.redispatchEvent.bind(this);

  zoomSliderChanged(event) {
    const { position: { x, y } } = this.state;
    const position = new THREE.Vector3(x, y, parseFloat(event.target.value, 10));
    this.setState({ position });
  }

  zoomSliderChanged = this.zoomSliderChanged.bind(this);

  recenter() {
    const { focus } = this.props;

    if (focus) {
      const object = this.scene.getObjectByName(focus);

      if (object) {
        const boundingBox = new THREE.Box3().setFromObject(object);

        const midpoint = boundingBox.getCenter();
        midpoint.setZ(this.state.position.z);

        this.setState({
          position: midpoint,
        });
      }
    }
  }

  recenter = this.recenter.bind(this);

  contents({ x, y, z }) {
    const { grid, containerWidth: width, containerHeight: height } = this.props;
    const gridPos = new THREE.Vector2(this.state.position.x, this.state.position.y);

    const ZoomControl = DefaultZoomControl;
    const RecenterControl = DefaultRecenterControl;

    // Zooming range
    const near = 0.25;
    const far = 2;

    return (
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', right: 0, bottom: 0 }}>
          <RecenterControl onClick={this.recenter} />
          <ZoomControl
            min={near}
            max={far}
            value={this.state.position.z}
            onChange={this.zoomSliderChanged}
          />
        </div>
        <div
          onWheel={this.onWheel}
          onMouseDown={this.onMouseDown}
          onClick={this.onMouseClick}
        >
          <React3
            mainCamera="camera"
            canvasRef={(ref) => { this.canvas = ref; }}
            width={width}
            height={height}
            pixelRatio={window.devicePixelRatio}
            alpha
          >
            <scene ref={(ref) => { this.scene = ref; }}>
              <perspectiveCamera
                name="camera"
                fov={FOV}
                aspect={width / height}
                near={near - 0.0001}
                far={far}
                position={new THREE.Vector3(x, y, z)}
                ref={(ref) => { this.camera = ref; }}
              />
              <ContextHelper container={this}>
                {this.props.children}
                {grid ? <Grid width={width} height={height} position={gridPos} /> : null}
              </ContextHelper>
            </scene>
          </React3>
        </div>
      </div>
    );
  }

  contents = this.contents.bind(this);

  render() {
    const { x, y, z } = this.state.position;

    return (
      <Motion style={{ x: spring(x), y: spring(y), z: spring(z) }}>
        {this.contents}
      </Motion>
    );
  }
}

export const FixedSizeContainer = Container;
export default dimensions()(Container);
