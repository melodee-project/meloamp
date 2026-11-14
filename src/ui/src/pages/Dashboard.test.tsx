import React from 'react';
import Dashboard from './Dashboard';
import { setupApiMock, cleanupApiMock, getMockApi } from '../test/apiMock';
import * as testUtils from '../test/testUtils';

function renderDashboard() {
  // `testUtils.render` already supplies i18n, the MUI theme, and a router.
  return testUtils.render(<Dashboard />);
}

describe('Dashboard', () => {
  beforeEach(() => {
    setupApiMock();
  });

  afterEach(() => {
    cleanupApiMock();
  });

  test('renders listener content when system stats are forbidden', async () => {
    // Listener accounts are not administrators; the frozen API answers
    // `403 FORBIDDEN` for `/system/stats` and that must not hide the dashboard.
    getMockApi().onGet('/system/stats').reply(403, { code: 'FORBIDDEN', message: 'Forbidden' });

    renderDashboard();

    expect(await testUtils.screen.findByText('Recent Artists')).toBeInTheDocument();
    expect(await testUtils.screen.findByText('Artist One')).toBeInTheDocument();
    expect(testUtils.screen.queryByText('Something went wrong')).toBeNull();
  });

  test('still surfaces unexpected failures loading the dashboard', async () => {
    getMockApi().onGet('/system/stats').reply(500, { message: 'Server Error' });

    renderDashboard();

    expect(await testUtils.screen.findByRole('alert')).toBeInTheDocument();
    expect(testUtils.screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
