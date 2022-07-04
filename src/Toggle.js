import React from 'react';
//import './Toggle.scss';

const Toggle = ({value, name, cb, style, label, className}) => (
  <React.Fragment>
    <span className="slider-text" style={style}>{label}</span>
    <label className={className ? className : 'switch'}>
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={value}
        readOnly />
      <span
        className="slider round"
        onClick={cb}></span>
    </label>
  </React.Fragment>
);

export default Toggle;