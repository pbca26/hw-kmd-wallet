import React, {useState, useEffect} from 'react';
import {LANG} from './constants';

export const LangContext = React.createContext(LANG);

export const LangWrapper = props => {
  const [lang, setLang] = useState(LANG);

  useEffect(() => {
    console.warn('lang set to', lang);
  });

  return (
    <LangContext.Provider value={{lang, setLang}}>
      {props.children}
    </LangContext.Provider>
  );
} 