/**
 * Blood on the Clocktower Token Generator
 * Custom Error Classes - Standardized error handling
 */

/**
 * Base error class for all token generator errors
 */
export class TokenGeneratorError extends Error {
    constructor(message: string, public cause?: Error) {
        super(message);
        this.name = 'TokenGeneratorError';

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        const ErrorConstructor = Error as any;
        if (ErrorConstructor.captureStackTrace) {
            ErrorConstructor.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Error thrown when data loading fails
 * Used for: JSON file loading, API fetching, example script loading
 */
export class DataLoadError extends TokenGeneratorError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'DataLoadError';
    }
}

/**
 * Error thrown when data validation fails
 * Used for: JSON validation, character validation
 */
export class ValidationError extends TokenGeneratorError {
    constructor(
        message: string,
        public validationErrors: string[] = [],
        cause?: Error
    ) {
        super(message, cause);
        this.name = 'ValidationError';
    }
}

/**
 * Error thrown during token generation
 * Used for: Canvas operations, image loading, token creation
 */
export class TokenCreationError extends TokenGeneratorError {
    constructor(
        message: string,
        public tokenName?: string,
        cause?: Error
    ) {
        super(message, cause);
        this.name = 'TokenCreationError';
    }
}

/**
 * Error thrown during PDF generation
 * Used for: PDF layout, PDF export
 */
export class PDFGenerationError extends TokenGeneratorError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'PDFGenerationError';
    }
}

/**
 * Error thrown during ZIP creation
 * Used for: ZIP file creation, blob conversion
 */
export class ZipCreationError extends TokenGeneratorError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'ZipCreationError';
    }
}

/**
 * Error thrown when required resources are missing
 * Used for: Missing libraries (jsPDF, JSZip, QRCode), missing fonts, missing images
 */
export class ResourceNotFoundError extends TokenGeneratorError {
    constructor(
        message: string,
        public resourceType: 'library' | 'font' | 'image' | 'element',
        public resourceName: string,
        cause?: Error
    ) {
        super(message, cause);
        this.name = 'ResourceNotFoundError';
    }
}

/**
 * Error thrown when UI initialization fails
 * Used for: Missing DOM elements, invalid state
 */
export class UIInitializationError extends TokenGeneratorError {
    constructor(
        message: string,
        public missingElements: string[] = [],
        cause?: Error
    ) {
        super(message, cause);
        this.name = 'UIInitializationError';
    }
}

/**
 * Error handler utility to extract user-friendly messages
 */
export class ErrorHandler {
    /**
     * Get a user-friendly error message from any error
     */
    static getUserMessage(error: unknown): string {
        if (error instanceof ValidationError) {
            const details = error.validationErrors.length > 0
                ? `: ${error.validationErrors.join(', ')}`
                : '';
            return `${error.message}${details}`;
        }

        if (error instanceof TokenCreationError) {
            const tokenInfo = error.tokenName ? ` (${error.tokenName})` : '';
            return `${error.message}${tokenInfo}`;
        }

        if (error instanceof ResourceNotFoundError) {
            return `${error.message}. Please ensure ${error.resourceName} is available.`;
        }

        if (error instanceof TokenGeneratorError) {
            return error.message;
        }

        if (error instanceof Error) {
            return error.message;
        }

        return 'An unknown error occurred';
    }

    /**
     * Log error with appropriate level
     */
    static log(error: unknown, context: string = ''): void {
        const prefix = context ? `[${context}]` : '';

        if (error instanceof ValidationError) {
            console.warn(prefix, error.message, error.validationErrors, error.cause);
        } else if (error instanceof DataLoadError) {
            console.warn(prefix, error.message, error.cause);
        } else if (error instanceof TokenGeneratorError) {
            console.error(prefix, error.message, error.cause);
        } else {
            console.error(prefix, error);
        }
    }

    /**
     * Check if error should be shown to user
     */
    static shouldShowToUser(error: unknown): boolean {
        // All our custom errors should be shown to users
        // System errors or unknown errors should show generic message
        return error instanceof TokenGeneratorError;
    }
}

export default {
    TokenGeneratorError,
    DataLoadError,
    ValidationError,
    TokenCreationError,
    PDFGenerationError,
    ZipCreationError,
    ResourceNotFoundError,
    UIInitializationError,
    ErrorHandler
};
