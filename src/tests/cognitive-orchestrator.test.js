/**
 * Tests for Cognitive Orchestrator
 */

const { CognitiveOrchestrator } = require('../core/cognitive-orchestrator');
const { OpenCogInterface } = require('../opencog/opencog-interface');
const { BotFrameworkAdapter } = require('../adapters/botframework-adapter');

// Mock dependencies
jest.mock('../opencog/opencog-interface');
jest.mock('../adapters/botframework-adapter');

describe('CognitiveOrchestrator', () => {
    let orchestrator;
    let mockOpenCog;
    let mockBotAdapter;
    let mockConfig;

    beforeEach(() => {
        mockConfig = {
            synergyThreshold: 0.8,
            learningRate: 0.01,
            autogenesisEnabled: true
        };

        mockOpenCog = {
            initialize: jest.fn().mockResolvedValue(undefined),
            processInput: jest.fn().mockResolvedValue({
                inputAtom: { id: 1, name: 'test' },
                similarConcepts: [],
                learnedConcept: { name: 'TestConcept' },
                processing: 'completed'
            }),
            generateResponse: jest.fn().mockResolvedValue({
                text: 'Test response',
                confidence: 0.8,
                reasoning: ['Test reasoning']
            }),
            getAtomSpaceState: jest.fn().mockReturnValue({
                totalAtoms: 10,
                concepts: ['test'],
                attentiveAtoms: 2,
                isReady: true
            }),
            isReady: jest.fn().mockReturnValue(true),
            on: jest.fn(),
            emit: jest.fn()
        };

        mockBotAdapter = {
            extractUserMessage: jest.fn().mockReturnValue({
                id: 'test-message-id',
                text: 'Hello test',
                conversation: { id: 'test-conversation' },
                from: { id: 'test-user' }
            }),
            sendTypingIndicator: jest.fn().mockResolvedValue(undefined),
            sendCognitiveResponse: jest.fn().mockResolvedValue({ id: 'response-id' }),
            sendTextMessage: jest.fn().mockResolvedValue({ id: 'text-response-id' }),
            startPerformanceTimer: jest.fn().mockReturnValue({ operation: 'test', startTime: BigInt(0) }),
            endPerformanceTimer: jest.fn().mockReturnValue(100)
        };

        orchestrator = new CognitiveOrchestrator({
            openCog: mockOpenCog,
            botAdapter: mockBotAdapter,
            config: mockConfig
        });
    });

    afterEach(() => {
        if (orchestrator) {
            orchestrator.shutdown();
        }
        jest.clearAllTimers();
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize successfully', async () => {
            await orchestrator.initialize();
            
            expect(orchestrator.isReady).toBe(true);
            expect(orchestrator.autogenesisEngine).toBeDefined();
            expect(orchestrator.synergyDetector).toBeDefined();
            expect(orchestrator.adaptiveLearner).toBeDefined();
        });

        test('should setup background processes', async () => {
            jest.useFakeTimers();
            
            await orchestrator.initialize();
            
            expect(orchestrator.autogenesisInterval).toBeDefined();
            expect(orchestrator.synergyInterval).toBeDefined();
            expect(orchestrator.memoryInterval).toBeDefined();
            
            jest.useRealTimers();
        });
    });

    describe('Message Processing', () => {
        beforeEach(async () => {
            await orchestrator.initialize();
        });

        test('should process turn context successfully', async () => {
            const mockTurnContext = {
                activity: {
                    conversation: { id: 'test-conversation' },
                    from: { id: 'test-user' },
                    text: 'Hello'
                }
            };

            await orchestrator.handleTurnContext(mockTurnContext);

            expect(mockBotAdapter.extractUserMessage).toHaveBeenCalled();
            expect(mockBotAdapter.sendTypingIndicator).toHaveBeenCalled();
            expect(mockOpenCog.processInput).toHaveBeenCalled();
            expect(mockOpenCog.generateResponse).toHaveBeenCalled();
            expect(mockBotAdapter.sendCognitiveResponse).toHaveBeenCalled();
        });

        test('should initialize new session correctly', async () => {
            const mockTurnContext = {
                activity: {
                    conversation: { id: 'new-conversation' },
                    from: { id: 'test-user' },
                    text: 'First message'
                }
            };

            await orchestrator.handleTurnContext(mockTurnContext);

            expect(orchestrator.sessions.has('new-conversation')).toBe(true);
            const session = orchestrator.sessions.get('new-conversation');
            expect(session.id).toBe('new-conversation');
            expect(session.messageCount).toBe(1);
        });
    });

    describe('Cognitive Processing', () => {
        beforeEach(async () => {
            await orchestrator.initialize();
        });

        test('should process input cognitively', async () => {
            const message = { text: 'Test message', conversation: { id: 'test' } };
            const session = { 
                id: 'test', 
                cognitiveState: { 
                    context: new Map(), 
                    concepts: new Map(), 
                    attention: new Map(),
                    emotions: new Map()
                },
                learningHistory: []
            };

            // Mock the enhanced processInput to return the expected structure
            mockOpenCog.processInput.mockResolvedValue({
                inputAtom: { id: 1, name: 'test' },
                similarConcepts: [],
                learnedConcept: { name: 'TestConcept' },
                processing: 'completed'
            });

            const result = await orchestrator.processCognitively(message, session);

            expect(result.openCogData).toBeDefined();
            expect(result.openCogData.processing).toBe('completed');
            expect(result.response).toBeDefined();
            expect(result.confidence).toBeDefined();
            expect(mockOpenCog.processInput).toHaveBeenCalledWith({
                text: message.text,
                context: session.cognitiveState.context,
                sessionId: session.id
            });
        });

        test('should enhance with context', () => {
            const openCogResult = { processing: 'completed' };
            const session = {
                cognitiveState: {
                    concepts: new Map([['concept1', { relevance: 0.8 }]]),
                    attention: new Map([['attention1', 5]]),
                    emotions: new Map()
                },
                learningHistory: []
            };

            const enhanced = orchestrator.enhanceWithContext(openCogResult, session);

            expect(enhanced.contextualEnhancement).toBeDefined();
            expect(enhanced.contextualEnhancement.relevantConcepts).toHaveLength(1);
            expect(enhanced.contextualEnhancement.attentionFocus).toHaveLength(1);
        });
    });

    describe('Synergy Detection', () => {
        beforeEach(async () => {
            await orchestrator.initialize();
        });

        test('should detect synergy when threshold is met', () => {
            // Mock high synergy score
            orchestrator.calculateSynergyScore = jest.fn().mockReturnValue(0.9);
            
            const cognitiveResult = { openCogData: {}, contextualEnhancement: {} };
            const session = { cognitiveState: {} };

            const synergy = orchestrator.detectInteractionSynergy(cognitiveResult, session);

            expect(synergy).toBeDefined();
            expect(synergy.type).toBe('cognitive_synergy');
            expect(synergy.score).toBe(0.9);
        });

        test('should not detect synergy when below threshold', () => {
            // Mock low synergy score
            orchestrator.calculateSynergyScore = jest.fn().mockReturnValue(0.3);
            
            const cognitiveResult = { openCogData: {}, contextualEnhancement: {} };
            const session = { cognitiveState: {} };

            const synergy = orchestrator.detectInteractionSynergy(cognitiveResult, session);

            expect(synergy).toBeNull();
        });
    });

    describe('Autogenesis', () => {
        beforeEach(async () => {
            await orchestrator.initialize();
        });

        test('should detect pattern improvement', () => {
            const interaction = {
                input: { response: { confidence: 0.9 } },
                session: { id: 'test' },
                success: 0.9,
                timestamp: Date.now()
            };

            const improvement = orchestrator.autogenesisEngine.detectImprovement(interaction);

            expect(improvement).toBeDefined();
            expect(improvement.type).toBe('new_pattern');
        });

        test('should evolve existing pattern', () => {
            // Create a pattern signature that will match
            const signature = 'test_0.7_' + Date.now();
            orchestrator.createPatternSignature = jest.fn().mockReturnValue(signature);
            
            // First interaction to create pattern
            const interaction1 = {
                input: { response: { confidence: 0.7 } },
                session: { id: 'test' },
                success: 0.7,
                timestamp: Date.now()
            };

            orchestrator.autogenesisEngine.detectImprovement(interaction1);

            // Second interaction with same signature but higher success
            const interaction2 = {
                input: { response: { confidence: 0.9 } },
                session: { id: 'test' },
                success: 0.9,
                timestamp: Date.now()
            };

            const improvement = orchestrator.autogenesisEngine.detectImprovement(interaction2);

            expect(improvement).toBeDefined();
            expect(improvement.type).toBe('pattern_evolution');
        });
    });

    describe('Adaptive Learning', () => {
        beforeEach(async () => {
            await orchestrator.initialize();
        });

        test('should adapt to positive feedback', () => {
            const feedback = {
                success: true,
                interaction: { confidence: 0.8 },
                session: { id: 'test' }
            };

            const adaptation = orchestrator.adaptiveLearner.adapt(feedback);

            expect(adaptation).toBeDefined();
            expect(adaptation.type).toBe('adaptation');
            expect(adaptation.changes).toContain('cognitive_enhancement');
        });

        test('should consolidate memory', () => {
            // Setup memory with high and low importance items
            orchestrator.cognitiveMemory.set('session1', [
                { importance: 0.9, text: 'important' },
                { importance: 0.3, text: 'not important' },
                { importance: 0.8, text: 'also important' }
            ]);

            const consolidated = orchestrator.adaptiveLearner.consolidateMemory();

            expect(consolidated.length).toBe(2); // Only items with importance > 0.7
        });
    });

    describe('State Management', () => {
        beforeEach(async () => {
            await orchestrator.initialize();
        });

        test('should return cognitive state', async () => {
            const state = await orchestrator.getCognitiveState();

            expect(state.sessions).toBeDefined();
            expect(state.totalInteractions).toBeDefined();
            expect(state.atomSpaceState).toBeDefined();
            expect(state.isReady).toBe(true);
        });

        test('should update session correctly', async () => {
            const session = {
                id: 'test',
                messageCount: 0,
                cognitiveState: {
                    attention: new Map(),
                    concepts: new Map(),
                    context: new Map()
                },
                learningHistory: [],
                adaptations: []
            };

            // Initialize memory for this session
            orchestrator.cognitiveMemory.set('test', []);

            const message = { text: 'hello world' };
            const response = { text: 'Hi there', confidence: 0.8 };

            await orchestrator.updateSession(session, message, response);

            expect(session.messageCount).toBe(1);
            expect(session.learningHistory).toHaveLength(1);
            expect(orchestrator.cognitiveMemory.get('test')).toHaveLength(1);
        });
    });

    describe('Background Processes', () => {
        beforeEach(async () => {
            jest.useFakeTimers();
            await orchestrator.initialize();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('should run autogenesis loop', () => {
            const spy = jest.spyOn(orchestrator, 'runAutogenesisLoop');
            
            jest.advanceTimersByTime(30000); // 30 seconds
            
            expect(spy).toHaveBeenCalled();
        });

        test('should run synergy detection loop', () => {
            const spy = jest.spyOn(orchestrator, 'runSynergyDetection');
            
            jest.advanceTimersByTime(15000); // 15 seconds
            
            expect(spy).toHaveBeenCalled();
        });

        test('should run memory consolidation loop', () => {
            const spy = jest.spyOn(orchestrator, 'runMemoryConsolidation');
            
            jest.advanceTimersByTime(300000); // 5 minutes
            
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        beforeEach(async () => {
            await orchestrator.initialize();
        });

        test('should handle OpenCog processing errors gracefully', async () => {
            mockOpenCog.processInput.mockRejectedValue(new Error('OpenCog error'));

            const mockTurnContext = {
                activity: {
                    conversation: { id: 'test-conversation' },
                    from: { id: 'test-user' },
                    text: 'Hello'
                }
            };

            await orchestrator.handleTurnContext(mockTurnContext);

            // Should still send a fallback response
            expect(mockBotAdapter.sendTextMessage).toHaveBeenCalled();
        });
    });

    describe('Shutdown', () => {
        test('should shutdown gracefully', async () => {
            jest.useFakeTimers();
            
            await orchestrator.initialize();
            
            expect(orchestrator.isReady).toBe(true);
            expect(orchestrator.autogenesisInterval).toBeDefined();
            
            await orchestrator.shutdown();
            
            expect(orchestrator.isReady).toBe(false);
            
            jest.useRealTimers();
        });
    });
});