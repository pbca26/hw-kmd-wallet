import React from 'react';
//import './Dropdown.scss';

const Dropdown = ({value, items, name, className, cb, cbArgs}) => (
  <select
    name={name}
    className={`${className} minimal`}
    value={value}
    onChange={(event) => cb(event, cbArgs)}>
    {items.map((item, index) => (
      <option
        key={`${className}-key-${item.label}`}
        value={item.value}
        disabled={item.disabled}>
        {item.label}
      </option>
    ))}
  </select>
);

export default Dropdown;
