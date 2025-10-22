/**
 * Basic Cognitive Bot Example
 * Demonstrates how to use the CogBot Framework
 */

const CogBotFramework = require('../src/index');
const { Logger } = require('../src/utils/logger');

async function createCognitiveBot() {
    const logger = Logger.getInstance();
    
    try {
        // Create and start the cognitive bot
        const cogBot = new CogBotFramework();
        
        logger.info('Starting Basic Cognitive Bot example...');
        
        // Setup custom event handlers
        setupEventHandlers(cogBot);
        
        // Start the bot
        await cogBot.start();
        
        logger.info('Basic Cognitive Bot is running!');
        logger.info('Send messages to /api/messages to interact with the cognitive bot');
        
        return cogBot;
        
    } catch (error) {
        logger.error('Failed to start cognitive bot:', error);
        process.exit(1);
    }
}

function setupEventHandlers(cogBot) {
    // Listen for cognitive events
    if (cogBot.orchestrator) {
        cogBot.orchestrator.on('initialized', () => {
            console.log('🧠 Cognitive orchestrator initialized');
        });
        
        cogBot.orchestrator.on('cognitiveUpdate', (update) => {
            console.log('🧠 Cognitive update:', {
                focusedAtoms: update.focusedAtoms,
                totalAtoms: update.totalAtoms
            });
        });
    }
    
    // Listen for OpenCog events
    if (cogBot.openCogInterface) {
        cogBot.openCogInterface.on('initialized', () => {
            console.log('⚛️ OpenCog interface ready');
        });
        
        cogBot.openCogInterface.on('cognitiveUpdate', (update) => {
            console.log('⚛️ OpenCog update:', update);
        });
    }
}

// Example of how to extend the cognitive bot with custom behaviors
class CustomCognitiveBot extends CogBotFramework {
    constructor() {
        super();
        this.customBehaviors = new Map();
    }
    
    async initializeComponents() {
        await super.initializeComponents();
        
        // Add custom cognitive behaviors
        this.addCustomBehavior('creativity', this.createCreativeBehavior());
        this.addCustomBehavior('empathy', this.createEmpathyBehavior());
        this.addCustomBehavior('curiosity', this.createCuriosityBehavior());
    }
    
    addCustomBehavior(name, behavior) {
        this.customBehaviors.set(name, behavior);
        this.logger.info(`Custom behavior added: ${name}`);
    }
    
    createCreativeBehavior() {
        return {
            name: 'creativity',
            trigger: (context) => context.requiresCreativity,
            execute: async (context) => {
                // Implement creative response generation
                return {
                    type: 'creative_response',
                    content: this.generateCreativeResponse(context),
                    confidence: 0.7
                };
            }
        };
    }
    
    createEmpathyBehavior() {
        return {
            name: 'empathy',
            trigger: (context) => context.emotionalContent > 0.5,
            execute: async (context) => {
                // Implement empathetic response
                return {
                    type: 'empathetic_response',
                    content: this.generateEmpathicResponse(context),
                    emotionalResonance: context.emotionalContent
                };
            }
        };
    }
    
    createCuriosityBehavior() {
        return {
            name: 'curiosity',
            trigger: (context) => context.novelty > 0.8,
            execute: async (context) => {
                // Implement curiosity-driven questions
                return {
                    type: 'curious_inquiry',
                    content: this.generateCuriousResponse(context),
                    followUpQuestions: this.generateFollowUpQuestions(context)
                };
            }
        };
    }
    
    generateCreativeResponse(context) {
        return `That's interesting! Let me think creatively about "${context.input}". What if we approached this from a completely different angle...`;
    }
    
    generateEmpathicResponse(context) {
        return `I can sense there are some emotions in what you're saying. I want to understand better how you're feeling about this.`;
    }
    
    generateCuriousResponse(context) {
        return `This is fascinating! I've never encountered something quite like this before. Can you tell me more about...`;
    }
    
    generateFollowUpQuestions(context) {
        return [
            `What led you to think about ${context.mainConcept}?`,
            `How does this relate to your previous experiences?`,
            `What would happen if we changed the fundamental assumptions here?`
        ];
    }
}

// Example usage scenarios
async function demonstrateCapabilities() {
    console.log('\n🚀 Demonstrating Cognitive Bot Capabilities\n');
    
    const scenarios = [
        {
            name: 'Learning and Adaptation',
            description: 'Bot learns from interactions and adapts responses',
            example: 'User teaches bot about a new concept, bot incorporates it into future responses'
        },
        {
            name: 'Synergy Detection',
            description: 'Bot detects synergistic patterns in conversation',
            example: 'Bot notices when multiple concepts work together and enhances response'
        },
        {
            name: 'Autogenesis',
            description: 'Bot self-modifies to improve performance',
            example: 'Bot evolves response patterns based on successful interactions'
        },
        {
            name: 'Cognitive Reasoning',
            description: 'Bot uses OpenCog for complex reasoning',
            example: 'Bot makes logical inferences and provides reasoning traces'
        },
        {
            name: 'Contextual Memory',
            description: 'Bot maintains context across conversation',
            example: 'Bot remembers previous topics and connects them meaningfully'
        }
    ];
    
    scenarios.forEach((scenario, index) => {
        console.log(`${index + 1}. ${scenario.name}`);
        console.log(`   ${scenario.description}`);
        console.log(`   Example: ${scenario.example}\n`);
    });
}

// Main execution
if (require.main === module) {
    demonstrateCapabilities().then(() => {
        console.log('Choose implementation:');
        console.log('1. Basic Cognitive Bot (node examples/basic-cognitive-bot.js basic)');
        console.log('2. Custom Cognitive Bot (node examples/basic-cognitive-bot.js custom)');
        
        const mode = process.argv[2] || 'basic';
        
        if (mode === 'custom') {
            const customBot = new CustomCognitiveBot();
            customBot.start().catch(console.error);
        } else {
            createCognitiveBot().catch(console.error);
        }
    });
}

module.exports = { CustomCognitiveBot, createCognitiveBot };