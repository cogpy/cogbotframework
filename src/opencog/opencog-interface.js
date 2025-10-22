/**
 * OpenCog Interface
 * Provides JavaScript bridge to OpenCog's AtomSpace and cognitive processes
 */

const { spawn } = require('child_process');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const { Logger } = require('../utils/logger');

class OpenCogInterface extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.logger = Logger.getInstance();
        this.atomSpace = new Map();
        this.cogServer = null;
        this.wsConnection = null;
        this.isInitialized = false;
        this.atoms = new Map();
        this.nextAtomId = 1;
    }

    async initialize() {
        try {
            this.logger.info('Initializing OpenCog interface...');
            
            // Initialize AtomSpace simulation
            await this.initializeAtomSpace();
            
            // Start cognitive processes
            await this.startCognitiveProcesses();
            
            this.isInitialized = true;
            this.logger.info('OpenCog interface initialized successfully');
            
            this.emit('initialized');
        } catch (error) {
            this.logger.error('Failed to initialize OpenCog interface:', error);
            throw error;
        }
    }

    async initializeAtomSpace() {
        // Simulate AtomSpace initialization
        this.atomSpace.clear();
        this.atoms.clear();
        
        // Create fundamental concept atoms
        this.createAtom('ConceptNode', 'Self');
        this.createAtom('ConceptNode', 'Conversation');
        this.createAtom('ConceptNode', 'Intent');
        this.createAtom('ConceptNode', 'Response');
        this.createAtom('ConceptNode', 'Context');
        this.createAtom('ConceptNode', 'Learning');
        
        // Create relationship types
        this.createAtom('PredicateNode', 'has-intent');
        this.createAtom('PredicateNode', 'generates-response');
        this.createAtom('PredicateNode', 'requires-context');
        this.createAtom('PredicateNode', 'similar-to');
        
        this.logger.info('AtomSpace initialized with fundamental concepts');
    }

    async startCognitiveProcesses() {
        // Simulate cognitive process initialization
        this.cognitiveProcesses = {
            patternMatcher: this.createPatternMatcher(),
            reasoningEngine: this.createReasoningEngine(),
            learningModule: this.createLearningModule(),
            attentionAllocation: this.createAttentionModule()
        };
        
        // Start background cognitive loops
        this.startCognitiveLoop();
        
        this.logger.info('Cognitive processes started');
    }

    createAtom(type, name, truthValue = { strength: 1.0, confidence: 1.0 }) {
        const atom = {
            id: this.nextAtomId++,
            type: type,
            name: name,
            truthValue: truthValue,
            attentionValue: { sti: 0, lti: 0, vlti: false },
            incoming: new Set(),
            outgoing: new Set(),
            timestamp: Date.now()
        };
        
        this.atoms.set(atom.id, atom);
        this.atomSpace.set(name, atom.id);
        
        return atom;
    }

    createLink(type, outgoingAtoms, truthValue = { strength: 1.0, confidence: 1.0 }) {
        const link = {
            id: this.nextAtomId++,
            type: type,
            outgoing: new Set(outgoingAtoms.map(a => typeof a === 'object' ? a.id : a)),
            truthValue: truthValue,
            attentionValue: { sti: 0, lti: 0, vlti: false },
            timestamp: Date.now()
        };
        
        // Update incoming sets for referenced atoms
        link.outgoing.forEach(atomId => {
            const atom = this.atoms.get(atomId);
            if (atom) {
                atom.incoming.add(link.id);
            }
        });
        
        this.atoms.set(link.id, link);
        
        return link;
    }

    createPatternMatcher() {
        return {
            match: (pattern, callback) => {
                // Simulate pattern matching
                const matches = this.findMatches(pattern);
                if (callback) {
                    matches.forEach(callback);
                }
                return matches;
            },
            
            findSimilarConcepts: (conceptName, threshold = 0.7) => {
                const similar = [];
                for (const [name, atomId] of this.atomSpace) {
                    const similarity = this.calculateSimilarity(conceptName, name);
                    if (similarity >= threshold && name !== conceptName) {
                        similar.push({ name, similarity, atomId });
                    }
                }
                return similar.sort((a, b) => b.similarity - a.similarity);
            }
        };
    }

    createReasoningEngine() {
        return {
            infer: (premises, rules) => {
                // Simulate PLN reasoning
                const conclusions = [];
                
                premises.forEach(premise => {
                    rules.forEach(rule => {
                        if (this.ruleApplies(premise, rule)) {
                            const conclusion = this.applyRule(premise, rule);
                            conclusions.push(conclusion);
                        }
                    });
                });
                
                return conclusions;
            },
            
            evaluateConfidence: (atom) => {
                return atom.truthValue.confidence;
            },
            
            propagateAttention: () => {
                // Simulate attention propagation
                for (const atom of this.atoms.values()) {
                    if (atom.attentionValue.sti > 0) {
                        atom.attentionValue.sti *= 0.95; // Decay
                    }
                }
            }
        };
    }

    createLearningModule() {
        return {
            learn: (experience) => {
                // Simulate learning from experience
                const concept = this.extractConcept(experience);
                const existingAtom = this.findAtomByName(concept.name);
                
                if (existingAtom) {
                    // Strengthen existing concept
                    existingAtom.truthValue.strength += 0.1;
                    existingAtom.truthValue.confidence = Math.min(1.0, existingAtom.truthValue.confidence + 0.05);
                } else {
                    // Create new concept
                    this.createAtom('ConceptNode', concept.name, concept.truthValue);
                }
                
                return concept;
            },
            
            adaptBehavior: (feedback) => {
                // Simulate behavioral adaptation
                const adaptations = [];
                
                if (feedback.success) {
                    // Strengthen successful patterns
                    adaptations.push(this.reinforcePattern(feedback.pattern));
                } else {
                    // Weaken unsuccessful patterns
                    adaptations.push(this.weakenPattern(feedback.pattern));
                }
                
                return adaptations;
            }
        };
    }

    createAttentionModule() {
        return {
            allocateAttention: (stimuli) => {
                // Simulate attention allocation
                stimuli.forEach(stimulus => {
                    const atom = this.findAtomByName(stimulus.name);
                    if (atom) {
                        atom.attentionValue.sti += stimulus.importance;
                    }
                });
            },
            
            focusAttention: () => {
                // Return atoms with highest attention
                const attentiveAtoms = Array.from(this.atoms.values())
                    .filter(atom => atom.attentionValue.sti > 0)
                    .sort((a, b) => b.attentionValue.sti - a.attentionValue.sti)
                    .slice(0, this.config.attentionWindow || 10);
                
                return attentiveAtoms;
            }
        };
    }

    startCognitiveLoop() {
        // Continuous cognitive processing
        this.cognitiveLoopInterval = setInterval(() => {
            try {
                // Propagate attention
                this.cognitiveProcesses.reasoningEngine.propagateAttention();
                
                // Process focused atoms
                const focusedAtoms = this.cognitiveProcesses.attentionAllocation.focusAttention();
                
                // Emit cognitive state update
                this.emit('cognitiveUpdate', {
                    focusedAtoms: focusedAtoms.length,
                    totalAtoms: this.atoms.size,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                this.logger.error('Error in cognitive loop:', error);
            }
        }, 1000); // Run every second
    }

    // Utility methods
    findMatches(pattern) {
        // Simplified pattern matching
        const matches = [];
        for (const atom of this.atoms.values()) {
            if (this.matchesPattern(atom, pattern)) {
                matches.push(atom);
            }
        }
        return matches;
    }

    matchesPattern(atom, pattern) {
        // Basic pattern matching logic
        return atom.type === pattern.type && 
               (!pattern.name || atom.name === pattern.name);
    }

    calculateSimilarity(name1, name2) {
        // Simple string similarity (can be enhanced with semantic similarity)
        const longer = name1.length > name2.length ? name1 : name2;
        const shorter = name1.length > name2.length ? name2 : name1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    findAtomByName(name) {
        const atomId = this.atomSpace.get(name);
        return atomId ? this.atoms.get(atomId) : null;
    }

    extractConcept(experience) {
        // Extract concept from experience (simplified)
        return {
            name: experience.intent || 'UnknownConcept',
            truthValue: { strength: 0.8, confidence: 0.6 }
        };
    }

    ruleApplies(premise, rule) {
        // Check if rule applies to premise
        return true; // Simplified
    }

    applyRule(premise, rule) {
        // Apply reasoning rule
        return {
            type: 'InferredConcept',
            premise: premise,
            rule: rule,
            confidence: premise.truthValue.confidence * 0.9
        };
    }

    reinforcePattern(pattern) {
        // Strengthen pattern
        return { action: 'reinforce', pattern };
    }

    weakenPattern(pattern) {
        // Weaken pattern
        return { action: 'weaken', pattern };
    }

    // Public interface methods
    async processInput(input) {
        const inputAtom = this.createAtom('ConceptNode', `Input_${Date.now()}`);
        
        // Allocate attention to new input
        this.cognitiveProcesses.attentionAllocation.allocateAttention([
            { name: inputAtom.name, importance: 10 }
        ]);
        
        // Find similar concepts
        const similar = this.cognitiveProcesses.patternMatcher.findSimilarConcepts(input.text);
        
        // Learn from input
        const learned = this.cognitiveProcesses.learningModule.learn(input);
        
        return {
            inputAtom,
            similarConcepts: similar,
            learnedConcept: learned,
            processing: 'completed'
        };
    }

    async generateResponse(context) {
        // Generate response using cognitive processes
        const focusedAtoms = this.cognitiveProcesses.attentionAllocation.focusAttention();
        const responseCandidate = this.selectBestResponse(focusedAtoms, context);
        
        return {
            text: responseCandidate.text,
            confidence: responseCandidate.confidence,
            reasoning: responseCandidate.reasoning
        };
    }

    selectBestResponse(focusedAtoms, context) {
        // Simplified response selection
        if (focusedAtoms.length === 0) {
            return {
                text: "I'm processing your request...",
                confidence: 0.5,
                reasoning: "No focused atoms available"
            };
        }
        
        const bestAtom = focusedAtoms[0];
        return {
            text: `Based on my understanding of ${bestAtom.name}, I can help you with that.`,
            confidence: bestAtom.truthValue.confidence,
            reasoning: `Selected atom: ${bestAtom.name} with attention: ${bestAtom.attentionValue.sti}`
        };
    }

    getAtomSpaceState() {
        return {
            totalAtoms: this.atoms.size,
            concepts: Array.from(this.atomSpace.keys()),
            attentiveAtoms: this.cognitiveProcesses.attentionAllocation.focusAttention().length,
            isReady: this.isInitialized
        };
    }

    isReady() {
        return this.isInitialized;
    }

    async shutdown() {
        this.logger.info('Shutting down OpenCog interface...');
        
        if (this.cognitiveLoopInterval) {
            clearInterval(this.cognitiveLoopInterval);
        }
        
        if (this.wsConnection) {
            this.wsConnection.close();
        }
        
        if (this.cogServer) {
            this.cogServer.kill();
        }
        
        this.isInitialized = false;
        this.emit('shutdown');
        
        this.logger.info('OpenCog interface shutdown complete');
    }
}

module.exports = { OpenCogInterface };