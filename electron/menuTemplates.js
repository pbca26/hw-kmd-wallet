const static = [ // if static
  { role: 'copy' },
  { type: 'separator' },
  { role: 'selectall' },
];

const edit = [ // if editable
  { role: 'undo' },
  { role: 'redo' },
  { type: 'separator' },
  { role: 'cut' },
  { role: 'copy' },
  { role: 'paste' },
  { type: 'separator' },
  { role: 'selectall' },
];

module.exports = {
  static,
  edit,
};