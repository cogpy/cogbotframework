/**
 * Centralized logging utility with cognitive context awareness
 */

class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.cognitiveContext = new Map();
    }

    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    _formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const contextStr = Object.keys(context).length > 0 ? 
            ` [${JSON.stringify(context)}]` : '';
        
        return `${timestamp} [${level.toUpperCase()}] ${message}${contextStr}`;
    }

    _shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        
        return messageLevelIndex >= currentLevelIndex;
    }

    setCognitiveContext(sessionId, context) {
        this.cognitiveContext.set(sessionId, context);
    }

    getCognitiveContext(sessionId) {
        return this.cognitiveContext.get(sessionId) || {};
    }

    debug(message, context = {}) {
        if (this._shouldLog('debug')) {
            console.log(this._formatMessage('debug', message, context));
        }
    }

    info(message, context = {}) {
        if (this._shouldLog('info')) {
            console.log(this._formatMessage('info', message, context));
        }
    }

    warn(message, context = {}) {
        if (this._shouldLog('warn')) {
            console.warn(this._formatMessage('warn', message, context));
        }
    }

    error(message, error = null, context = {}) {
        if (this._shouldLog('error')) {
            let errorDetails = context;
            if (error) {
                errorDetails = {
                    ...context,
                    error: error.message,
                    stack: error.stack
                };
            }
            console.error(this._formatMessage('error', message, errorDetails));
        }
    }

    cognitive(sessionId, event, data = {}) {
        const cogContext = this.getCognitiveContext(sessionId);
        this.info(`Cognitive Event: ${event}`, {
            sessionId,
            ...cogContext,
            ...data
        });
    }
}

module.exports = { Logger };