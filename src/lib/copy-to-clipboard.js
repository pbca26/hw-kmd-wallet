const copyToClipboard = value => {
  const copyTextarea = document.querySelector('#js-copytextarea');
  let result;
  
  copyTextarea.value = value;
  copyTextarea.select();

  try {
    document.execCommand('copy');
    result = 1;
  } catch (err) {
    result = 0;
  }

  return result;
};

export default copyToClipboard;