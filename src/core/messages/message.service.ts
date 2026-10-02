import { CommonSuccessMessages } from './common/success.messages.js';
import { CommonErrorMessages } from './common/error.messages.js';
import { ValidationErrorMessages } from './validation/error.messages.js';

export {
  CommonSuccessMessages,
  CommonErrorMessages,
  ValidationErrorMessages,
};

export type SuccessMessage = CommonSuccessMessages;
export type ErrorMessage = CommonErrorMessages | ValidationErrorMessages;
export type Message = SuccessMessage | ErrorMessage;

export class MessageService {
  private static instance: MessageService;

  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  getMessage(messageKey: Message | string, params?: Record<string, string | number>): string {
    let message = String(messageKey);

    if (params) {
      for (const key of Object.keys(params)) {
        const placeholder = `{${key}}`;
        message = message.replace(new RegExp(placeholder, 'g'), String(params[key]));
      }
    }

    return message;
  }

  getSuccessMessage(
    messageKey: SuccessMessage,
    params?: Record<string, string | number>
  ): string {
    return this.getMessage(messageKey, params);
  }

  getErrorMessage(
    messageKey: ErrorMessage,
    params?: Record<string, string | number>
  ): string {
    return this.getMessage(messageKey, params);
  }

  getValidationErrorMessage(
    messageKey: ValidationErrorMessages,
    params?: Record<string, string | number>
  ): string {
    return this.getMessage(messageKey, params);
  }

  getCommonSuccessMessage(
    messageKey: CommonSuccessMessages,
    params?: Record<string, string | number>
  ): string {
    return this.getMessage(messageKey, params);
  }

  getCommonErrorMessage(
    messageKey: CommonErrorMessages,
    params?: Record<string, string | number>
  ): string {
    return this.getMessage(messageKey, params);
  }
}
