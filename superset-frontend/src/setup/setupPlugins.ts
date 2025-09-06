/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { getChartControlPanelRegistry } from '@superset-ui/core';
import MainPreset from '../visualizations/presets/MainPreset';
import setupPluginsExtra from './setupPluginsExtra';

import Separator from '../explore/controlPanels/Separator';

export default function setupPlugins() {
  new MainPreset().register();

  // TODO: Remove these shims once the control panel configs are moved into the plugin package.
  getChartControlPanelRegistry().registerValue('separator', Separator);

  setupPluginsExtra();
  
  // Load Chatbot Plugin if enabled
  // The plugin can be enabled by:
  // 1. Setting ENABLE_CHATBOT: true in window object
  // 2. Setting REACT_APP_ENABLE_CHATBOT=true in environment
  // 3. Adding to FEATURE_FLAGS in superset_config.py
  if (typeof window !== 'undefined') {
    const isChatbotEnabled = 
      (window as any).ENABLE_CHATBOT === true ||
      process.env.REACT_APP_ENABLE_CHATBOT === 'true' ||
      localStorage.getItem('enable_chatbot') === 'true';
    
    if (isChatbotEnabled) {
      // For now, skip plugin loading to avoid build errors
      // The chatbot will be mounted directly via App.tsx
      console.log('Chatbot enabled - will be mounted via App.tsx');
    }
  }
}
