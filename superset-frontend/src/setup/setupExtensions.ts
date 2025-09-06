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

// For individual deployments to add custom overrides
export default function setupExtensions() {
  // Extensions can be added here
  
  // Load Chatbot Extension if enabled
  if (typeof window !== 'undefined') {
    // Check if chatbot is enabled via localStorage (user preference)
    const isChatbotEnabled = localStorage.getItem('enable_chatbot') !== 'false';
    
    if (isChatbotEnabled) {
      // Load Chatbot Plugin
      setTimeout(() => {
        import('../../plugins/plugin-ui-chatbot/src/components/Chatbot').then(
          ({ default: Chatbot }) => {
          const React = require('react');
          const ReactDOM = require('react-dom');
          
          let container = document.getElementById('superset-chatbot-extension');
          if (!container) {
            container = document.createElement('div');
            container.id = 'superset-chatbot-extension';
            document.body.appendChild(container);
          }
          
          ReactDOM.render(React.createElement(Chatbot), container);
          console.log('Chatbot plugin loaded');
        }).catch(err => {
          console.error('Failed to load chatbot plugin:', err);
        });
      }, 1000);
    }
  }
}
