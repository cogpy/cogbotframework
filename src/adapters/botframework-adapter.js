/**
 * Bot Framework Adapter
 * Provides integration with Microsoft Bot Framework
 */

const { BotFrameworkAdapter: MSBotAdapter, TurnContext } = require('botbuilder');
const { Logger } = require('../utils/logger');

class BotFrameworkAdapter {
    constructor(config) {
        this.config = config;
        this.logger = Logger.getInstance();
        
        // Initialize Microsoft Bot Framework Adapter
        this.msAdapter = new MSBotAdapter({
            appId: config.appId,
            appPassword: config.appPassword,
            channelService: config.channelService,
            openIdMetadata: config.openIdMetadata
        });
        
        // Configure error handling
        this.setupErrorHandling();
        
        this.logger.info('Bot Framework Adapter initialized');
    }

    setupErrorHandling() {
        this.msAdapter.onTurnError = async (context, error) => {
            this.logger.error('Bot Framework adapter error:', error, {
                conversationId: context.activity?.conversation?.id,
                userId: context.activity?.from?.id,
                activityType: context.activity?.type
            });
            
            // Send error response to user
            await context.sendActivity({
                type: 'message',
                text: 'I encountered an error processing your request. Please try again.'
            });
        };
    }

    async processActivity(req, res, logic) {
        try {
            await this.msAdapter.processActivity(req, res, async (turnContext) => {
                await logic(turnContext);
            });
        } catch (error) {
            this.logger.error('Error processing activity:', error);
            throw error;
        }
    }

    createTurnContext(activity) {
        return new TurnContext(this.msAdapter, activity);
    }

    async sendActivity(turnContext, activity) {
        try {
            const response = await turnContext.sendActivity(activity);
            
            this.logger.debug('Activity sent successfully', {
                conversationId: turnContext.activity.conversation.id,
                activityType: activity.type,
                responseId: response?.id
            });
            
            return response;
        } catch (error) {
            this.logger.error('Failed to send activity:', error);
            throw error;
        }
    }

    async sendTextMessage(turnContext, text, additionalProperties = {}) {
        const activity = {
            type: 'message',
            text: text,
            ...additionalProperties
        };
        
        return await this.sendActivity(turnContext, activity);
    }

    async sendTypingIndicator(turnContext) {
        const typingActivity = {
            type: 'typing'
        };
        
        return await this.sendActivity(turnContext, typingActivity);
    }

    async sendAdaptiveCard(turnContext, card) {
        const activity = {
            type: 'message',
            attachments: [{
                contentType: 'application/vnd.microsoft.card.adaptive',
                content: card
            }]
        };
        
        return await this.sendActivity(turnContext, activity);
    }

    async sendHeroCard(turnContext, title, subtitle, text, images, buttons) {
        const heroCard = {
            contentType: 'application/vnd.microsoft.card.hero',
            content: {
                title: title,
                subtitle: subtitle,
                text: text,
                images: images || [],
                buttons: buttons || []
            }
        };
        
        const activity = {
            type: 'message',
            attachments: [heroCard]
        };
        
        return await this.sendActivity(turnContext, activity);
    }

    extractUserMessage(turnContext) {
        const activity = turnContext.activity;
        
        return {
            id: activity.id,
            text: activity.text || '',
            type: activity.type,
            timestamp: activity.timestamp || new Date().toISOString(),
            channelId: activity.channelId,
            conversation: {
                id: activity.conversation?.id,
                conversationType: activity.conversation?.conversationType,
                isGroup: activity.conversation?.isGroup || false
            },
            from: {
                id: activity.from?.id,
                name: activity.from?.name,
                role: activity.from?.role
            },
            recipient: {
                id: activity.recipient?.id,
                name: activity.recipient?.name
            },
            entities: activity.entities || [],
            channelData: activity.channelData || {},
            locale: activity.locale || 'en-US'
        };
    }

    createResponseActivity(originalActivity, responseText, activityType = 'message') {
        return {
            type: activityType,
            text: responseText,
            conversation: originalActivity.conversation,
            from: originalActivity.recipient,
            recipient: originalActivity.from,
            replyToId: originalActivity.id,
            serviceUrl: originalActivity.serviceUrl,
            channelId: originalActivity.channelId,
            timestamp: new Date().toISOString()
        };
    }

    async updateActivity(turnContext, activity) {
        try {
            return await turnContext.updateActivity(activity);
        } catch (error) {
            this.logger.error('Failed to update activity:', error);
            throw error;
        }
    }

