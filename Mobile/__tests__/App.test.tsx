import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import App from '../App';

test('renders without crashing', () => {
  ReactTestRenderer.create(<App />);
});
