/**
 * Configuration Management for CogBot Framework
 * Handles all configuration including OpenCog and Bot Framework settings
 */

const path = require('path');
const fs = require('fs');

class ConfigManager {
    constructor() {
        this.config = this.loadConfig();
    }

    static getInstance() {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    loadConfig() {
        const defaultConfig = {
            opencog: {
                host: process.env.OPENCOG_HOST || 'localhost',
                port: parseInt(process.env.OPENCOG_PORT) || 17001,
                atomspaceSize: parseInt(process.env.ATOMSPACE_SIZE) || 1000000,
                cogserverPath: process.env.COGSERVER_PATH || '/usr/local/bin/cogserver',
                schemes: {
                    reasoning: true,
                    learning: true,
                    patternMatching: true,
                    conceptualBlending: true
                },
                reasoning: {
                    ruleEngine: 'PLN',
                    maxInferenceSteps: 100,
                    confidenceThreshold: 0.7,
                    attentionAllocation: true
                }
            },
            botframework: {
                appId: process.env.MicrosoftAppId || '',
                appPassword: process.env.MicrosoftAppPassword || '',
                channelService: process.env.ChannelService || '',
                openIdMetadata: process.env.BotOpenIdMetadata || '',
                timeout: 30000,
                retryAttempts: 3
            },
            orchestrator: {
                cognitiveProcessingTimeout: 10000,
                maxConcurrentSessions: 100,
                autogenesisEnabled: true,
                learningRate: 0.01,
                synergyThreshold: 0.8,
                emergentBehaviorDetection: true,
                adaptiveLearning: {
                    enabled: true,
                    updateInterval: 3600000, // 1 hour in milliseconds
                    memoryConsolidation: true,
                    conceptDrift: true
                }
            },
            cognitive: {
                memoryCapacity: 10000,
                attentionWindow: 50,
                conceptLearningThreshold: 0.6,
                patternMatchingDepth: 5,
                emotionalModeling: true,
                contextualMemory: {
                    shortTerm: 100,
                    longTerm: 10000,
                    episodic: 1000
                }
            },
            server: {
                port: parseInt(process.env.PORT) || 3978,
                cors: {
                    enabled: true,
                    origins: ['*']
                },
                rateLimiting: {
                    windowMs: 15 * 60 * 1000, // 15 minutes
                    max: 100 // requests per window
                }
            },
            logging: {
                level: process.env.LOG_LEVEL || 'info',
                cognitiveEvents: true,
                performanceMetrics: true
            }
        };

        // Load custom config if it exists
        const configPath = path.join(process.cwd(), 'config.json');
        if (fs.existsSync(configPath)) {
            try {
                const customConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                return this.mergeConfig(defaultConfig, customConfig);
            } catch (error) {
                console.error('Error loading config file:', error);
                return defaultConfig;
            }
        }

        return defaultConfig;
    }

    mergeConfig(defaultConfig, customConfig) {
        const merged = { ...defaultConfig };
        
        for (const key in customConfig) {
            // Protect against prototype pollution
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue; // Skip dangerous keys
            }
            
            if (customConfig.hasOwnProperty(key)) {
                if (typeof customConfig[key] === 'object' && 
                    customConfig[key] !== null && 
                    !Array.isArray(customConfig[key])) {
                    merged[key] = { ...merged[key], ...customConfig[key] };
                } else {
                    merged[key] = customConfig[key];
                }
            }
        }
        
        return merged;
    }

    get(path) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }

    set(path, newValue) {
        const keys = path.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            
            // Protect against prototype pollution
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                throw new Error(`Invalid configuration key: ${key}`);
            }
            
            if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
                current[key] = {};
            }
            current = current[key];
        }
        
        const finalKey = keys[keys.length - 1];
        
        // Protect against prototype pollution
        if (finalKey === '__proto__' || finalKey === 'constructor' || finalKey === 'prototype') {
            throw new Error(`Invalid configuration key: ${finalKey}`);
        }
        
        current[finalKey] = newValue;
    }

    // Getters for main configuration sections
    get opencog() {
        return this.config.opencog;
    }

    get botframework() {
        return this.config.botframework;
    }

    get orchestrator() {
        return this.config.orchestrator;
    }

    get cognitive() {
        return this.config.cognitive;
    }

    get server() {
        return this.config.server;
    }

    get logging() {
        return this.config.logging;
    }
}

module.exports = { ConfigManager };