    async deleteActivity(turnContext, activityReference) {
        try {
            await turnContext.deleteActivity(activityReference);
            this.logger.debug('Activity deleted successfully', {
                activityId: activityReference.activityId
            });
        } catch (error) {
            this.logger.error('Failed to delete activity:', error);
            throw error;
        }
    }

    getConversationReference(activity) {
        return TurnContext.getConversationReference(activity);
    }

    async continueConversation(conversationReference, logic) {
        try {
            await this.msAdapter.continueConversation(conversationReference, async (turnContext) => {
                await logic(turnContext);
            });
        } catch (error) {
            this.logger.error('Error continuing conversation:', error);
            throw error;
        }
    }

    async createConversation(channelId, serviceUrl, credentials, conversationParameters, logic) {
        try {
            const conversationReference = await this.msAdapter.createConversation(
                channelId,
                serviceUrl,
                credentials,
                conversationParameters,
                async (turnContext) => {
                    await logic(turnContext);
                }
            );
            
            this.logger.info('New conversation created', {
                conversationId: conversationReference.conversation.id,
                channelId: channelId
            });
            
            return conversationReference;
        } catch (error) {
            this.logger.error('Error creating conversation:', error);
            throw error;
        }
    }

    // Cognitive enhancement methods
    enhanceMessageWithCognition(message, cognitiveContext) {
        return {
            ...message,
            cognitive: {
                context: cognitiveContext,
                confidence: cognitiveContext.confidence || 0.5,
                intent: cognitiveContext.intent || 'unknown',
                concepts: cognitiveContext.concepts || [],
                emotions: cognitiveContext.emotions || [],
                timestamp: Date.now()
            }
        };
    }

    createCognitiveResponse(cognitiveOutput, originalMessage) {
        const response = {
            type: 'message',
            text: cognitiveOutput.text || 'I understand.',
            speak: cognitiveOutput.speak || cognitiveOutput.text,
            conversation: originalMessage.conversation,
            cognitive: {
                reasoning: cognitiveOutput.reasoning || [],
                confidence: cognitiveOutput.confidence || 0.5,
                atoms: cognitiveOutput.atoms || [],
                learning: cognitiveOutput.learning || {}
            }
        };

        // Add rich content if available
        if (cognitiveOutput.suggestedActions) {
            response.suggestedActions = {
                actions: cognitiveOutput.suggestedActions.map(action => ({
                    type: 'imBack',
                    title: action.title,
                    value: action.value
                }))
            };
        }

        if (cognitiveOutput.attachments) {
            response.attachments = cognitiveOutput.attachments;
        }

        return response;
    }

    async sendCognitiveResponse(turnContext, cognitiveOutput) {
        const message = this.extractUserMessage(turnContext);
        const response = this.createCognitiveResponse(cognitiveOutput, message);
        
        return await this.sendActivity(turnContext, response);
    }

    // Middleware support for cognitive processing
    use(middleware) {
        this.msAdapter.use(middleware);
    }

    // State management helpers
    async getUserState(turnContext, stateAccessor) {
        return await stateAccessor.get(turnContext, () => ({}));
    }

    async setUserState(turnContext, stateAccessor, state) {
        await stateAccessor.set(turnContext, state);
    }

    async saveState(turnContext, conversationState, userState) {
        await conversationState.saveChanges(turnContext);
        if (userState) {
            await userState.saveChanges(turnContext);
        }
    }

    // Validation methods
    validateActivity(activity) {
        if (!activity) {
            throw new Error('Activity is required');
        }
        
        if (!activity.type) {
            throw new Error('Activity type is required');
        }
        
        if (!activity.conversation || !activity.conversation.id) {
            throw new Error('Conversation ID is required');
        }
        
        return true;
    }

    isValidMessage(activity) {
        return activity.type === 'message' && 
               activity.text && 
               activity.text.trim().length > 0;
    }

    // Performance monitoring
    startPerformanceTimer(operation) {
        return {
            operation,
            startTime: process.hrtime.bigint()
        };
    }

    endPerformanceTimer(timer) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - timer.startTime) / 1000000; // Convert to milliseconds
        
        this.logger.debug(`Operation ${timer.operation} completed`, {
            duration: `${duration.toFixed(2)}ms`,
            operation: timer.operation
        });
        
        return duration;
    }
}

module.exports = { BotFrameworkAdapter };