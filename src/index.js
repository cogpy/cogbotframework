/**
 * OpenCog Bot Framework Orchestrator
 * Main entry point for the cognitive synergy architecture
 */

const express = require('express');
const { CognitiveOrchestrator } = require('./core/cognitive-orchestrator');
const { BotFrameworkAdapter } = require('./adapters/botframework-adapter');
const { OpenCogInterface } = require('./opencog/opencog-interface');
const { ConfigManager } = require('./config/config-manager');
const { Logger } = require('./utils/logger');

class CogBotFramework {
    constructor() {
        this.config = ConfigManager.getInstance();
        this.logger = Logger.getInstance();
        this.app = express();
        this.port = process.env.PORT || 3978;
        
        this.initializeComponents();
        this.setupRoutes();
    }

    async initializeComponents() {
        try {
            this.logger.info('Initializing CogBot Framework components...');
            
            // Initialize OpenCog interface
            this.openCogInterface = new OpenCogInterface(this.config.opencog);
            await this.openCogInterface.initialize();
            
            // Initialize Bot Framework adapter
            this.botAdapter = new BotFrameworkAdapter(this.config.botframework);
            
            // Initialize Cognitive Orchestrator
            this.orchestrator = new CognitiveOrchestrator({
                openCog: this.openCogInterface,
                botAdapter: this.botAdapter,
                config: this.config.orchestrator
            });
            
            await this.orchestrator.initialize();
            
            this.logger.info('All components initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize components:', error);
            throw error;
        }
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                components: {
                    opencog: this.openCogInterface?.isReady() || false,
                    orchestrator: this.orchestrator?.isReady() || false
                }
            });
        });

        // Bot Framework webhook endpoint
        this.app.post('/api/messages', async (req, res) => {
            try {
                await this.orchestrator.processMessage(req, res);
            } catch (error) {
                this.logger.error('Error processing message:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // Cognitive state endpoint
        this.app.get('/api/cognitive-state', async (req, res) => {
            try {
                const state = await this.orchestrator.getCognitiveState();
                res.json(state);
            } catch (error) {
                this.logger.error('Error getting cognitive state:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }

    async start() {
        try {
            await this.initializeComponents();
            
            this.app.listen(this.port, () => {
                this.logger.info(`CogBot Framework listening on port ${this.port}`);
                this.logger.info('Autonomous cognitive orchestration active');
            });
        } catch (error) {
            this.logger.error('Failed to start CogBot Framework:', error);
            process.exit(1);
        }
    }

    async shutdown() {
        this.logger.info('Shutting down CogBot Framework...');
        
        if (this.orchestrator) {
            await this.orchestrator.shutdown();
        }
        
        if (this.openCogInterface) {
            await this.openCogInterface.shutdown();
        }
        
        this.logger.info('Shutdown complete');
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    if (global.cogBotFramework) {
        await global.cogBotFramework.shutdown();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    if (global.cogBotFramework) {
        await global.cogBotFramework.shutdown();
    }
    process.exit(0);
});

// Start the application
if (require.main === module) {
    global.cogBotFramework = new CogBotFramework();
    global.cogBotFramework.start().catch(console.error);
}

module.exports = CogBotFramework;