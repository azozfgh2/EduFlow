/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { StudentsView } from './views/StudentsView';
import { ScheduleView, TasksView, DiscussionsView } from './views/OtherViews';

export default function App() {
  const [activeTab, setActiveTab] = useState('students');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'students' && <StudentsView />}
      {activeTab === 'schedule' && <ScheduleView />}
      {activeTab === 'tasks' && <TasksView />}
      {activeTab === 'discussions' && <DiscussionsView />}
    </Layout>
  );
}
