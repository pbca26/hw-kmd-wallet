export const setLocalStorageVar = (name, json) => {
  console.warn(localStorage.getItem(name));
  console.warn(typeof localStorage.getItem(name));

  let _var = {};

  try {
    _var = JSON.parse(localStorage.getItem(name)) || {};
  } catch (e) {
    console.warn(e);
  }

  for (let key in json) {
    _var[key] = json[key];
  }

  console.warn('_var', _var);

  localStorage.setItem(name, JSON.stringify(_var));
}

export const getLocalStorageVar = (name) => {
  const _var = localStorage.getItem(name);

  if (_var) {
    const _json = JSON.parse(_var);

    return _json;
  } else {
    return null;
  }
}