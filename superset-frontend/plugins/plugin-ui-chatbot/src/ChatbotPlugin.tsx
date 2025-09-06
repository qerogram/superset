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
import * as React from 'react';
import ReactDOM from 'react-dom';
import { isFeatureEnabled, FeatureFlag } from '@superset-ui/core';
import Chatbot from './components/Chatbot';

class ChatbotPlugin {
  name = 'ChatbotPlugin';
  
  private container: HTMLDivElement | null = null;
  
  /**
   * Initialize the chatbot plugin
   * Called when Superset loads
   */
  initialize() {
    // Check if feature flag is enabled
    if (!this.isEnabled()) {
      console.log('Chatbot plugin is disabled via feature flag');
      return;
    }
    
    // Create container for chatbot
    this.createContainer();
    
    // Mount chatbot component
    this.mount();
  }
  
  /**
   * Check if chatbot is enabled via feature flag
   */
  isEnabled(): boolean {
    // Check for custom feature flag ENABLE_CHATBOT
    // You can add this to superset_config.py:
    // FEATURE_FLAGS = {
    //   "ENABLE_CHATBOT": True,
    // }
    return isFeatureEnabled(FeatureFlag.GlobalAsyncQueries) || 
           (window as any).ENABLE_CHATBOT || 
           process.env.REACT_APP_ENABLE_CHATBOT === 'true';
  }
  
  /**
   * Create DOM container for chatbot
   */
  private createContainer() {
    if (this.container) return;
    
    this.container = document.createElement('div');
    this.container.id = 'superset-chatbot-plugin';
    document.body.appendChild(this.container);
  }
  
  /**
   * Mount the chatbot component
   */
  private mount() {
    if (!this.container) return;
    
    ReactDOM.render(React.createElement(Chatbot), this.container);
  }
  
  /**
   * Unmount and cleanup
   */
  destroy() {
    if (this.container) {
      ReactDOM.unmountComponentAtNode(this.container);
      document.body.removeChild(this.container);
      this.container = null;
    }
  }
}

export default ChatbotPlugin;