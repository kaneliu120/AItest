/**
 * Task management validation service
 */

import { 
  CreateTaskInput, 
  UpdateTaskInput, 
  TaskFilter,
  ValidationResult,
  ValidationError
} from '../types';

export class ValidationService {
  validateCreateTask(input: CreateTaskInput): ValidationResult<CreateTaskInput> {
    const errors: ValidationError[] = [];

    if (!input.title || input.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Task title cannot be empty', code: 'REQUIRED' });
    } else if (input.title.length > 200) {
      errors.push({ field: 'title', message: 'Task title cannot exceed 200 characters', code: 'MAX_LENGTH', value: input.title.length });
    }

    if (input.description && input.description.length > 5000) {
      errors.push({ field: 'description', message: 'Description cannot exceed 5000 characters', code: 'MAX_LENGTH' });
    }

    if (input.estimatedHours !== undefined && input.estimatedHours < 0) {
      errors.push({ field: 'estimatedHours', message: 'Estimated hours cannot be negative', code: 'MIN_VALUE' });
    }

    if (input.dueDate) {
      const due = new Date(input.dueDate);
      if (isNaN(due.getTime())) {
        errors.push({ field: 'dueDate', message: 'Due date format is invalid', code: 'INVALID_FORMAT' });
      }
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? input : undefined,
      errors,
      warnings: []
    };
  }

  validateUpdateTask(input: UpdateTaskInput): ValidationResult<UpdateTaskInput> {
    const errors: ValidationError[] = [];

    if (input.title !== undefined) {
      if (input.title.trim().length === 0) {
        errors.push({ field: 'title', message: 'Task title cannot be empty', code: 'REQUIRED' });
      } else if (input.title.length > 200) {
        errors.push({ field: 'title', message: 'Task title cannot exceed 200 characters', code: 'MAX_LENGTH' });
      }
    }

    if (input.estimatedHours !== undefined && input.estimatedHours < 0) {
      errors.push({ field: 'estimatedHours', message: 'Estimated hours cannot be negative', code: 'MIN_VALUE' });
    }

    if (input.actualHours !== undefined && input.actualHours < 0) {
      errors.push({ field: 'actualHours', message: 'Actual hours cannot be negative', code: 'MIN_VALUE' });
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? input : undefined,
      errors,
      warnings: []
    };
  }

  validateTaskFilter(filter: TaskFilter): ValidationResult<TaskFilter> {
    const errors: ValidationError[] = [];

    if (filter.page !== undefined && filter.page < 1) {
      errors.push({ field: 'page', message: 'Page number must be greater than 0', code: 'MIN_VALUE' });
    }

    if (filter.limit !== undefined && (filter.limit < 1 || filter.limit > 100)) {
      errors.push({ field: 'limit', message: 'Items per page must be between 1 and 100', code: 'RANGE_ERROR' });
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? filter : undefined,
      errors,
      warnings: []
    };
  }
}