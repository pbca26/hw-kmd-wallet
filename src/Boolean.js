import React from 'react';

const Boolean = ({value}) => (
  <span className={`icon has-text-${value ? 'success' : 'danger'}`}>
    <i className={`fas fa-${value ? 'check' : 'times'}-circle`}></i>
  </span>
);

export default Boolean;
