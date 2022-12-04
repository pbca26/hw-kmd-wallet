import React from 'react';
import {LangContext} from './ContextProviders';
import languages from './translate/';
import {LANG} from './constants';

const Translate = props => {
  const {lang} = React.useContext(LangContext);
  let {name, template} = props; 

  try {
    const _t = t(name, lang, template);

    return (
      <React.Fragment>{_t}</React.Fragment>
    );
  } catch (e) {
    console.warn(e);
    return <React.Fragment>!!translate name prop error!!</React.Fragment>;
  }
}

export const t = (...props) => {
  let {lang} = LangContext._currentValue;
  let [name, _lang, template] = props; 

  if (_lang) lang = _lang;
  if (!lang || (languages[lang] && !languages[lang].hasOwnProperty(name) && languages[LANG].hasOwnProperty(name))) lang = LANG;

  if (!languages[lang] || (languages[lang] && !languages[lang].hasOwnProperty(name))) {
    throw Error(`translate name prop error, lang: ${lang}, name: ${name}`);
  } else {
    return languages[lang][name].indexOf('{{template}}') > -1 ? languages[lang][name].replace('{{template}}', template) : languages[lang][name];
  }
};

export default Translate;
