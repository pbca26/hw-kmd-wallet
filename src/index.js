import React, {Suspense} from 'react';
import ReactDOM from 'react-dom';
import '@fortawesome/fontawesome-free/css/all.css';
import './index.scss';
import reportWebVitals from './reportWebVitals';
import {LangWrapper} from './ContextProviders';

const App = React.lazy(() => import('./App'));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
if (window.location.href.indexOf('devmode') > -1) reportWebVitals(console.log);

ReactDOM.render(
  <Suspense fallback={
    <div style={{
      'margin': 0,
      'width': '100%',
      'textAlign': 'center',
      'position': 'absolute',
      'top': '50%',
      'transform': 'translateY(-50%)'
    }}>
      <h4>Loading app...</h4>
    </div>}>
    <LangWrapper>
      <App />
    </LangWrapper>
  </Suspense>, document.getElementById('root')
);
